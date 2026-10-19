"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const SIDEBAR_MIN_WIDTH = 220;
export const SIDEBAR_MAX_WIDTH = 480;
export const SIDEBAR_DEFAULT_WIDTH = 272;

interface SidebarState {
  width: number;
  collapsed: boolean;
  /** Nodos expandidos del árbol (NV-001: estado recordado). */
  expanded: Record<string, boolean>;
  /** Drawer abierto en móvil (NV-012). */
  mobileOpen: boolean;
  setWidth: (width: number) => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  toggleExpanded: (id: string) => void;
  setExpanded: (id: string, value: boolean) => void;
  setMobileOpen: (open: boolean) => void;
}

const clampWidth = (w: number) => Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, w));

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      width: SIDEBAR_DEFAULT_WIDTH,
      collapsed: false,
      expanded: {},
      mobileOpen: false,
      setWidth: (width) => set({ width: clampWidth(width) }),
      setCollapsed: (collapsed) => set({ collapsed }),
      toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
      toggleExpanded: (id) => set((s) => ({ expanded: { ...s.expanded, [id]: !s.expanded[id] } })),
      setExpanded: (id, value) => set((s) => ({ expanded: { ...s.expanded, [id]: value } })),
      setMobileOpen: (mobileOpen) => set({ mobileOpen }),
    }),
    {
      name: "np.sidebar",
      // No persistir el estado del drawer móvil.
      partialize: (s) => ({ width: s.width, collapsed: s.collapsed, expanded: s.expanded }),
    },
  ),
);
