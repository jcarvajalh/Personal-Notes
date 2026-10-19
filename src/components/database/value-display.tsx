"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DateValue, NumberConfig, SelectOption } from "@/lib/database/types";
import type { DbProperty } from "@/server/queries/databases";

/** Clases de color para los chips de select/status (compartido con las celdas). */
export const CHIP: Record<string, string> = {
  gray: "bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-100",
  brown: "bg-amber-200 text-amber-950 dark:bg-amber-900/60 dark:text-amber-100",
  orange: "bg-orange-200 text-orange-950 dark:bg-orange-900/60 dark:text-orange-100",
  yellow: "bg-yellow-200 text-yellow-950 dark:bg-yellow-900/60 dark:text-yellow-100",
  green: "bg-green-200 text-green-950 dark:bg-green-900/60 dark:text-green-100",
  blue: "bg-blue-200 text-blue-950 dark:bg-blue-900/60 dark:text-blue-100",
  purple: "bg-purple-200 text-purple-950 dark:bg-purple-900/60 dark:text-purple-100",
  pink: "bg-pink-200 text-pink-950 dark:bg-pink-900/60 dark:text-pink-100",
  red: "bg-red-200 text-red-950 dark:bg-red-900/60 dark:text-red-100",
};

export function formatNumber(value: number, config: NumberConfig): string {
  if (config.format === "percent") return `${(value * 100).toLocaleString("es-CO")}%`;
  if (config.format === "currency") {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: config.currency ?? "COP",
      maximumFractionDigits: config.decimals ?? 0,
    }).format(value);
  }
  return value.toLocaleString("es-CO");
}

export function formatDate(value: DateValue): string {
  const d = new Date(`${value.start}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value.start;
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

/** Representación de solo lectura del valor de una propiedad (tarjetas y listas). */
export function PropertyValue({
  property,
  value,
  className,
}: {
  property: DbProperty;
  value: unknown;
  className?: string;
}) {
  if (value === null || value === undefined || value === "") return null;

  switch (property.type) {
    case "number":
      return (
        <span className={cn("tabular-nums", className)}>
          {typeof value === "number" ? formatNumber(value, property.config as NumberConfig) : ""}
        </span>
      );
    case "checkbox":
      return value === true ? <Check className={cn("size-4", className)} /> : null;
    case "date":
      return <span className={className}>{formatDate(value as DateValue)}</span>;
    case "select": {
      const options = (property.config.options as SelectOption[] | undefined) ?? [];
      const opt = options.find((o) => o.id === value);
      if (!opt) return null;
      return (
        <span
          className={cn("rounded px-1.5 py-0.5 text-xs", CHIP[opt.color] ?? CHIP.gray, className)}
        >
          {opt.name}
        </span>
      );
    }
    default:
      return <span className={cn("truncate", className)}>{String(value)}</span>;
  }
}
