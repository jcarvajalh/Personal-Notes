"use client";

import { create } from "zustand";

interface MoveTarget {
  id: string;
  title: string;
}

interface DialogsState {
  moveTarget: MoveTarget | null;
  openMove: (target: MoveTarget) => void;
  closeMove: () => void;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  toggleCommand: () => void;
}

export const useDialogsStore = create<DialogsState>((set) => ({
  moveTarget: null,
  openMove: (moveTarget) => set({ moveTarget }),
  closeMove: () => set({ moveTarget: null }),
  commandOpen: false,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  toggleCommand: () => set((s) => ({ commandOpen: !s.commandOpen })),
}));
