import "server-only";

import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";

import { db } from "@/server/db";
import { pageGroups, pages, pageVisits } from "@/server/db/schema";
import { positionBetween } from "@/lib/positions";
import type { AuthContext } from "@/server/session";
import type { PageIcon } from "@/lib/validators/pages";
import { getSubtreeIds } from "@/server/queries/pages";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | Tx;

/** Posición al final de los hermanos de `parentId` (null = raíz). */
async function endPosition(
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

/** Resuelve la posición a partir de los hermanos `before`/`after` de un drop. */
async function resolvePosition(
  executor: DbOrTx,
  workspaceId: string,
  parentId: string | null,
  beforeId: string | null | undefined,
  afterId: string | null | undefined,
): Promise<string> {
  if (!beforeId && !afterId) {
    return endPosition(executor, workspaceId, parentId);
  }
  const ids = [beforeId, afterId].filter((v): v is string => Boolean(v));
  const rows = await executor
    .select({ id: pages.id, position: pages.position })
    .from(pages)
    .where(and(eq(pages.workspaceId, workspaceId), inArray(pages.id, ids)));
  const posOf = (id: string | null | undefined) =>
    id ? (rows.find((r) => r.id === id)?.position ?? null) : null;
  return positionBetween(posOf(beforeId), posOf(afterId));
}

export interface CreatePageInput {
  parentId?: string | null;
  title?: string;
}

/** NV-002 / PG-004: crea una página (raíz o subpágina) al final de sus hermanos. */
export async function createPage(ctx: AuthContext, input: CreatePageInput) {
  const parentId = input.parentId ?? null;

  return db.transaction(async (tx) => {
    if (parentId) {
      const [parent] = await tx
        .select({ id: pages.id })
        .from(pages)
        .where(
          and(
            eq(pages.id, parentId),
            eq(pages.workspaceId, ctx.workspaceId),
            isNull(pages.deletedAt),
          ),
        )
        .limit(1);
      if (!parent) {
        throw new Error("La página padre no existe");
      }
    }
    const position = await endPosition(tx, ctx.workspaceId, parentId);
    const [page] = await tx
      .insert(pages)
      .values({
        workspaceId: ctx.workspaceId,
        kind: "page",
        parentId,
        position,
        title: input.title ?? "",
      })
      .returning({ id: pages.id, title: pages.title, parentId: pages.parentId });
    return page;
  });
}

/** PG-001: renombra una página. */
export async function renamePage(ctx: AuthContext, id: string, title: string) {
  await db
    .update(pages)
    .set({ title, updatedAt: new Date() })
    .where(and(eq(pages.id, id), eq(pages.workspaceId, ctx.workspaceId)));
}

/** PG-002: fija (o quita) el icono de una página. */
export async function setPageIcon(ctx: AuthContext, id: string, icon: PageIcon | null) {
  await db
    .update(pages)
    .set({ icon, updatedAt: new Date() })
    .where(and(eq(pages.id, id), eq(pages.workspaceId, ctx.workspaceId)));
}

export interface MovePageInput {
  id: string;
  parentId: string | null;
  beforeId?: string | null;
  afterId?: string | null;
}

/** NV-003 / PG-008: mueve una página a otro padre y/o posición, evitando ciclos. */
export async function movePage(ctx: AuthContext, input: MovePageInput) {
  const { id, parentId } = input;
  if (parentId === id) {
    throw new Error("Una página no puede ser su propio padre");
  }

  return db.transaction(async (tx) => {
    const [page] = await tx
      .select({ id: pages.id })
      .from(pages)
      .where(and(eq(pages.id, id), eq(pages.workspaceId, ctx.workspaceId)))
      .limit(1);
    if (!page) throw new Error("La página no existe");

    if (parentId) {
      // No permitir mover una página dentro de su propio subárbol (ciclo).
      const subtree = await getSubtreeIds(ctx.workspaceId, id);
      if (subtree.includes(parentId)) {
        throw new Error("No se puede mover una página dentro de sí misma");
      }
      const [parent] = await tx
        .select({ id: pages.id })
        .from(pages)
        .where(
          and(
            eq(pages.id, parentId),
            eq(pages.workspaceId, ctx.workspaceId),
            isNull(pages.deletedAt),
          ),
        )
        .limit(1);
      if (!parent) throw new Error("La página destino no existe");
    }

    const position = await resolvePosition(
      tx,
      ctx.workspaceId,
      parentId,
      input.beforeId,
      input.afterId,
    );
    await tx
      .update(pages)
      .set({ parentId, position, updatedAt: new Date() })
      .where(and(eq(pages.id, id), eq(pages.workspaceId, ctx.workspaceId)));
  });
}

/** PG-007: duplica una página (y opcionalmente su subárbol). */
export async function duplicatePage(ctx: AuthContext, id: string, withChildren = true) {
  return db.transaction(async (tx) => {
    const [original] = await tx
      .select()
      .from(pages)
      .where(and(eq(pages.id, id), eq(pages.workspaceId, ctx.workspaceId)))
      .limit(1);
    if (!original) throw new Error("La página no existe");

    const position = await endPosition(tx, ctx.workspaceId, original.parentId);

    const [root] = await tx
      .insert(pages)
      .values({
        workspaceId: ctx.workspaceId,
        kind: original.kind,
        parentId: original.parentId,
        position,
        title: `${original.title} (copia)`,
        icon: original.icon,
        cover: original.cover,
        content: original.content,
        contentText: original.contentText,
        properties: original.properties,
        fullWidth: original.fullWidth,
        smallText: original.smallText,
        font: original.font,
        showToc: original.showToc,
        wordCount: original.wordCount,
      })
      .returning({ id: pages.id });

    if (withChildren) {
      // Copia el subárbol nivel a nivel, remapeando parent_id.
      let frontier: Array<{ oldId: string; newId: string }> = [
        { oldId: original.id, newId: root.id },
      ];
      while (frontier.length > 0) {
        const oldIds = frontier.map((f) => f.oldId);
        const children = await tx
          .select()
          .from(pages)
          .where(
            and(
              eq(pages.workspaceId, ctx.workspaceId),
              inArray(pages.parentId, oldIds),
              isNull(pages.deletedAt),
            ),
          )
          .orderBy(asc(pages.position));
        const next: Array<{ oldId: string; newId: string }> = [];
        for (const child of children) {
          const newParentId = frontier.find((f) => f.oldId === child.parentId)?.newId;
          if (!newParentId) continue;
          const [copy] = await tx
            .insert(pages)
            .values({
              workspaceId: ctx.workspaceId,
              kind: child.kind,
              parentId: newParentId,
              position: child.position,
              title: child.title,
              icon: child.icon,
              cover: child.cover,
              content: child.content,
              contentText: child.contentText,
              properties: child.properties,
              fullWidth: child.fullWidth,
              smallText: child.smallText,
              font: child.font,
              showToc: child.showToc,
              wordCount: child.wordCount,
            })
            .returning({ id: pages.id });
          next.push({ oldId: child.id, newId: copy.id });
        }
        frontier = next;
      }
    }

    return { id: root.id };
  });
}

/** PG-009: envía una página (y su subárbol) a la papelera. */
export async function trashPage(ctx: AuthContext, id: string) {
  const subtree = await getSubtreeIds(ctx.workspaceId, id);
  if (subtree.length === 0) throw new Error("La página no existe");
  const now = new Date();
  await db
    .update(pages)
    .set({ deletedAt: now, updatedAt: now, isFavorite: false, favoritePosition: null })
    .where(and(eq(pages.workspaceId, ctx.workspaceId), inArray(pages.id, subtree)));
}

/** PG-009: restaura una página de la papelera (a su padre original o a la raíz). */
export async function restorePage(ctx: AuthContext, id: string) {
  return db.transaction(async (tx) => {
    const [page] = await tx
      .select({ id: pages.id, parentId: pages.parentId })
      .from(pages)
      .where(and(eq(pages.id, id), eq(pages.workspaceId, ctx.workspaceId)))
      .limit(1);
    if (!page) throw new Error("La página no existe");

    // ¿El padre original sigue existiendo y fuera de la papelera?
    let targetParent: string | null = null;
    if (page.parentId) {
      const [parent] = await tx
        .select({ id: pages.id })
        .from(pages)
        .where(
          and(
            eq(pages.id, page.parentId),
            eq(pages.workspaceId, ctx.workspaceId),
            isNull(pages.deletedAt),
          ),
        )
        .limit(1);
      targetParent = parent ? parent.id : null;
    }

    const subtree = await getSubtreeIds(ctx.workspaceId, id);
    const now = new Date();
    await tx
      .update(pages)
      .set({ deletedAt: null, updatedAt: now })
      .where(and(eq(pages.workspaceId, ctx.workspaceId), inArray(pages.id, subtree)));

    const position = await endPosition(tx, ctx.workspaceId, targetParent);
    await tx
      .update(pages)
      .set({ parentId: targetParent, position, updatedAt: now })
      .where(and(eq(pages.id, id), eq(pages.workspaceId, ctx.workspaceId)));
  });
}

/** PG-009: elimina definitivamente una página y su subárbol. */
export async function permanentlyDeletePage(ctx: AuthContext, id: string) {
  const subtree = await getSubtreeIds(ctx.workspaceId, id);
  if (subtree.length === 0) return;
  await db
    .delete(pages)
    .where(and(eq(pages.workspaceId, ctx.workspaceId), inArray(pages.id, subtree)));
}

/** PG-009: vacía la papelera por completo. */
export async function emptyTrash(ctx: AuthContext) {
  await db
    .delete(pages)
    .where(and(eq(pages.workspaceId, ctx.workspaceId), sql`${pages.deletedAt} is not null`));
}

/** NV-004: marca/desmarca una página como favorita. */
export async function setFavorite(ctx: AuthContext, id: string, favorite: boolean) {
  if (!favorite) {
    await db
      .update(pages)
      .set({ isFavorite: false, favoritePosition: null, updatedAt: new Date() })
      .where(and(eq(pages.id, id), eq(pages.workspaceId, ctx.workspaceId)));
    return;
  }
  const [last] = await db
    .select({ position: pages.favoritePosition })
    .from(pages)
    .where(and(eq(pages.workspaceId, ctx.workspaceId), eq(pages.isFavorite, true)))
    .orderBy(desc(pages.favoritePosition))
    .limit(1);
  const favoritePosition = positionBetween(last?.position ?? null, null);
  await db
    .update(pages)
    .set({ isFavorite: true, favoritePosition, updatedAt: new Date() })
    .where(and(eq(pages.id, id), eq(pages.workspaceId, ctx.workspaceId)));
}

// =============================== Grupos ======================================

/** Crea un grupo del sidebar al final de la lista. */
export async function createGroup(ctx: AuthContext, name: string) {
  const [last] = await db
    .select({ position: pageGroups.position })
    .from(pageGroups)
    .where(eq(pageGroups.workspaceId, ctx.workspaceId))
    .orderBy(desc(pageGroups.position))
    .limit(1);
  const position = positionBetween(last?.position ?? null, null);
  const [group] = await db
    .insert(pageGroups)
    .values({ workspaceId: ctx.workspaceId, name, position })
    .returning({ id: pageGroups.id });
  return group;
}

/** Renombra un grupo. */
export async function renameGroup(ctx: AuthContext, id: string, name: string) {
  await db
    .update(pageGroups)
    .set({ name, updatedAt: new Date() })
    .where(and(eq(pageGroups.id, id), eq(pageGroups.workspaceId, ctx.workspaceId)));
}

/** Elimina un grupo. Las páginas vuelven a la sección "Páginas" (group_id = null). */
export async function deleteGroup(ctx: AuthContext, id: string) {
  await db
    .delete(pageGroups)
    .where(and(eq(pageGroups.id, id), eq(pageGroups.workspaceId, ctx.workspaceId)));
}

/**
 * Asigna páginas a un grupo (o las saca, con groupId = null). Al asignarlas las
 * promueve a raíz dentro del grupo (como hace Notion al mover una página a una
 * sección del sidebar).
 */
export async function assignPagesToGroup(ctx: AuthContext, ids: string[], groupId: string | null) {
  if (groupId) {
    const [group] = await db
      .select({ id: pageGroups.id })
      .from(pageGroups)
      .where(and(eq(pageGroups.id, groupId), eq(pageGroups.workspaceId, ctx.workspaceId)))
      .limit(1);
    if (!group) throw new Error("El grupo no existe");
  }
  await db.transaction(async (tx) => {
    for (const id of ids) {
      const position = await endPosition(tx, ctx.workspaceId, null);
      await tx
        .update(pages)
        .set({ groupId, parentId: null, position, updatedAt: new Date() })
        .where(and(eq(pages.id, id), eq(pages.workspaceId, ctx.workspaceId)));
    }
  });
}

/** Guarda las tarjetas flotantes del lienzo de la página. */
export async function setPageCards(ctx: AuthContext, pageId: string, cards: unknown[]) {
  await db
    .update(pages)
    .set({ cards, updatedAt: new Date() })
    .where(and(eq(pages.id, pageId), eq(pages.workspaceId, ctx.workspaceId)));
}

/** NV-009: registra una visita a la página (para "Recientes"). */
export async function recordVisit(ctx: AuthContext, id: string) {
  const now = new Date();
  const updated = await db
    .update(pages)
    .set({ lastVisitedAt: now })
    .where(and(eq(pages.id, id), eq(pages.workspaceId, ctx.workspaceId)))
    .returning({ id: pages.id });
  if (updated.length > 0) {
    await db.insert(pageVisits).values({ pageId: id, visitedAt: now });
  }
}
