"use client";

// Los objetos de @dnd-kit (useDraggable/useDroppable) exponen `setNodeRef` e
// `isOver`; la regla react-hooks/refs los confunde con refs de render. Su uso
// aquí es el idiomático de dnd-kit, por lo que se desactiva en este archivo.
/* eslint-disable react-hooks/refs */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  CheckSquare,
  ChevronRight,
  Folder,
  FolderMinus,
  FolderPlus,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { PageIcon } from "@/components/page-icon";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useChildPages, useGroups, usePageMutations } from "@/hooks/use-pages";
import { useSidebarStore } from "@/stores/sidebar";
import { useSelectionStore } from "@/stores/selection";
import { usePageActions, type PageActionItem } from "@/components/sidebar/page-menu";
import type { SidebarNode } from "@/server/queries/pages";

interface TreeNodeProps {
  node: SidebarNode;
  depth: number;
  parentId: string | null;
  prevId: string | null;
  nextId: string | null;
}

export function TreeNode({ node, depth, parentId, prevId, nextId }: TreeNodeProps) {
  const pathname = usePathname();
  const router = useRouter();
  const expanded = useSidebarStore((s) => Boolean(s.expanded[node.id]));
  const toggleExpanded = useSidebarStore((s) => s.toggleExpanded);
  const { create, rename, assignGroup, createGroup } = usePageMutations();
  const groups = useGroups().data ?? [];

  // Multiselección (eliminar / favoritos en lote).
  const selected = useSelectionStore((s) => s.ids.includes(node.id));
  const selectionActive = useSelectionStore((s) => s.ids.length > 0);
  const toggleSelection = useSelectionStore((s) => s.toggle);
  const addSelection = useSelectionStore((s) => s.add);

  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(node.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const startRename = () => {
    setDraftTitle(node.title);
    setRenaming(true);
  };
  const actions = usePageActions(node, { onStartRename: startRename });
  // "Seleccionar" inicia/añade a la multiselección desde el menú.
  const menuActions: PageActionItem[] = [
    {
      key: "select",
      label: "Seleccionar",
      icon: CheckSquare,
      onSelect: () => addSelection(node.id),
    },
    ...actions,
  ];

  const isActive = pathname === `/${node.id}`;

  const childrenQuery = useChildPages(node.id, expanded && node.hasChildren);

  // Drag & drop (NV-003).
  const draggable = useDraggable({ id: node.id, data: { node } });
  const before = useDroppable({
    id: `${node.id}:before`,
    data: { kind: "before", parentId, beforeId: prevId, afterId: node.id },
  });
  const inside = useDroppable({
    id: `${node.id}:inside`,
    data: { kind: "inside", parentId: node.id },
  });
  const after = useDroppable({
    id: `${node.id}:after`,
    data: { kind: "after", parentId, beforeId: node.id, afterId: nextId },
  });

  useEffect(() => {
    if (renaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [renaming]);

  const commitRename = () => {
    setRenaming(false);
    const title = draftTitle.trim();
    if (title !== node.title) rename.mutate({ id: node.id, title });
  };

  const createChild = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    create.mutate(
      { parentId: node.id },
      {
        onSuccess: (data) => {
          useSidebarStore.getState().setExpanded(node.id, true);
          router.push(`/${data.id}`);
        },
      },
    );
  };

  const paddingLeft = 8 + depth * 14;

  return (
    <div>
      <div className="relative">
        {/* Zona: insertar antes (hermano) */}
        <div ref={before.setNodeRef} className="absolute inset-x-0 top-0 z-10 h-1.5" aria-hidden />
        {before.isOver && (
          <div
            className="bg-brand pointer-events-none absolute inset-x-1 top-0 z-20 h-0.5 rounded"
            style={{ marginLeft: paddingLeft }}
          />
        )}

        <ContextMenu>
          <ContextMenuTrigger
            render={
              <div
                ref={(el) => {
                  draggable.setNodeRef(el);
                  inside.setNodeRef(el);
                }}
                {...draggable.attributes}
                {...draggable.listeners}
              />
            }
          >
            <div
              data-active={isActive}
              data-selected={selected}
              className={cn(
                "group/row flex h-7 items-center gap-1 rounded-md pr-1 text-sm",
                "hover:bg-muted data-[active=true]:bg-muted data-[active=true]:font-medium",
                "data-[selected=true]:bg-brand-muted",
                inside.isOver && "ring-brand ring-2 ring-inset",
                draggable.isDragging && "opacity-40",
              )}
              style={{ paddingLeft }}
            >
              {selectionActive ? (
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleSelection(node.id)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Seleccionar ${node.title || "página"}`}
                  className="size-3.5 shrink-0 cursor-pointer"
                  style={{ accentColor: "var(--brand)" }}
                />
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (node.hasChildren) toggleExpanded(node.id);
                  }}
                  className={cn(
                    "text-muted-foreground hover:bg-accent flex size-4 shrink-0 items-center justify-center rounded",
                    !node.hasChildren && "invisible",
                  )}
                  aria-label={expanded ? "Colapsar" : "Expandir"}
                >
                  <ChevronRight
                    className={cn("size-3.5 transition-transform", expanded && "rotate-90")}
                  />
                </button>
              )}

              <PageIcon icon={node.icon} className="shrink-0" />

              {renaming ? (
                <input
                  ref={inputRef}
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setRenaming(false);
                  }}
                  className="bg-background ring-ring h-5 min-w-0 flex-1 rounded-sm px-1 text-sm ring-1 outline-none"
                />
              ) : (
                <Link
                  href={`/${node.id}`}
                  className="min-w-0 flex-1 truncate py-1"
                  title={node.title || "Sin título"}
                >
                  {node.title || "Sin título"}
                </Link>
              )}

              {/* Acciones al hover */}
              <div className="flex shrink-0 items-center opacity-0 group-hover/row:opacity-100 data-[active=true]:opacity-100">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button variant="ghost" size="icon-xs" aria-label="Opciones" />}
                  >
                    <MoreHorizontal />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="right">
                    {menuActions.map((a) => (
                      <div key={a.key}>
                        {a.separatorBefore && <DropdownMenuSeparator />}
                        <DropdownMenuItem variant={a.variant} onClick={a.onSelect}>
                          <a.icon />
                          {a.label}
                        </DropdownMenuItem>
                      </div>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Folder />
                        Añadir a grupo
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {groups.map((g) => (
                          <DropdownMenuItem
                            key={g.id}
                            disabled={g.id === node.groupId}
                            onClick={() => assignGroup.mutate({ ids: [node.id], groupId: g.id })}
                          >
                            <Folder />
                            {g.name || "Grupo sin nombre"}
                          </DropdownMenuItem>
                        ))}
                        {node.groupId && (
                          <DropdownMenuItem
                            onClick={() => assignGroup.mutate({ ids: [node.id], groupId: null })}
                          >
                            <FolderMinus />
                            Quitar del grupo
                          </DropdownMenuItem>
                        )}
                        {groups.length > 0 && <DropdownMenuSeparator />}
                        <DropdownMenuItem
                          onClick={() =>
                            createGroup.mutate(
                              {},
                              {
                                onSuccess: (data) =>
                                  assignGroup.mutate({ ids: [node.id], groupId: data.id }),
                              },
                            )
                          }
                        >
                          <FolderPlus />
                          Nuevo grupo…
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Nueva subpágina"
                  onClick={createChild}
                >
                  <Plus />
                </Button>
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            {menuActions.map((a) => (
              <div key={a.key}>
                {a.separatorBefore && <ContextMenuSeparator />}
                <ContextMenuItem variant={a.variant} onClick={a.onSelect}>
                  <a.icon />
                  {a.label}
                </ContextMenuItem>
              </div>
            ))}
          </ContextMenuContent>
        </ContextMenu>

        {/* Zona: insertar después (hermano) */}
        <div
          ref={after.setNodeRef}
          className="absolute inset-x-0 bottom-0 z-10 h-1.5"
          aria-hidden
        />
        {after.isOver && (
          <div
            className="bg-brand pointer-events-none absolute inset-x-1 bottom-0 z-20 h-0.5 rounded"
            style={{ marginLeft: paddingLeft }}
          />
        )}
      </div>

      {expanded && node.hasChildren && (
        <ChildList
          parentId={node.id}
          depth={depth + 1}
          nodes={childrenQuery.data ?? []}
          loading={childrenQuery.isLoading}
        />
      )}
    </div>
  );
}

interface ChildListProps {
  parentId: string | null;
  depth: number;
  nodes: SidebarNode[];
  loading?: boolean;
}

export function ChildList({ parentId, depth, nodes, loading }: ChildListProps) {
  if (loading) {
    return (
      <div
        className="text-muted-foreground px-2 py-1 text-xs"
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        Cargando…
      </div>
    );
  }
  if (nodes.length === 0) {
    return (
      <div className="text-muted-foreground py-1 text-xs" style={{ paddingLeft: 8 + depth * 14 }}>
        Sin páginas
      </div>
    );
  }
  return (
    <>
      {nodes.map((child, i) => (
        <TreeNode
          key={child.id}
          node={child}
          depth={depth}
          parentId={parentId}
          prevId={i > 0 ? nodes[i - 1].id : null}
          nextId={i < nodes.length - 1 ? nodes[i + 1].id : null}
        />
      ))}
    </>
  );
}

// Re-export para que el DnD maneje el drop en Favoritos sin ciclos de import.
export function useFavoriteDrop() {
  const { favorite } = usePageMutations();
  return (id: string) =>
    favorite.mutate(
      { id, favorite: true },
      { onSuccess: () => toast.success("Añadido a favoritos") },
    );
}
