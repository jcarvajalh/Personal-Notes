"use client";

import { create } from "zustand";

export type SaveStatus = "idle" | "saving" | "saved" | "offline" | "conflict" | "error";

interface SaveStatusState {
  status: SaveStatus;
  setStatus: (status: SaveStatus) => void;
}

/** Estado del autoguardado del editor (ED-039), mostrado en la barra superior. */
export const useSaveStatusStore = create<SaveStatusState>((set) => ({
  status: "idle",
  setStatus: (status) => set({ status }),
}));
