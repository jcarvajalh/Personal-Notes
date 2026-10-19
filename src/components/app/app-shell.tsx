"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useTheme } from "@/components/theme-provider";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SidebarContent, SidebarResizer } from "@/components/sidebar/sidebar";
import { Topbar } from "@/components/topbar/topbar";
import { MoveToDialog } from "@/components/move-to-dialog";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { useSidebarStore, SIDEBAR_DEFAULT_WIDTH } from "@/stores/sidebar";
import { useDialogsStore } from "@/stores/dialogs";
import { usePageMutations } from "@/hooks/use-pages";
import { useMounted } from "@/hooks/use-mounted";
import type { PageGroup, SidebarNode } from "@/server/queries/pages";

interface AppShellProps {
  children: React.ReactNode;
  workspaceName: string;
  initialRoot: SidebarNode[];
  initialFavorites: SidebarNode[];
  initialGroups: PageGroup[];
}

export function AppShell({
  children,
  workspaceName,
  initialRoot,
  initialFavorites,
  initialGroups,
}: AppShellProps) {
  const mounted = useMounted();
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const { create } = usePageMutations();

  const width = useSidebarStore((s) => s.width);
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed);
  const mobileOpen = useSidebarStore((s) => s.mobileOpen);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const toggleCommand = useDialogsStore((s) => s.toggleCommand);

  const effectiveWidth = mounted ? width : SIDEBAR_DEFAULT_WIDTH;
  const effectiveCollapsed = mounted ? collapsed : false;

  // Atajos globales (7.15).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === "\\") {
        e.preventDefault();
        toggleCollapsed();
      } else if (e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleCommand();
      } else if (e.key.toLowerCase() === "n" && !e.shiftKey) {
        e.preventDefault();
        create.mutate({}, { onSuccess: (data) => router.push(`/${data.id}`) });
      } else if (e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleCollapsed, toggleCommand, create, router, setTheme, resolvedTheme]);

  const sidebar = (
    <SidebarContent
      initialRoot={initialRoot}
      initialFavorites={initialFavorites}
      initialGroups={initialGroups}
      workspaceName={workspaceName}
    />
  );

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      {/* Sidebar de escritorio */}
      {!effectiveCollapsed && (
        <aside
          className="relative hidden shrink-0 border-r md:block"
          style={{ width: effectiveWidth }}
        >
          {sidebar}
          <SidebarResizer />
        </aside>
      )}

      {/* Sidebar móvil (drawer) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[min(85vw,20rem)] p-0">
          <SheetTitle className="sr-only">Barra lateral</SheetTitle>
          {sidebar}
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>

      <MoveToDialog />
      <CommandPalette />
    </div>
  );
}
