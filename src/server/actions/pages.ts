"use server";

import { revalidatePath } from "next/cache";

import { requireUser, UnauthorizedError } from "@/server/session";
import { ActionResult, fail, ok } from "@/lib/result";
import {
  createPageSchema,
  duplicatePageSchema,
  movePageSchema,
  pageIdSchema,
  renamePageSchema,
  setPageIconSchema,
  toggleFavoriteSchema,
} from "@/lib/validators/pages";
import * as pageService from "@/server/services/pages";
import {
  getBreadcrumbs,
  getChildPages,
  getFavoritePages,
  getRecentPages,
  getRootPages,
  getTrashedPages,
  searchPagesByTitle,
  type Breadcrumb,
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

export async function searchPages(query: string, excludeIds?: string[]): Promise<TitleMatch[]> {
  const ctx = await requireUser();
  return searchPagesByTitle(ctx.workspaceId, query, { excludeIds });
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

export async function recordVisitAction(input: { id: string }): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requireUser();
    const parsed = pageIdSchema.parse(input);
    await pageService.recordVisit(ctx, parsed.id);
    return undefined;
  });
}
