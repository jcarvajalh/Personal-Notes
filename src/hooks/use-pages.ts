"use client";

import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  assignGroupAction,
  createGroupAction,
  createPageAction,
  deleteGroupAction,
  duplicatePageAction,
  emptyTrashAction,
  listBreadcrumbs,
  listChildPages,
  listFavorites,
  listGroups,
  listRecents,
  listRootPages,
  listTrash,
  movePageAction,
  permanentlyDeletePageAction,
  renameGroupAction,
  renamePageAction,
  restorePageAction,
  setFavoritePagesAction,
  setPageIconAction,
  toggleFavoriteAction,
  trashPageAction,
  trashPagesAction,
} from "@/server/actions/pages";
import type { ActionResult } from "@/lib/result";
import type { SidebarNode } from "@/server/queries/pages";

export const pageKeys = {
  all: ["pages"] as const,
  root: ["pages", "root"] as const,
  children: (id: string) => ["pages", "children", id] as const,
  favorites: ["pages", "favorites"] as const,
  recents: ["pages", "recents"] as const,
  trash: ["pages", "trash"] as const,
  groups: ["pages", "groups"] as const,
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

export function useGroups() {
  return useQuery({ queryKey: pageKeys.groups, queryFn: () => listGroups() });
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

/** Snapshot de todas las listas de páginas en caché (para rollback optimista). */
type PageListsSnapshot = [QueryKey, unknown][];

/** Solo las cachés que son listas de nodos de sidebar (raíz / hijos / favoritos). */
const isNodeListKey = (key: QueryKey) =>
  key[0] === "pages" && (key[1] === "root" || key[1] === "children" || key[1] === "favorites");

export function usePageMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: pageKeys.all });

  // Captura el estado actual de las listas de páginas para poder revertir si la
  // mutación falla (patrón de actualización optimista de TanStack Query).
  const snapshot = (): PageListsSnapshot => qc.getQueriesData({ queryKey: pageKeys.all });
  const rollback = (snap: PageListsSnapshot) => {
    for (const [key, data] of snap) qc.setQueryData(key, data);
  };

  const create = useMutation({
    mutationFn: (input: { parentId?: string | null; title?: string }) =>
      createPageAction(input).then(unwrap),
    // Optimista: añade un nodo provisional al instante para que el sidebar no
    // "espere" al servidor. La recarga de confirmación ocurre en onSettled.
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: pageKeys.all });
      const snap = snapshot();
      const key = input.parentId ? pageKeys.children(input.parentId) : pageKeys.root;
      const tempNode: SidebarNode = {
        id: `temp-${Math.random().toString(36).slice(2)}`,
        title: input.title ?? "",
        icon: null,
        kind: "page",
        position: "￿", // al final del orden
        isFavorite: false,
        hasChildren: false,
        groupId: null,
      };
      qc.setQueryData<SidebarNode[]>(key, (old) => [...(old ?? []), tempNode]);
      // El padre pasa a tener hijos (para que aparezca el chevron / sea expandible).
      if (input.parentId) {
        qc.setQueriesData<SidebarNode[]>(
          { queryKey: pageKeys.all, predicate: (q) => isNodeListKey(q.queryKey) },
          (old) =>
            old?.map((n) => (n.id === input.parentId ? { ...n, hasChildren: true } : n)) ?? old,
        );
      }
      return { snap };
    },
    onError: (e: Error, _vars, ctx) => {
      if (ctx) rollback(ctx.snap);
      toast.error(e.message);
    },
    onSettled: invalidate,
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
    // Optimista: quita el nodo de las listas al instante.
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: pageKeys.all });
      const snap = snapshot();
      qc.setQueriesData<SidebarNode[]>(
        { queryKey: pageKeys.all, predicate: (q) => isNodeListKey(q.queryKey) },
        (old) => old?.filter((n) => n.id !== id) ?? old,
      );
      return { snap };
    },
    onError: (e: Error, _vars, ctx) => {
      if (ctx) rollback(ctx.snap);
      toast.error(e.message);
    },
    onSettled: invalidate,
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

  // --- Lote (multiselección) ------------------------------------------------
  const bulkTrash = useMutation({
    mutationFn: (input: { ids: string[] }) => trashPagesAction(input).then(unwrap),
    onMutate: async ({ ids }) => {
      await qc.cancelQueries({ queryKey: pageKeys.all });
      const snap = snapshot();
      const set = new Set(ids);
      qc.setQueriesData<SidebarNode[]>(
        { queryKey: pageKeys.all, predicate: (q) => isNodeListKey(q.queryKey) },
        (old) => old?.filter((n) => !set.has(n.id)) ?? old,
      );
      return { snap };
    },
    onError: (e: Error, _vars, ctx) => {
      if (ctx) rollback(ctx.snap);
      toast.error(e.message);
    },
    onSettled: invalidate,
  });

  const bulkFavorite = useMutation({
    mutationFn: (input: { ids: string[]; favorite: boolean }) =>
      setFavoritePagesAction(input).then(unwrap),
    onMutate: async ({ ids, favorite: fav }) => {
      await qc.cancelQueries({ queryKey: pageKeys.all });
      const snap = snapshot();
      const set = new Set(ids);
      qc.setQueriesData<SidebarNode[]>(
        { queryKey: pageKeys.all, predicate: (q) => isNodeListKey(q.queryKey) },
        (old) => old?.map((n) => (set.has(n.id) ? { ...n, isFavorite: fav } : n)) ?? old,
      );
      return { snap };
    },
    onError: (e: Error, _vars, ctx) => {
      if (ctx) rollback(ctx.snap);
      toast.error(e.message);
    },
    onSettled: invalidate,
  });

  // --- Grupos del sidebar ---------------------------------------------------
  const createGroup = useMutation({
    mutationFn: (input: { name?: string }) => createGroupAction(input).then(unwrap),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const renameGroup = useMutation({
    mutationFn: (input: { id: string; name: string }) => renameGroupAction(input).then(unwrap),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteGroup = useMutation({
    mutationFn: (input: { id: string }) => deleteGroupAction(input).then(unwrap),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const assignGroup = useMutation({
    mutationFn: (input: { ids: string[]; groupId: string | null }) =>
      assignGroupAction(input).then(unwrap),
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
    bulkTrash,
    bulkFavorite,
    createGroup,
    renameGroup,
    deleteGroup,
    assignGroup,
    invalidate,
  };
}
