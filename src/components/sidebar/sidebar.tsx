"use client";

// Los objetos de @dnd-kit (useDroppable) exponen `setNodeRef`/`isOver`; la regla
// react-hooks/refs los confunde con refs de render. Uso idiomático de dnd-kit.
/* eslint-disable react-hooks/refs */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  ChevronsLeft,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageIcon } from "@/components/page-icon";
import { ChildList } from "@/components/sidebar/tree-node";
import { useFavorites, useGroups, usePageMutations, useRootPages } from "@/hooks/use-pages";
import { useSidebarStore, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH } from "@/stores/sidebar";
import { useSelectionStore } from "@/stores/selection";
import { useDialogsStore } from "@/stores/dialogs";
import { ThemeToggle } from "@/components/topbar/theme-toggle";
import type { PageGroup, SidebarNode } from "@/server/queries/pages";

interface SidebarProps {
  initialRoot: SidebarNode[];
  initialFavorites: SidebarNode[];
  initialGroups: PageGroup[];
  workspaceName: string;
}

export function SidebarContent({
  initialRoot,
  initialFavorites,
  initialGroups,
  workspaceName,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const toggleCommand = useDialogsStore((s) => s.toggleCommand);
  const { create, move, favorite, createGroup } = usePageMutations();

  const rootQuery = useRootPages();
  const favoritesQuery = useFavorites();
  const groupsQuery = useGroups();
  const root = rootQuery.data ?? initialRoot;
  const favorites = favoritesQuery.data ?? initialFavorites;
  const groups = groupsQuery.data ?? initialGroups;
  const ungrouped = root.filter((n) => !n.groupId);

  const [activeNode, setActiveNode] = useState<SidebarNode | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const favDrop = useDroppable({ id: "favorites:drop", data: { kind: "favorite" } });

  const onDragStart = (e: DragStartEvent) => {
    setActiveNode((e.active.data.current?.node as SidebarNode) ?? null);
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveNode(null);
    const { active, over } = e;
    if (!over) return;
    const id = String(active.id);
    const data = over.data.current as
      | {
          kind: "before" | "after" | "inside" | "favorite";
          parentId?: string | null;
          beforeId?: string | null;
          afterId?: string | null;
        }
      | undefined;
    if (!data) return;

    if (data.kind === "favorite") {
      favorite.mutate(
        { id, favorite: true },
        { onSuccess: () => toast.success("Añadido a favoritos") },
      );
      return;
    }
    if (data.kind === "inside") {
      move.mutate({ id, parentId: data.parentId ?? null }, { onSuccess: () => router.refresh() });
      return;
    }
    // before / after → mismo padre, entre hermanos
    move.mutate(
      {
        id,
        parentId: data.parentId ?? null,
        beforeId: data.beforeId ?? null,
        afterId: data.afterId ?? null,
      },
      { onSuccess: () => router.refresh() },
    );
  };

  const newRootPage = () => {
    create.mutate({}, { onSuccess: (data) => router.push(`/${data.id}`) });
  };

  const newGroup = () => {
    createGroup.mutate({}, { onSuccess: () => toast.success("Grupo creado") });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="bg-sidebar text-sidebar-foreground flex h-full flex-col">
        {/* Cabecera */}
        <div className="flex h-(--topbar-height) items-center justify-between gap-1 px-2">
          <span className="truncate px-1 text-sm font-medium">{workspaceName}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Colapsar barra lateral"
            onClick={() => useSidebarStore.getState().setCollapsed(true)}
          >
            <ChevronsLeft />
          </Button>
        </div>

        {/* Buscar (SR-001) */}
        <div className="px-2">
          <button
            type="button"
            onClick={toggleCommand}
            className="text-muted-foreground hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm"
          >
            <Search className="size-4" />
            Buscar…
            <kbd className="ml-auto text-xs">Ctrl K</kbd>
          </button>
        </div>

        <SelectionToolbar />

        <ScrollArea className="flex-1">
          <div className="space-y-4 p-2">
            {/* Favoritos */}
            <section ref={favDrop.setNodeRef}>
              <SectionLabel>Favoritos</SectionLabel>
              {favorites.length === 0 ? (
                <p
                  className={cn(
                    "text-muted-foreground rounded-md px-2 py-1 text-xs",
                    favDrop.isOver && "ring-brand ring-2 ring-inset",
                  )}
                >
                  Arrastra páginas aquí.
                </p>
              ) : (
                <div className={cn("rounded-md", favDrop.isOver && "ring-brand ring-2 ring-inset")}>
                  {favorites.map((fav) => (
                    <Link
                      key={fav.id}
                      href={`/${fav.id}`}
                      data-active={pathname === `/${fav.id}`}
                      className="hover:bg-muted data-[active=true]:bg-muted flex h-7 items-center gap-2 rounded-md px-2 text-sm"
                    >
                      <Star className="fill-brand text-brand size-3.5 shrink-0" />
                      <PageIcon icon={fav.icon} />
                      <span className="truncate">{fav.title || "Sin título"}</span>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Grupos personalizados */}
            {groups.map((group) => (
              <GroupSection
                key={group.id}
                group={group}
                nodes={root.filter((n) => n.groupId === group.id)}
              />
            ))}

            {/* Páginas (sin grupo) */}
            <section>
              <div className="group/pages flex items-center justify-between pr-1">
                <SectionLabel>Páginas</SectionLabel>
                <div className="flex items-center opacity-0 group-hover/pages:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Nuevo grupo"
                    title="Nuevo grupo"
                    onClick={newGroup}
                  >
                    <FolderPlus />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Nueva página"
                    title="Nueva página"
                    onClick={newRootPage}
                  >
                    <Plus />
                  </Button>
                </div>
              </div>
              <ChildList
                parentId={null}
                depth={0}
                nodes={ungrouped}
                loading={rootQuery.isLoading && root.length === 0}
              />
              {ungrouped.length === 0 && !rootQuery.isLoading && (
                <button
                  type="button"
                  onClick={newRootPage}
                  className="text-muted-foreground hover:bg-muted mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                >
                  <Plus className="size-4" />
                  Nueva página
                </button>
              )}
            </section>
          </div>
        </ScrollArea>

        {/* Pie */}
        <div className="flex items-center gap-1 border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2"
            nativeButton={false}
            render={<Link href="/trash" />}
          >
            <Trash2 className="size-4" />
            Papelera
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Ajustes"
            nativeButton={false}
            render={<Link href="/settings" />}
          >
            <Settings />
          </Button>
          <ThemeToggle />
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeNode && (
          <div className="bg-popover ring-foreground/10 flex items-center gap-2 rounded-md px-2 py-1 text-sm shadow-md ring-1">
            <PageIcon icon={activeNode.icon} />
            <span className="truncate">{activeNode.title || "Sin título"}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

/** Barra de acciones en lote para la multiselección de páginas. */
function SelectionToolbar() {
  const ids = useSelectionStore((s) => s.ids);
  const clear = useSelectionStore((s) => s.clear);
  const { bulkTrash, bulkFavorite } = usePageMutations();

  if (ids.length === 0) return null;

  const count = ids.length;
  const done = (msg: string) => {
    clear();
    toast.success(msg);
  };

  return (
    <div className="bg-brand-muted mx-2 mb-1 flex items-center gap-1 rounded-md px-2 py-1 text-sm">
      <span className="mr-auto font-medium">
        {count} seleccionada{count === 1 ? "" : "s"}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Añadir a favoritos"
        title="Añadir a favoritos"
        onClick={() =>
          bulkFavorite.mutate(
            { ids, favorite: true },
            { onSuccess: () => done("Añadidas a favoritos") },
          )
        }
      >
        <Star />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Eliminar seleccionadas"
        title="Eliminar"
        onClick={() =>
          bulkTrash.mutate({ ids }, { onSuccess: () => done("Movidas a la papelera") })
        }
      >
        <Trash2 />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Quitar selección"
        title="Quitar selección"
        onClick={clear}
      >
        <X />
      </Button>
    </div>
  );
}

/** Sección del sidebar para un grupo personalizado de páginas. */
function GroupSection({ group, nodes }: { group: PageGroup; nodes: SidebarNode[] }) {
  const router = useRouter();
  const { create, assignGroup, renameGroup, deleteGroup } = usePageMutations();
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(group.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [renaming]);

  const startRename = () => {
    setDraft(group.name);
    setRenaming(true);
  };
  const commitRename = () => {
    setRenaming(false);
    const name = draft.trim();
    if (name && name !== group.name) renameGroup.mutate({ id: group.id, name });
  };

  const newPageInGroup = () => {
    create.mutate(
      {},
      {
        onSuccess: (data) => {
          assignGroup.mutate({ ids: [data.id], groupId: group.id });
          router.push(`/${data.id}`);
        },
      },
    );
  };

  return (
    <section>
      <div className="group/gh flex items-center justify-between pr-1">
        {renaming ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") setRenaming(false);
            }}
            className="bg-background ring-ring mx-2 my-1 h-5 min-w-0 flex-1 rounded-sm px-1 text-xs ring-1 outline-none"
          />
        ) : (
          <button type="button" onDoubleClick={startRename} className="min-w-0 flex-1 text-left">
            <SectionLabel>{group.name || "Grupo sin nombre"}</SectionLabel>
          </button>
        )}
        <div className="flex shrink-0 items-center opacity-0 group-hover/gh:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-xs" aria-label="Opciones del grupo" />}
            >
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="right">
              <DropdownMenuItem onClick={startRename}>
                <Pencil />
                Renombrar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() =>
                  deleteGroup.mutate(
                    { id: group.id },
                    { onSuccess: () => toast.success("Grupo eliminado") },
                  )
                }
              >
                <Trash2 />
                Eliminar grupo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Nueva página en el grupo"
            title="Nueva página en el grupo"
            onClick={newPageInGroup}
          >
            <Plus />
          </Button>
        </div>
      </div>
      {nodes.length === 0 ? (
        <p className="text-muted-foreground px-2 py-1 text-xs">Vacío</p>
      ) : (
        <ChildList parentId={null} depth={0} nodes={nodes} />
      )}
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-muted-foreground px-2 py-1 text-xs font-medium tracking-wide">
      {children}
    </div>
  );
}

/** Mango de redimensionado del sidebar (NV-006). */
export function SidebarResizer() {
  const setWidth = useSidebarStore((s) => s.setWidth);
  const draggingRef = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      const w = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, e.clientX));
      setWidth(w);
    },
    [setWidth],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    draggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="group absolute inset-y-0 right-0 z-30 w-1.5 cursor-col-resize"
    >
      <div className="bg-border group-hover:bg-brand mx-auto h-full w-px transition-colors" />
    </div>
  );
}
