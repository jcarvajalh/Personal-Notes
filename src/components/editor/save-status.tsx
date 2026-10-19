"use client";

import { Check, CloudOff, Loader2, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import { useSaveStatusStore } from "@/stores/save-status";

/** Indicador de guardado en la barra superior (ED-039, flujo 4.3 paso 5). */
export function SaveStatusIndicator() {
  const status = useSaveStatusStore((s) => s.status);

  if (status === "idle") return null;

  const map = {
    saving: { icon: Loader2, label: "Guardando…", spin: true, className: "text-muted-foreground" },
    saved: { icon: Check, label: "Guardado", spin: false, className: "text-muted-foreground" },
    offline: {
      icon: CloudOff,
      label: "Sin conexión — cambios en cola",
      spin: false,
      className: "text-amber-600 dark:text-amber-500",
    },
    conflict: {
      icon: TriangleAlert,
      label: "Conflicto de edición",
      spin: false,
      className: "text-destructive",
    },
    error: {
      icon: TriangleAlert,
      label: "Error al guardar",
      spin: false,
      className: "text-destructive",
    },
  } as const;

  const { icon: Icon, label, spin, className } = map[status];

  return (
    <span className={cn("flex items-center gap-1.5 px-2 text-xs", className)}>
      <Icon className={cn("size-3.5", spin && "animate-spin")} />
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}
