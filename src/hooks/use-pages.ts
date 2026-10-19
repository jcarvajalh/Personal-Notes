"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createPageAction,
  duplicatePageAction,
  emptyTrashAction,
  listBreadcrumbs,
  listChildPages,
  listFavorites,
  listRecents,
  listRootPages,
  listTrash,
  movePageAction,
  permanentlyDeletePageAction,
  renamePageAction,
  restorePageAction,
  setPageIconAction,
  toggleFavoriteAction,
  trashPageAction,
} from "@/server/actions/pages";
import type { ActionResult } from "@/lib/result";

export const pageKeys = {
  all: ["pages"] as const,
  root: ["pages", "root"] as const,
  children: (id: string) => ["pages", "children", id] as const,
  favorites: ["pages", "favorites"] as const,
  recents: ["pages", "recents"] as const,
  trash: ["pages", "trash"] as const,
  breadcrumbs: (id: string) => ["pages", "breadcrumbs", id] as const,
};

export function useRootPages() {
  return useQuery({ queryKey: pageKeys.root, queryFn: () => listRootPages() });
}

export function useChildPages(parentId: string, enabled: boolean) {
  return useQuery({
    queryKey: pageKeys.children(parentId),
    queryFn: () => listChildPages(parentId),
    enabled,
  });
}

export function useFavorites() {
  return useQuery({ queryKey: pageKeys.favorites, queryFn: () => listFavorites() });
}

export function useRecents(limit = 10) {
  return useQuery({ queryKey: pageKeys.recents, queryFn: () => listRecents(limit) });
}

export function useTrash() {
  return useQuery({ queryKey: pageKeys.trash, queryFn: () => listTrash() });
}

export function useBreadcrumbs(pageId: string | null) {
  return useQuery({
    queryKey: pageId ? pageKeys.breadcrumbs(pageId) : ["pages", "breadcrumbs", "none"],
    queryFn: () => (pageId ? listBreadcrumbs(pageId) : Promise.resolve([])),
    enabled: Boolean(pageId),
  });
}

/** Lanza una excepción si la acción devolvió error (para React Query). */
function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

export function usePageMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: pageKeys.all });

  const create = useMutation({
    mutationFn: (input: { parentId?: string | null; title?: string }) =>
      createPageAction(input).then(unwrap),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const rename = useMutation({
    mutationFn: (input: { id: string; title: string }) => renamePageAction(input).then(unwrap),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const setIcon = useMutation({
    mutationFn: (input: Parameters<typeof setPageIconAction>[0]) =>
      setPageIconAction(input).then(unwrap),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const move = useMutation({
    mutationFn: (input: {
      id: string;
      parentId: string | null;
      beforeId?: string | null;
      afterId?: string | null;
    }) => movePageAction(input).then(unwrap),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const duplicate = useMutation({
    mutationFn: (input: { id: string; withChildren?: boolean }) =>
      duplicatePageAction(input).then(unwrap),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const trash = useMutation({
    mutationFn: (input: { id: string }) => trashPageAction(input).then(unwrap),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const restore = useMutation({
    mutationFn: (input: { id: string }) => restorePageAction(input).then(unwrap),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const destroy = useMutation({
    mutationFn: (input: { id: string }) => permanentlyDeletePageAction(input).then(unwrap),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const emptyTrash = useMutation({
    mutationFn: () => emptyTrashAction().then(unwrap),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const favorite = useMutation({
    mutationFn: (input: { id: string; favorite: boolean }) =>
      toggleFavoriteAction(input).then(unwrap),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    create,
    rename,
    setIcon,
    move,
    duplicate,
    trash,
    restore,
    destroy,
    emptyTrash,
    favorite,
    invalidate,
  };
}
