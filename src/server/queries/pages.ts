import "server-only";

import { and, asc, desc, eq, inArray, isNull, isNotNull, sql } from "drizzle-orm";

import { db } from "@/server/db";
import { pages } from "@/server/db/schema";
import type { PageIcon } from "@/lib/validators/pages";
import { HL_END, HL_START } from "@/lib/search";

export interface SidebarNode {
  id: string;
  title: string;
  icon: PageIcon | null;
  kind: "page" | "database" | "row" | "template";
  position: string;
  isFavorite: boolean;
  hasChildren: boolean;
}

// Subconsulta: ¿el nodo tiene hijos no eliminados? Para pintar el chevron.
const hasChildrenExpr = sql<boolean>`exists (
  select 1 from ${pages} as child
  where child.parent_id = ${pages.id} and child.deleted_at is null
)`;

const sidebarColumns = {
  id: pages.id,
  title: pages.title,
  icon: pages.icon,
  kind: pages.kind,
  position: pages.position,
  isFavorite: pages.isFavorite,
  hasChildren: hasChildrenExpr,
};

function mapNode(row: {
  id: string;
  title: string;
  icon: unknown;
  kind: SidebarNode["kind"];
  position: string;
  isFavorite: boolean;
  hasChildren: boolean;
}): SidebarNode {
  return {
    id: row.id,
    title: row.title,
    icon: (row.icon as PageIcon | null) ?? null,
    kind: row.kind,
    position: row.position,
    isFavorite: row.isFavorite,
    hasChildren: row.hasChildren,
  };
}

/** Páginas raíz del workspace (NV-001). Carga perezosa: solo el primer nivel. */
export async function getRootPages(workspaceId: string): Promise<SidebarNode[]> {
  const rows = await db
    .select(sidebarColumns)
    .from(pages)
    .where(
      and(
        eq(pages.workspaceId, workspaceId),
        isNull(pages.parentId),
        isNull(pages.deletedAt),
        isNull(pages.databaseId),
      ),
    )
    .orderBy(asc(pages.position));
  return rows.map(mapNode);
}

/** Hijos directos de una página (carga perezosa al expandir). */
export async function getChildPages(workspaceId: string, parentId: string): Promise<SidebarNode[]> {
  const rows = await db
    .select(sidebarColumns)
    .from(pages)
    .where(
      and(
        eq(pages.workspaceId, workspaceId),
        eq(pages.parentId, parentId),
        isNull(pages.deletedAt),
      ),
    )
    .orderBy(asc(pages.position));
  return rows.map(mapNode);
}

/** Favoritos (NV-005), ordenados por su posición propia. */
export async function getFavoritePages(workspaceId: string): Promise<SidebarNode[]> {
  const rows = await db
    .select(sidebarColumns)
    .from(pages)
    .where(
      and(eq(pages.workspaceId, workspaceId), eq(pages.isFavorite, true), isNull(pages.deletedAt)),
    )
    .orderBy(asc(pages.favoritePosition), asc(pages.position));
  return rows.map(mapNode);
}

export interface RecentPage {
  id: string;
  title: string;
  icon: PageIcon | null;
  lastVisitedAt: Date | null;
}

/** Páginas visitadas recientemente (NV-009). */
export async function getRecentPages(workspaceId: string, limit = 10): Promise<RecentPage[]> {
  const rows = await db
    .select({
      id: pages.id,
      title: pages.title,
      icon: pages.icon,
      lastVisitedAt: pages.lastVisitedAt,
    })
    .from(pages)
    .where(
      and(
        eq(pages.workspaceId, workspaceId),
        isNotNull(pages.lastVisitedAt),
        isNull(pages.deletedAt),
      ),
    )
    .orderBy(desc(pages.lastVisitedAt))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    icon: (r.icon as PageIcon | null) ?? null,
    lastVisitedAt: r.lastVisitedAt,
  }));
}

export interface TrashedPage {
  id: string;
  title: string;
  icon: PageIcon | null;
  deletedAt: Date | null;
}

/**
 * Papelera (PG-009). Muestra solo las raíces de cada borrado (páginas cuyo padre
 * no está también en la papelera), para no repetir subárboles completos.
 */
export async function getTrashedPages(workspaceId: string): Promise<TrashedPage[]> {
  const parent = db
    .$with("parent")
    .as(db.select({ id: pages.id, deletedAt: pages.deletedAt }).from(pages));
  const rows = await db
    .with(parent)
    .select({
      id: pages.id,
      title: pages.title,
      icon: pages.icon,
      deletedAt: pages.deletedAt,
    })
    .from(pages)
    .leftJoin(parent, eq(pages.parentId, parent.id))
    .where(
      and(
        eq(pages.workspaceId, workspaceId),
        isNotNull(pages.deletedAt),
        // raíz del borrado: sin padre, o con padre que no está en papelera
        sql`(${pages.parentId} is null or ${parent.deletedAt} is null)`,
      ),
    )
    .orderBy(desc(pages.deletedAt));
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    icon: (r.icon as PageIcon | null) ?? null,
    deletedAt: r.deletedAt,
  }));
}

export interface Breadcrumb {
  id: string;
  title: string;
  icon: PageIcon | null;
}

/** Ruta de ancestros de una página (NV-007), de la raíz a la propia página. */
export async function getBreadcrumbs(workspaceId: string, pageId: string): Promise<Breadcrumb[]> {
  const rows = await db.execute<{
    id: string;
    title: string;
    icon: PageIcon | null;
    depth: number;
  }>(sql`
    with recursive chain as (
      select id, parent_id, title, icon, 0 as depth
      from ${pages}
      where id = ${pageId} and workspace_id = ${workspaceId}
      union all
      select p.id, p.parent_id, p.title, p.icon, chain.depth + 1
      from ${pages} p
      join chain on p.id = chain.parent_id
    )
    select id, title, icon, depth from chain order by depth desc
  `);
  return rows.rows.map((r) => ({
    id: r.id,
    title: r.title,
    icon: (r.icon as PageIcon | null) ?? null,
  }));
}

export type FullPage = typeof pages.$inferSelect;

/** Carga una página completa (contenido + metadatos). Filtra por workspace. */
export async function getPage(workspaceId: string, pageId: string): Promise<FullPage | null> {
  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.workspaceId, workspaceId)))
    .limit(1);
  return page ?? null;
}

export interface TitleMatch {
  id: string;
  title: string;
  icon: PageIcon | null;
}

/**
 * Búsqueda difusa por título (SR-001 / PG-008). Usa similitud trigram (pg_trgm)
 * con unaccent para tolerar tildes, combinada con coincidencia por substring.
 */
export async function searchPagesByTitle(
  workspaceId: string,
  query: string,
  options: { excludeIds?: string[]; limit?: number } = {},
): Promise<TitleMatch[]> {
  const q = query.trim();
  const limit = options.limit ?? 20;
  const exclude = options.excludeIds ?? [];

  const base = and(
    eq(pages.workspaceId, workspaceId),
    isNull(pages.deletedAt),
    isNull(pages.databaseId),
    exclude.length > 0 ? sql`${pages.id} <> all(${exclude})` : undefined,
  );

  if (q.length === 0) {
    const rows = await db
      .select({ id: pages.id, title: pages.title, icon: pages.icon })
      .from(pages)
      .where(base)
      .orderBy(desc(pages.lastVisitedAt))
      .limit(limit);
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      icon: (r.icon as PageIcon | null) ?? null,
    }));
  }

  const rows = await db
    .select({
      id: pages.id,
      title: pages.title,
      icon: pages.icon,
      sim: sql<number>`similarity(immutable_unaccent(${pages.title}), immutable_unaccent(${q}))`,
    })
    .from(pages)
    .where(
      and(
        base,
        sql`(immutable_unaccent(${pages.title}) ilike '%' || immutable_unaccent(${q}) || '%'
          or immutable_unaccent(${pages.title}) % immutable_unaccent(${q}))`,
      ),
    )
    .orderBy(desc(sql`similarity(immutable_unaccent(${pages.title}), immutable_unaccent(${q}))`))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    icon: (r.icon as PageIcon | null) ?? null,
  }));
}

export interface FullTextMatch {
  id: string;
  title: string;
  icon: PageIcon | null;
  snippet: string;
}

/**
 * Búsqueda full-text (SR-002): tsvector en español con unaccent (tildes o sin
 * ellas), ranking por relevancia y fragmentos resaltados con ts_headline.
 */
export async function searchFullText(
  workspaceId: string,
  query: string,
  limit = 20,
): Promise<FullTextMatch[]> {
  const q = query.trim();
  if (q.length === 0) return [];

  const rows = await db.execute<{
    id: string;
    title: string;
    icon: PageIcon | null;
    snippet: string;
  }>(sql`
    with q as (
      select plainto_tsquery('spanish', immutable_unaccent(${q})) as query
    )
    select
      p.id,
      p.title,
      p.icon,
      ts_headline(
        'spanish',
        immutable_unaccent(p.content_text),
        q.query,
        ${"StartSel=" + HL_START + ",StopSel=" + HL_END + ",MaxFragments=1,MaxWords=18,MinWords=4,ShortWord=2"}
      ) as snippet
    from ${pages} p, q
    where p.workspace_id = ${workspaceId}
      and p.deleted_at is null
      and p.database_id is null
      and p.search_vector @@ q.query
    order by ts_rank(p.search_vector, q.query) desc
    limit ${limit}
  `);

  return rows.rows.map((r) => ({
    id: r.id,
    title: r.title,
    icon: (r.icon as PageIcon | null) ?? null,
    snippet: r.snippet ?? "",
  }));
}

/** Devuelve los ids de un subárbol (la página y todos sus descendientes). */
export async function getSubtreeIds(workspaceId: string, pageId: string): Promise<string[]> {
  const rows = await db.execute<{ id: string }>(sql`
    with recursive subtree as (
      select id from ${pages}
      where id = ${pageId} and workspace_id = ${workspaceId}
      union all
      select p.id from ${pages} p
      join subtree on p.parent_id = subtree.id
    )
    select id from subtree
  `);
  return rows.rows.map((r) => r.id);
}

/** Comprueba que un conjunto de ids pertenece al workspace (defensa en profundidad). */
export async function assertPagesInWorkspace(workspaceId: string, ids: string[]): Promise<boolean> {
  if (ids.length === 0) return true;
  const rows = await db
    .select({ id: pages.id })
    .from(pages)
    .where(and(eq(pages.workspaceId, workspaceId), inArray(pages.id, ids)));
  return rows.length === ids.length;
}
