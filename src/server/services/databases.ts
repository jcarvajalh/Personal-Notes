import "server-only";

import { and, asc, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/server/db";
import { databaseProperties, databaseViews, databases, pages } from "@/server/db/schema";
import { positionBetween } from "@/lib/positions";
import { defaultConfigFor, VIEW_LABELS } from "@/lib/database/types";
import type { AuthContext } from "@/server/session";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | Tx;

/** Posición al final de los hermanos (null = raíz) en el árbol de páginas. */
async function endSiblingPosition(
  executor: DbOrTx,
  workspaceId: string,
  parentId: string | null,
): Promise<string> {
  const [last] = await executor
    .select({ position: pages.position })
    .from(pages)
    .where(
      and(
        eq(pages.workspaceId, workspaceId),
        parentId === null ? isNull(pages.parentId) : eq(pages.parentId, parentId),
        isNull(pages.deletedAt),
      ),
    )
    .orderBy(desc(pages.position))
    .limit(1);
  return positionBetween(last?.position ?? null, null);
}

/** Verifica que la BD pertenece al workspace del usuario y la devuelve. */
async function assertDatabase(executor: DbOrTx, ctx: AuthContext, databaseId: string) {
  const [database] = await executor
    .select()
    .from(databases)
    .where(and(eq(databases.id, databaseId), eq(databases.workspaceId, ctx.workspaceId)))
    .limit(1);
  if (!database) throw new Error("La base de datos no existe");
  return database;
}

/** DB-001: crea una base de datos (página kind=database) con Title + vista Tabla. */
export async function createDatabase(
  ctx: AuthContext,
  input: { parentId?: string | null; title?: string; viewType?: string; isInline?: boolean },
) {
  const parentId = input.parentId ?? null;
  const viewType = input.viewType ?? "table";
  const isInline = input.isInline ?? false;
  return db.transaction(async (tx) => {
    const position = await endSiblingPosition(tx, ctx.workspaceId, parentId);
    const [page] = await tx
      .insert(pages)
      .values({
        workspaceId: ctx.workspaceId,
        kind: "database",
        parentId,
        position,
        title: input.title ?? "",
      })
      .returning({ id: pages.id });

    const [database] = await tx
      .insert(databases)
      .values({ workspaceId: ctx.workspaceId, pageId: page.id, isInline })
      .returning({ id: databases.id });

    const [titleProp] = await tx
      .insert(databaseProperties)
      .values({
        databaseId: database.id,
        name: "Nombre",
        type: "title",
        config: {},
        position: positionBetween(null, null),
      })
      .returning({ id: databaseProperties.id });

    const [view] = await tx
      .insert(databaseViews)
      .values({
        databaseId: database.id,
        name: VIEW_LABELS[viewType] ?? "Tabla",
        type: viewType as (typeof databaseViews.$inferInsert)["type"],
        position: positionBetween(null, null),
        config: {},
      })
      .returning({ id: databaseViews.id });

    await tx
      .update(databases)
      .set({ titlePropertyId: titleProp.id, defaultViewId: view.id })
      .where(eq(databases.id, database.id));

    return { pageId: page.id, databaseId: database.id };
  });
}

/** DB-002: añade una propiedad al final. */
export async function addProperty(
  ctx: AuthContext,
  input: { databaseId: string; type: string; name: string },
) {
  return db.transaction(async (tx) => {
    await assertDatabase(tx, ctx, input.databaseId);
    const [last] = await tx
      .select({ position: databaseProperties.position })
      .from(databaseProperties)
      .where(eq(databaseProperties.databaseId, input.databaseId))
      .orderBy(desc(databaseProperties.position))
      .limit(1);
    const [prop] = await tx
      .insert(databaseProperties)
      .values({
        databaseId: input.databaseId,
        name: input.name,
        type: input.type as (typeof databaseProperties.$inferInsert)["type"],
        config: defaultConfigFor(input.type),
        position: positionBetween(last?.position ?? null, null),
      })
      .returning({ id: databaseProperties.id });
    return { id: prop.id };
  });
}

/** DB-002: renombra una propiedad. */
export async function renameProperty(ctx: AuthContext, propertyId: string, name: string) {
  const [prop] = await db
    .select({ databaseId: databaseProperties.databaseId })
    .from(databaseProperties)
    .where(eq(databaseProperties.id, propertyId))
    .limit(1);
  if (!prop) throw new Error("La propiedad no existe");
  await assertDatabase(db, ctx, prop.databaseId);
  await db
    .update(databaseProperties)
    .set({ name, updatedAt: new Date() })
    .where(eq(databaseProperties.id, propertyId));
}

/** DB-013: actualiza la configuración de una propiedad (p. ej. opciones de select). */
export async function updatePropertyConfig(
  ctx: AuthContext,
  propertyId: string,
  config: Record<string, unknown>,
) {
  const [prop] = await db
    .select({ databaseId: databaseProperties.databaseId })
    .from(databaseProperties)
    .where(eq(databaseProperties.id, propertyId))
    .limit(1);
  if (!prop) throw new Error("La propiedad no existe");
  await assertDatabase(db, ctx, prop.databaseId);
  await db
    .update(databaseProperties)
    .set({ config, updatedAt: new Date() })
    .where(eq(databaseProperties.id, propertyId));
}

/** DB-002: elimina una propiedad (no se permite borrar la Title). */
export async function deleteProperty(ctx: AuthContext, propertyId: string) {
  const [prop] = await db
    .select({ databaseId: databaseProperties.databaseId, type: databaseProperties.type })
    .from(databaseProperties)
    .where(eq(databaseProperties.id, propertyId))
    .limit(1);
  if (!prop) throw new Error("La propiedad no existe");
  if (prop.type === "title") throw new Error("No se puede eliminar la propiedad de título");
  await assertDatabase(db, ctx, prop.databaseId);
  await db.delete(databaseProperties).where(eq(databaseProperties.id, propertyId));
}

/** DB-001: crea una fila (página kind=row) al final de la BD. */
export async function createRow(ctx: AuthContext, databaseId: string) {
  return db.transaction(async (tx) => {
    await assertDatabase(tx, ctx, databaseId);
    const [last] = await tx
      .select({ position: pages.position })
      .from(pages)
      .where(and(eq(pages.databaseId, databaseId), isNull(pages.deletedAt)))
      .orderBy(desc(pages.position))
      .limit(1);
    const [row] = await tx
      .insert(pages)
      .values({
        workspaceId: ctx.workspaceId,
        kind: "row",
        databaseId,
        position: positionBetween(last?.position ?? null, null),
        title: "",
      })
      .returning({ id: pages.id });
    return { id: row.id };
  });
}

/** Actualiza el valor de una propiedad de una fila (pages.properties[propertyId]). */
export async function updateRowValue(
  ctx: AuthContext,
  input: { pageId: string; propertyId: string; value: unknown },
) {
  const [row] = await db
    .select({ properties: pages.properties, databaseId: pages.databaseId })
    .from(pages)
    .where(and(eq(pages.id, input.pageId), eq(pages.workspaceId, ctx.workspaceId)))
    .limit(1);
  if (!row || !row.databaseId) throw new Error("La fila no existe");
  const current = (row.properties as Record<string, unknown>) ?? {};
  const next = { ...current };
  if (input.value === null || input.value === undefined || input.value === "") {
    delete next[input.propertyId];
  } else {
    next[input.propertyId] = input.value;
  }
  const now = new Date();
  await db
    .update(pages)
    .set({ properties: next, updatedAt: now, contentEditedAt: now })
    .where(and(eq(pages.id, input.pageId), eq(pages.workspaceId, ctx.workspaceId)));
}

/** DB-020: crea una vista de un tipo dado al final de las pestañas. */
export async function createView(
  ctx: AuthContext,
  input: { databaseId: string; type: string; name: string },
) {
  return db.transaction(async (tx) => {
    await assertDatabase(tx, ctx, input.databaseId);
    const [last] = await tx
      .select({ position: databaseViews.position })
      .from(databaseViews)
      .where(eq(databaseViews.databaseId, input.databaseId))
      .orderBy(desc(databaseViews.position))
      .limit(1);
    const [view] = await tx
      .insert(databaseViews)
      .values({
        databaseId: input.databaseId,
        name: input.name,
        type: input.type as (typeof databaseViews.$inferInsert)["type"],
        position: positionBetween(last?.position ?? null, null),
        config: {},
      })
      .returning({ id: databaseViews.id });
    return { id: view.id };
  });
}

/** DB-040/041/042: guarda la configuración de una vista (filtros, orden, grupo…). */
export async function setViewConfig(
  ctx: AuthContext,
  viewId: string,
  config: Record<string, unknown>,
) {
  const view = await viewInWorkspace(ctx, viewId);
  await db
    .update(databaseViews)
    .set({ config, updatedAt: new Date() })
    .where(eq(databaseViews.id, view.id));
}

/** DB-020: renombra una vista. */
export async function renameView(ctx: AuthContext, viewId: string, name: string) {
  const view = await viewInWorkspace(ctx, viewId);
  await db
    .update(databaseViews)
    .set({ name, updatedAt: new Date() })
    .where(eq(databaseViews.id, view.id));
}

/** DB-020: elimina una vista (no la última). */
export async function deleteView(ctx: AuthContext, viewId: string) {
  const view = await viewInWorkspace(ctx, viewId);
  const remaining = await db
    .select({ id: databaseViews.id })
    .from(databaseViews)
    .where(eq(databaseViews.databaseId, view.databaseId));
  if (remaining.length <= 1) throw new Error("La base de datos debe tener al menos una vista");
  await db.delete(databaseViews).where(eq(databaseViews.id, viewId));
}

async function viewInWorkspace(ctx: AuthContext, viewId: string) {
  const [view] = await db
    .select({ id: databaseViews.id, databaseId: databaseViews.databaseId })
    .from(databaseViews)
    .where(eq(databaseViews.id, viewId))
    .limit(1);
  if (!view) throw new Error("La vista no existe");
  await assertDatabase(db, ctx, view.databaseId);
  return view;
}

/** Ordena las propiedades de una BD por su posición (title primero). */
export async function listProperties(databaseId: string) {
  return db
    .select()
    .from(databaseProperties)
    .where(eq(databaseProperties.databaseId, databaseId))
    .orderBy(asc(databaseProperties.position));
}
