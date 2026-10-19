"use client";

import { Fragment } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, Menu, PanelLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageIcon } from "@/components/page-icon";
import { useBreadcrumbs } from "@/hooks/use-pages";
import { useSidebarStore } from "@/stores/sidebar";
import { SaveStatusIndicator } from "@/components/editor/save-status";

export function Topbar() {
  const params = useParams();
  const pageId = typeof params.pageId === "string" ? params.pageId : null;
  const { data: crumbs = [] } = useBreadcrumbs(pageId);
  const collapsed = useSidebarStore((s) => s.collapsed);
  const setCollapsed = useSidebarStore((s) => s.setCollapsed);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);

  return (
    <header className="flex h-(--topbar-height) shrink-0 items-center gap-1 border-b px-2">
      {/* Móvil: abre el drawer */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        aria-label="Abrir menú"
        onClick={() => setMobileOpen(true)}
      >
        <Menu />
      </Button>

      {/* Escritorio: reabrir sidebar si está colapsado */}
      {collapsed && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="hidden md:inline-flex"
          aria-label="Mostrar barra lateral"
          onClick={() => setCollapsed(false)}
        >
          <PanelLeft />
        </Button>
      )}

      <nav
        aria-label="Ruta"
        className="flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden text-sm"
      >
        {crumbs.map((c, i) => (
          <Fragment key={c.id}>
            {i > 0 && <ChevronRight className="text-muted-foreground size-3.5 shrink-0" />}
            <Link
              href={`/${c.id}`}
              className="hover:bg-muted flex min-w-0 items-center gap-1 rounded px-1 py-0.5"
            >
              <PageIcon icon={c.icon} size={14} />
              <span className="truncate">{c.title || "Sin título"}</span>
            </Link>
          </Fragment>
        ))}
      </nav>

      <SaveStatusIndicator />
    </header>
  );
}
