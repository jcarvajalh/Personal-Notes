"use client";

import { useRouter } from "next/navigation";
import {
  Copy,
  CornerUpRight,
  ExternalLink,
  Link as LinkIcon,
  Pencil,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { usePageMutations } from "@/hooks/use-pages";
import { useDialogsStore } from "@/stores/dialogs";
import type { SidebarNode } from "@/server/queries/pages";

export interface PageActionItem {
  key: string;
  label: string;
  icon: React.ElementType;
  onSelect: () => void;
  variant?: "default" | "destructive";
  separatorBefore?: boolean;
}

/** Acciones del menú contextual de una página (NV-004). */
export function usePageActions(
  node: Pick<SidebarNode, "id" | "title" | "isFavorite">,
  opts: { onStartRename?: () => void } = {},
): PageActionItem[] {
  const router = useRouter();
  const { duplicate, trash, favorite } = usePageMutations();
  const openMove = useDialogsStore((s) => s.openMove);

  const copyLink = async () => {
    const url = `${window.location.origin}/${node.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado");
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  };

  return [
    ...(opts.onStartRename
      ? [
          {
            key: "rename",
            label: "Renombrar",
            icon: Pencil,
            onSelect: opts.onStartRename,
          } satisfies PageActionItem,
        ]
      : []),
    {
      key: "duplicate",
      label: "Duplicar",
      icon: Copy,
      onSelect: () =>
        duplicate.mutate(
          { id: node.id, withChildren: true },
          { onSuccess: () => toast.success("Página duplicada") },
        ),
    },
    {
      key: "move",
      label: "Mover a…",
      icon: CornerUpRight,
      onSelect: () => openMove({ id: node.id, title: node.title }),
    },
    {
      key: "copy-link",
      label: "Copiar enlace",
      icon: LinkIcon,
      onSelect: copyLink,
    },
    {
      key: "open-tab",
      label: "Abrir en nueva pestaña",
      icon: ExternalLink,
      onSelect: () => window.open(`/${node.id}`, "_blank", "noopener"),
    },
    {
      key: "favorite",
      label: node.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos",
      icon: node.isFavorite ? StarOff : Star,
      onSelect: () => favorite.mutate({ id: node.id, favorite: !node.isFavorite }),
    },
    {
      key: "trash",
      label: "Eliminar",
      icon: Trash2,
      variant: "destructive",
      separatorBefore: true,
      onSelect: () =>
        trash.mutate(
          { id: node.id },
          {
            onSuccess: () => {
              toast.success("Página movida a la papelera");
              router.refresh();
            },
          },
        ),
    },
  ];
}
