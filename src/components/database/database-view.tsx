"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  Columns3,
  LayoutDashboard,
  LayoutGrid,
  List as ListIcon,
  MoreHorizontal,
  Plus,
  Rss,
  Table as TableIcon,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { TableView } from "@/components/database/table-view";
import { ViewToolbar } from "@/components/database/view-toolbar";
import {
  BoardView,
  CalendarView,
  DashboardView,
  FeedView,
  GalleryView,
  ListView,
  TimelineView,
} from "@/components/database/views";
import { dbKeys, useDatabaseBundle, useDatabaseMutations } from "@/hooks/use-database";
import { listRows, loadDatabase } from "@/server/actions/databases";
import { OFFERED_VIEW_TYPES, VIEW_LABELS } from "@/lib/database/types";
import type { DatabaseBundle, DbRow, DbView } from "@/server/queries/databases";

const VIEW_ICON: Record<string, LucideIcon> = {
  table: TableIcon,
  board: Columns3,
  gallery: LayoutGrid,
  list: ListIcon,
  feed: Rss,
  dashboard: LayoutDashboard,
  calendar: Calendar,
  timeline: Clock,
};

interface DatabaseViewProps {
  pageId: string;
  initialBundle: DatabaseBundle;
  initialRows: DbRow[];
  /** true cuando se renderiza embebida dentro de un documento (bloque inline). */
  inline?: boolean;
}

/**
 * Carga una base de datos embebida por el id de su página contenedora y la
 * renderiza dentro del documento actual (bloque `databaseView` del editor).
 */
export function InlineDatabase({ pageId }: { pageId: string }) {
  const bundleQuery = useQuery({
    queryKey: dbKeys.bundle(pageId),
    queryFn: () => loadDatabase(pageId),
  });
  const bundle = bundleQuery.data ?? null;
  const databaseId = bundle?.database.id ?? "";
  const rowsQuery = useQuery({
    queryKey: dbKeys.rows(databaseId || "none"),
    queryFn: () => listRows(databaseId),
    enabled: Boolean(databaseId),
  });

  if (bundleQuery.isLoading) {
    return (
      <div className="my-2 space-y-2" contentEditable={false}>
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (!bundle) {
    return (
      <p className="text-muted-foreground my-2 rounded-md border px-3 py-2 text-sm">
        Base de datos no encontrada.
      </p>
    );
  }
  return (
    <DatabaseScreen
      pageId={pageId}
      initialBundle={bundle}
      initialRows={rowsQuery.data ?? []}
      inline
    />
  );
}

export function DatabaseScreen({ pageId, initialBundle, initialRows, inline }: DatabaseViewProps) {
  const { data: bundle = initialBundle } = useDatabaseBundle(pageId, initialBundle);
  const m = useDatabaseMutations(pageId, bundle.database.id);

  const views = bundle.views;
  const [activeId, setActiveId] = useState<string>(
    bundle.database.defaultViewId ?? views[0]?.id ?? "",
  );
  // Si la vista activa desaparece (p. ej. eliminada), se resuelve a la primera.
  const active = views.find((v) => v.id === activeId) ?? views[0];

  return (
    <div className={inline ? "w-full" : "mx-auto w-full max-w-(--content-max-width) px-8"}>
      {/* Pestañas de vistas (DB-020) */}
      <div className="border-border flex items-center gap-1 border-b">
        {views.map((v) => (
          <ViewTab
            key={v.id}
            view={v}
            active={v.id === active?.id}
            canDelete={views.length > 1}
            onSelect={() => setActiveId(v.id)}
            onRename={(name) => m.renameView.mutate({ id: v.id, name })}
            onDelete={() => m.deleteView.mutate({ id: v.id })}
          />
        ))}
        <AddViewMenu
          onAdd={(type) =>
            m.createView.mutate(
              { type, name: VIEW_LABELS[type] ?? "Vista" },
              { onSuccess: (data) => setActiveId(data.id) },
            )
          }
        />
      </div>

      {/* Barra de filtros / orden / agrupación / búsqueda (DB-040/041/042/044) */}
      {active && (
        <ViewToolbar
          bundle={bundle}
          view={active}
          onChange={(patch) =>
            m.updateViewConfig.mutate({
              id: active.id,
              config: { ...(active.config as Record<string, unknown>), ...patch },
            })
          }
        />
      )}

      {/* Vista activa */}
      <div className="mt-2">
        {active && renderView(active.type, { pageId, bundle, initialRows, view: active })}
      </div>
    </div>
  );
}

function renderView(
  type: string,
  props: { pageId: string; bundle: DatabaseBundle; initialRows: DbRow[]; view: DbView },
) {
  switch (type) {
    case "table":
      return <TableView {...props} />;
    case "board":
      return <BoardView {...props} />;
    case "gallery":
      return <GalleryView {...props} />;
    case "list":
      return <ListView {...props} />;
    case "feed":
      return <FeedView {...props} />;
    case "calendar":
      return <CalendarView {...props} />;
    case "timeline":
      return <TimelineView {...props} />;
    case "dashboard":
      return <DashboardView {...props} />;
    default:
      return (
        <p className="text-muted-foreground px-2 py-10 text-center text-sm">
          La vista «{VIEW_LABELS[type] ?? type}» aún no está disponible.
        </p>
      );
  }
}

function AddViewMenu({ onAdd }: { onAdd: (type: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Añadir vista"
        title="Añadir vista"
        className="text-muted-foreground hover:bg-muted mb-1 flex size-7 items-center justify-center rounded"
      >
        <Plus className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {OFFERED_VIEW_TYPES.map((type) => {
          const Icon = VIEW_ICON[type] ?? TableIcon;
          return (
            <DropdownMenuItem key={type} onClick={() => onAdd(type)}>
              <Icon />
              {VIEW_LABELS[type]}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ViewTab({
  view,
  active,
  canDelete,
  onSelect,
  onRename,
  onDelete,
}: {
  view: DbView;
  active: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(view.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = VIEW_ICON[view.type] ?? TableIcon;

  useEffect(() => {
    if (renaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [renaming]);

  const commit = () => {
    setRenaming(false);
    const name = draft.trim();
    if (name && name !== view.name) onRename(name);
    else setDraft(view.name);
  };

  if (renaming) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(view.name);
            setRenaming(false);
          }
        }}
        className="bg-background ring-ring mb-1 h-7 w-28 rounded px-2 text-sm ring-1 outline-none"
      />
    );
  }

  return (
    <div
      className={cn(
        "group/tab -mb-px flex items-center gap-1 border-b-2 px-1 pb-1.5",
        active ? "border-foreground" : "border-transparent",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        onDoubleClick={() => setRenaming(true)}
        className={cn(
          "flex items-center gap-1.5 rounded px-1.5 py-1 text-sm",
          active ? "font-medium" : "text-muted-foreground hover:bg-muted",
        )}
      >
        <Icon className="size-3.5" />
        {view.name}
      </button>
      {active && (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Opciones de la vista"
            className="text-muted-foreground hover:bg-muted flex size-5 items-center justify-center rounded opacity-0 group-hover/tab:opacity-100"
          >
            <MoreHorizontal className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setRenaming(true)}>Renombrar</DropdownMenuItem>
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={onDelete}>
                  <Trash2 />
                  Eliminar vista
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
