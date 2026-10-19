"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  addPropertyAction,
  createRowAction,
  createViewAction,
  deletePropertyAction,
  deleteViewAction,
  listRows,
  loadDatabase,
  renamePropertyAction,
  renameViewAction,
  updatePropertyConfigAction,
  updateRowValueAction,
  updateViewConfigAction,
} from "@/server/actions/databases";
import { renamePageAction, trashPageAction } from "@/server/actions/pages";
import type { ActionResult } from "@/lib/result";
import type { DatabaseBundle, DbRow } from "@/server/queries/databases";

export const dbKeys = {
  bundle: (pageId: string) => ["db", "bundle", pageId] as const,
  rows: (databaseId: string) => ["db", "rows", databaseId] as const,
};

function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

export function useDatabaseBundle(pageId: string, initial: DatabaseBundle) {
  return useQuery({
    queryKey: dbKeys.bundle(pageId),
    queryFn: () => loadDatabase(pageId).then((b) => b ?? initial),
    initialData: initial,
  });
}

export function useDatabaseRows(databaseId: string, initial: DbRow[]) {
  return useQuery({
    queryKey: dbKeys.rows(databaseId),
    queryFn: () => listRows(databaseId),
    initialData: initial,
  });
}

export function useDatabaseMutations(pageId: string, databaseId: string) {
  const qc = useQueryClient();
  const bundleKey = dbKeys.bundle(pageId);
  const rowsKey = dbKeys.rows(databaseId);
  const invalidateBundle = () => qc.invalidateQueries({ queryKey: bundleKey });
  const invalidateRows = () => qc.invalidateQueries({ queryKey: rowsKey });

  const createRow = useMutation({
    mutationFn: () => createRowAction({ databaseId }).then(unwrap),
    onSuccess: invalidateRows,
    onError: (e: Error) => toast.error(e.message),
  });

  // Edición de celda optimista: refleja el valor al instante en la caché de filas.
  const updateValue = useMutation({
    mutationFn: (input: { pageId: string; propertyId: string; value: unknown }) =>
      updateRowValueAction(input).then(unwrap),
    onMutate: async ({ pageId: rowId, propertyId, value }) => {
      await qc.cancelQueries({ queryKey: rowsKey });
      const prev = qc.getQueryData<DbRow[]>(rowsKey);
      qc.setQueryData<DbRow[]>(rowsKey, (old) =>
        old?.map((r) => {
          if (r.id !== rowId) return r;
          const properties = { ...r.properties };
          if (value === null || value === undefined || value === "") delete properties[propertyId];
          else properties[propertyId] = value;
          return { ...r, properties };
        }),
      );
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(rowsKey, ctx.prev);
      toast.error(e.message);
    },
    onSettled: invalidateRows,
  });

  const updateTitle = useMutation({
    mutationFn: (input: { pageId: string; title: string }) =>
      renamePageAction({ id: input.pageId, title: input.title }).then(unwrap),
    onMutate: async ({ pageId: rowId, title }) => {
      await qc.cancelQueries({ queryKey: rowsKey });
      const prev = qc.getQueryData<DbRow[]>(rowsKey);
      qc.setQueryData<DbRow[]>(rowsKey, (old) =>
        old?.map((r) => (r.id === rowId ? { ...r, title } : r)),
      );
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(rowsKey, ctx.prev);
      toast.error(e.message);
    },
    onSettled: invalidateRows,
  });

  const trashRow = useMutation({
    mutationFn: (input: { id: string }) => trashPageAction(input).then(unwrap),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: rowsKey });
      const prev = qc.getQueryData<DbRow[]>(rowsKey);
      qc.setQueryData<DbRow[]>(rowsKey, (old) => old?.filter((r) => r.id !== id));
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(rowsKey, ctx.prev);
      toast.error(e.message);
    },
    onSettled: invalidateRows,
  });

  const addProperty = useMutation({
    mutationFn: (input: { type: string; name: string }) =>
      addPropertyAction({ databaseId, ...input }).then(unwrap),
    onSuccess: invalidateBundle,
    onError: (e: Error) => toast.error(e.message),
  });

  const renameProperty = useMutation({
    mutationFn: (input: { id: string; name: string }) => renamePropertyAction(input).then(unwrap),
    onSuccess: invalidateBundle,
    onError: (e: Error) => toast.error(e.message),
  });

  const updateConfig = useMutation({
    mutationFn: (input: { id: string; config: Record<string, unknown> }) =>
      updatePropertyConfigAction(input).then(unwrap),
    onSuccess: invalidateBundle,
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteProperty = useMutation({
    mutationFn: (input: { id: string }) => deletePropertyAction(input).then(unwrap),
    onSuccess: invalidateBundle,
    onError: (e: Error) => toast.error(e.message),
  });

  const createView = useMutation({
    mutationFn: (input: { type: string; name: string }) =>
      createViewAction({ databaseId, ...input }).then(unwrap),
    onSuccess: invalidateBundle,
    onError: (e: Error) => toast.error(e.message),
  });

  const renameView = useMutation({
    mutationFn: (input: { id: string; name: string }) => renameViewAction(input).then(unwrap),
    onSuccess: invalidateBundle,
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteView = useMutation({
    mutationFn: (input: { id: string }) => deleteViewAction(input).then(unwrap),
    onSuccess: invalidateBundle,
    onError: (e: Error) => toast.error(e.message),
  });

  // Config de vista (filtros/orden/grupo/búsqueda): optimista para que la UI
  // reaccione al instante; se persiste y re-valida en segundo plano.
  const updateViewConfig = useMutation({
    mutationFn: (input: { id: string; config: Record<string, unknown> }) =>
      updateViewConfigAction(input).then(unwrap),
    onMutate: async ({ id, config }) => {
      await qc.cancelQueries({ queryKey: bundleKey });
      const prev = qc.getQueryData<DatabaseBundle>(bundleKey);
      qc.setQueryData<DatabaseBundle>(bundleKey, (b) =>
        b ? { ...b, views: b.views.map((v) => (v.id === id ? { ...v, config } : v)) } : b,
      );
      return { prev };
    },
    onError: (e: Error, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(bundleKey, ctx.prev);
      toast.error(e.message);
    },
    onSettled: invalidateBundle,
  });

  return {
    createRow,
    updateValue,
    updateTitle,
    trashRow,
    addProperty,
    renameProperty,
    updateConfig,
    deleteProperty,
    createView,
    renameView,
    deleteView,
    updateViewConfig,
  };
}
