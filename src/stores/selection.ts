"use client";

import { create } from "zustand";

/**
 * Selección múltiple de páginas en el sidebar (eliminar / favoritos / mover en
 * lote). No se persiste: es estado efímero de la sesión de UI.
 */
interface SelectionState {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  add: (id: string) => void;
  clear: () => void;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  ids: [],
  has: (id) => get().ids.includes(id),
  toggle: (id) =>
    set((s) => ({
      ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id],
    })),
  add: (id) => set((s) => (s.ids.includes(id) ? s : { ids: [...s.ids, id] })),
  clear: () => set({ ids: [] }),
}));
