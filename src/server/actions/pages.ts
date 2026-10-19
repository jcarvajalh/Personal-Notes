"use server";

import { revalidatePath } from "next/cache";

import { requireUser, UnauthorizedError } from "@/server/session";
import { ActionResult, fail, ok } from "@/lib/result";
import {
  assignGroupSchema,
  createGroupSchema,
  createPageSchema,
  duplicatePageSchema,
  groupIdSchema,
  movePageSchema,
  pageIdSchema,
  pageIdsSchema,
  renameGroupSchema,
  renamePageSchema,
  savePageCardsSchema,
  savePageContentSchema,
  setFavoritesSchema,
  setPageIconSchema,
  toggleFavoriteSchema,
} from "@/lib/validators/pages";
import * as pageService from "@/server/services/pages";
import { savePageContent, type SaveContentResult } from "@/server/services/page-content";
import {
  getBreadcrumbs,
  getChildPages,
  getFavoritePages,
  getGroups,
  getRecentPages,
  getRootPages,
  getTrashedPages,
  searchFullText,
  searchPagesByTitle,
  type Breadcrumb,
  type FullTextMatch,
  type PageGroup,
  type RecentPage,
  type SidebarNode,
  type TitleMatch,
  type TrashedPage,
} from "@/server/queries/pages";

// --- helper: ejecuta la acción capturando errores a un ActionResult ----------
async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return ok(await fn());
  } catch (error) {
    if (error instanceof UnauthorizedError) return fail("No autenticado");
    const message = error instanceof Error ? error.message : "Error desconocido";
    return fail(message);
  }
}

// =============================== Lecturas ====================================
// Usadas por TanStack Query en el cliente. Lanzan si no hay sesión (React Query
// las trata como error); siempre filtran por workspace del usuario.

export async function listRootPages(): Promise<SidebarNode[]> {
  const ctx = await requireUser();
  return getRootPages(ctx.workspaceId);
}

export async function listChildPages(parentId: string): Promise<SidebarNode[]> {
  const ctx = await requireUser();
  return getChildPages(ctx.workspaceId, parentId);
}

export async function listFavorites(): Promise<SidebarNode[]> {
  const ctx = await requireUser();
  return getFavoritePages(ctx.workspaceId);
}

export async function listRecents(limit = 10): Promise<RecentPage[]> {
  const ctx = await requireUser();
  return getRecentPages(ctx.workspaceId, limit);
}

export async function listTrash(): Promise<TrashedPage[]> {
  const ctx = await requireUser();
  return getTrashedPages(ctx.workspaceId);
}

export async function listBreadcrumbs(pageId: string): Promise<Breadcrumb[]> {
  const ctx = await requireUser();
  return getBreadcrumbs(ctx.workspaceId, pageId);
}

export async function listGroups(): Promise<PageGroup[]> {
  const ctx = await requireUser();
  return getGroups(ctx.workspaceId);
}

export async function searchPages(query: string, excludeIds?: string[]): Promise<TitleMatch[]> {
  const ctx = await requireUser();
  return searchPagesByTitle(ctx.workspaceId, query, { excludeIds });
}

export async function searchContent(query: string): Promise<FullTextMatch[]> {
  const ctx = await requireUser();
  return searchFullText(ctx.workspaceId, query);
}

// =============================== Mutaciones ==================================

export async function createPageAction(input: {
  parentId?: string | null;
  title?: string;
}): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const ctx = await requireUser();
    const parsed = createPageSchema.parse(input);
    const page = await pageService.createPage(ctx, parsed);
    revalidatePath("/", "layout");
    return { id: page.id };
  });
}

export async function renamePageAction(input: {
  id: string;
  title: string;
}): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requireUser();
    const parsed = renamePageSchema.parse(input);
    await pageService.renamePage(ctx, parsed.id, parsed.title);
    revalidatePath("/", "layout");
    return undefined;
  });
}

export async function setPageIconAction(input: {
  id: string;
  icon: { type: "emoji" | "icon" | "file"; value: string; color?: string } | null;
}): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requireUser();
    const parsed = setPageIconSchema.parse(input);
    await pageService.setPageIcon(ctx, parsed.id, parsed.icon);
    revalidatePath("/", "layout");
    return undefined;
  });
}

export async function movePageAction(input: {
  id: string;
  parentId: string | null;
  beforeId?: string | null;
  afterId?: string | null;
}): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requireUser();
    const parsed = movePageSchema.parse(input);
    await pageService.movePage(ctx, parsed);
    revalidatePath("/", "layout");
    return undefined;
  });
}

export async function duplicatePageAction(input: {
  id: string;
  withChildren?: boolean;
}): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const ctx = await requireUser();
    const parsed = duplicatePageSchema.parse(input);
    const result = await pageService.duplicatePage(ctx, parsed.id, parsed.withChildren);
    revalidatePath("/", "layout");
    return result;
  });
}

export async function trashPageAction(input: { id: string }): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requireUser();
    const parsed = pageIdSchema.parse(input);
    await pageService.trashPage(ctx, parsed.id);
    revalidatePath("/", "layout");
    return undefined;
  });
}

export async function restorePageAction(input: { id: string }): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requireUser();
    const parsed = pageIdSchema.parse(input);
    await pageService.restorePage(ctx, parsed.id);
    revalidatePath("/", "layout");
    return undefined;
  });
}

export async function permanentlyDeletePageAction(input: { id: string }): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requireUser();
    const parsed = pageIdSchema.parse(input);
    await pageService.permanentlyDeletePage(ctx, parsed.id);
    revalidatePath("/", "layout");
    return undefined;
  });
}

export async function emptyTrashAction(): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requireUser();
    await pageService.emptyTrash(ctx);
    revalidatePath("/", "layout");
    return undefined;
  });
}

export async function toggleFavoriteAction(input: {
  id: string;
  favorite: boolean;
}): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requireUser();
    const parsed = toggleFavoriteSchema.parse(input);
    await pageService.setFavorite(ctx, parsed.id, parsed.favorite);
    revalidatePath("/", "layout");
    return undefined;
  });
}

/** Multiselección: envía varias páginas (y sus subárboles) a la papelera. */
export async function trashPagesAction(input: { ids: string[] }): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requireUser();
    const { ids } = pageIdsSchema.parse(input);
    for (const id of ids) await pageService.trashPage(ctx, id);
    revalidatePath("/", "layout");
    return undefined;
  });
}

/** Multiselección: marca o desmarca varias páginas como favoritas. */
export async function setFavoritePagesAction(input: {
  ids: string[];
  favorite: boolean;
}): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requireUser();
    const { ids, favorite } = setFavoritesSchema.parse(input);
    for (const id of ids) await pageService.setFavorite(ctx, id, favorite);
    revalidatePath("/", "layout");
    return undefined;
  });
}

// =============================== Grupos ======================================

export async function createGroupAction(input: {
  name?: string;
}): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const ctx = await requireUser();
    const parsed = createGroupSchema.parse(input);
    const group = await pageService.createGroup(ctx, parsed.name ?? "Nuevo grupo");
    revalidatePath("/", "layout");
    return group;
  });
}

export async function renameGroupAction(input: {
  id: string;
  name: string;
}): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requireUser();
    const parsed = renameGroupSchema.parse(input);
    await pageService.renameGroup(ctx, parsed.id, parsed.name);
    revalidatePath("/", "layout");
    return undefined;
  });
}

export async function deleteGroupAction(input: { id: string }): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requireUser();
    const parsed = groupIdSchema.parse(input);
    await pageService.deleteGroup(ctx, parsed.id);
    revalidatePath("/", "layout");
    return undefined;
  });
}

export async function assignGroupAction(input: {
  ids: string[];
  groupId: string | null;
}): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requireUser();
    const parsed = assignGroupSchema.parse(input);
    await pageService.assignPagesToGroup(ctx, parsed.ids, parsed.groupId);
    revalidatePath("/", "layout");
    return undefined;
  });
}

export async function savePageContentAction(input: {
  pageId: string;
  content: unknown[];
  baseVersion: number;
  snapshot?: boolean;
}): Promise<ActionResult<SaveContentResult>> {
  return run(async () => {
    const ctx = await requireUser();
    const parsed = savePageContentSchema.parse(input);
    const result = await savePageContent(ctx, parsed);
    // El contenido se guarda en cliente (optimista); no revalidamos la ruta para
    // no re-renderizar el editor en cada guardado. El sidebar se refresca aparte.
    return result;
  });
}

export async function savePageCardsAction(input: {
  pageId: string;
  cards: unknown[];
}): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requireUser();
    const parsed = savePageCardsSchema.parse(input);
    await pageService.setPageCards(ctx, parsed.pageId, parsed.cards);
    return undefined;
  });
}

export async function recordVisitAction(input: { id: string }): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requireUser();
    const parsed = pageIdSchema.parse(input);
    await pageService.recordVisit(ctx, parsed.id);
    return undefined;
  });
}
