import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";

import { db } from "@/server/db";
import { databaseProperties, databaseViews, databases, pages } from "@/server/db/schema";
import type { PageIcon } from "@/lib/validators/pages";

export interface DbProperty {
  id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  description: string | null;
  position: string;
}

export interface DbView {
  id: string;
  name: string;
  type: string;
  position: string;
  config: Record<string, unknown>;
  isLocked: boolean;
}

export interface DbMeta {
  id: string;
  pageId: string;
  titlePropertyId: string | null;
  defaultViewId: string | null;
  rowOpenMode: string;
}

export interface DatabaseBundle {
  database: DbMeta;
  properties: DbProperty[];
  views: DbView[];
}

export interface DbRow {
  id: string;
  title: string;
  icon: PageIcon | null;
  properties: Record<string, unknown>;
  position: string;
  /** DB-004: timestamps de la página, origen de las propiedades automáticas. */
  createdAt: string;
  updatedAt: string;
}

/** Carga la BD (metadatos, propiedades y vistas) a partir de su página contenedora. */
export async function getDatabaseByPageId(
  workspaceId: string,
  pageId: string,
): Promise<DatabaseBundle | null> {
  const [database] = await db
    .select()
    .from(databases)
    .where(and(eq(databases.pageId, pageId), eq(databases.workspaceId, workspaceId)))
    .limit(1);
  if (!database) return null;

  const [properties, views] = await Promise.all([
    db
      .select()
      .from(databaseProperties)
      .where(eq(databaseProperties.databaseId, database.id))
      .orderBy(asc(databaseProperties.position)),
    db
      .select()
      .from(databaseViews)
      .where(eq(databaseViews.databaseId, database.id))
      .orderBy(asc(databaseViews.position)),
  ]);

  return {
    database: {
      id: database.id,
      pageId: database.pageId,
      titlePropertyId: database.titlePropertyId,
      defaultViewId: database.defaultViewId,
      rowOpenMode: database.rowOpenMode,
    },
    properties: properties.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      config: (p.config as Record<string, unknown>) ?? {},
      description: p.description,
      position: p.position,
    })),
    views: views.map((v) => ({
      id: v.id,
      name: v.name,
      type: v.type,
      position: v.position,
      config: (v.config as Record<string, unknown>) ?? {},
      isLocked: v.isLocked,
    })),
  };
}

/** Filas (páginas kind=row) de una BD, ordenadas por posición. */
export async function getDatabaseRows(workspaceId: string, databaseId: string): Promise<DbRow[]> {
  const rows = await db
    .select({
      id: pages.id,
      title: pages.title,
      icon: pages.icon,
      properties: pages.properties,
      position: pages.position,
      createdAt: pages.createdAt,
      updatedAt: pages.updatedAt,
    })
    .from(pages)
    .where(
      and(
        eq(pages.workspaceId, workspaceId),
        eq(pages.databaseId, databaseId),
        isNull(pages.deletedAt),
      ),
    )
    .orderBy(asc(pages.position));
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    icon: (r.icon as PageIcon | null) ?? null,
    properties: (r.properties as Record<string, unknown>) ?? {},
    position: r.position,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}
