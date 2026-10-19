"use client";

import { useState } from "react";
import { Check, Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SELECT_COLORS, type DateValue, type SelectOption } from "@/lib/database/types";
import { CHIP, PropertyValue } from "@/components/database/value-display";
import type { DbProperty } from "@/server/queries/databases";

// Las celdas de texto/número/título usan inputs NO controlados (`defaultValue`
// con `key` = valor confirmado) y confirman en `blur`. Así se evita sincronizar
// estado con props dentro de un efecto (prohibido por react-hooks/set-state-in-effect).

const cellInput = "h-full w-full bg-transparent px-2 py-1 text-sm outline-none focus:bg-muted/50";

/** Celda de texto / url / email / teléfono. */
function TextCell({
  value,
  onCommit,
  type,
}: {
  value: unknown;
  onCommit: (v: string) => void;
  type: string;
}) {
  const str = typeof value === "string" ? value : "";
  const inputType =
    type === "email" ? "email" : type === "url" ? "url" : type === "phone" ? "tel" : "text";
  return (
    <input
      key={str}
      type={inputType}
      defaultValue={str}
      onBlur={(e) => {
        if (e.target.value !== str) onCommit(e.target.value);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      className={cellInput}
    />
  );
}

/** Celda numérica. */
function NumberCell({ value, onCommit }: { value: unknown; onCommit: (v: number | null) => void }) {
  const str = typeof value === "number" ? String(value) : "";
  return (
    <input
      key={str}
      type="number"
      defaultValue={str}
      onBlur={(e) => {
        const raw = e.target.value.trim();
        if (raw === str) return;
        const n = raw === "" ? null : Number(raw);
        onCommit(n === null || Number.isNaN(n) ? null : n);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      className={cn(cellInput, "tabular-nums")}
    />
  );
}

/** Celda de casilla de verificación. */
function CheckboxCell({ value, onCommit }: { value: unknown; onCommit: (v: boolean) => void }) {
  return (
    <div className="flex h-full items-center px-2">
      <input
        type="checkbox"
        checked={value === true}
        onChange={(e) => onCommit(e.target.checked)}
        className="size-4 cursor-pointer"
        style={{ accentColor: "var(--brand)" }}
      />
    </div>
  );
}

/** Celda de fecha. */
function DateCell({
  value,
  onCommit,
}: {
  value: unknown;
  onCommit: (v: DateValue | null) => void;
}) {
  const current = (value as DateValue | null) ?? null;
  return (
    <input
      type="date"
      value={current?.start ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        onCommit(v ? { start: v, include_time: false } : null);
      }}
      className={cellInput}
    />
  );
}

/** Celda de selección (una opción). Permite crear opciones al vuelo. */
function SelectCell({
  property,
  value,
  onCommit,
  onConfigChange,
}: {
  property: DbProperty;
  value: unknown;
  onCommit: (v: string | null) => void;
  onConfigChange: (config: Record<string, unknown>) => void;
}) {
  const options = (property.config.options as SelectOption[] | undefined) ?? [];
  const selected = options.find((o) => o.id === value) ?? null;
  const [newName, setNewName] = useState("");

  const addOption = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const existing = options.find((o) => o.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      onCommit(existing.id);
      setNewName("");
      return;
    }
    const id = crypto.randomUUID();
    const color = SELECT_COLORS[options.length % SELECT_COLORS.length];
    onConfigChange({ ...property.config, options: [...options, { id, name: trimmed, color }] });
    onCommit(id);
    setNewName("");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:bg-muted/50 flex h-full w-full items-center gap-1 px-2 py-1 text-left text-sm outline-none">
        {selected ? (
          <span className={cn("rounded px-1.5 py-0.5 text-xs", CHIP[selected.color] ?? CHIP.gray)}>
            {selected.name}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">Vacío</span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {selected && (
          <DropdownMenuItem onClick={() => onCommit(null)}>
            <X />
            Quitar
          </DropdownMenuItem>
        )}
        {options.map((o) => (
          <DropdownMenuItem key={o.id} onClick={() => onCommit(o.id)}>
            <span className={cn("rounded px-1.5 py-0.5 text-xs", CHIP[o.color] ?? CHIP.gray)}>
              {o.name}
            </span>
            {o.id === value && <Check className="ml-auto" />}
          </DropdownMenuItem>
        ))}
        <div className="flex items-center gap-1 px-1.5 py-1">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addOption(newName);
              }
            }}
            placeholder="Nueva opción…"
            className="bg-background ring-border h-6 min-w-0 flex-1 rounded px-1.5 text-xs ring-1 outline-none"
          />
          <button
            type="button"
            onClick={() => addOption(newName)}
            aria-label="Crear opción"
            className="hover:bg-muted rounded p-1"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Despacha la celda según el tipo de propiedad. */
export function ValueCell({
  property,
  value,
  onCommit,
  onConfigChange,
}: {
  property: DbProperty;
  value: unknown;
  onCommit: (v: unknown) => void;
  onConfigChange: (config: Record<string, unknown>) => void;
}) {
  switch (property.type) {
    case "text":
    case "url":
    case "email":
    case "phone":
      return <TextCell value={value} type={property.type} onCommit={onCommit} />;
    case "number":
      return <NumberCell value={value} onCommit={onCommit} />;
    case "checkbox":
      return <CheckboxCell value={value} onCommit={onCommit} />;
    case "date":
      return <DateCell value={value} onCommit={onCommit} />;
    case "select":
      return (
        <SelectCell
          property={property}
          value={value}
          onCommit={onCommit}
          onConfigChange={onConfigChange}
        />
      );
    case "created_time":
    case "last_edited_time":
      // DB-004: automáticas, de solo lectura.
      return (
        <div className="flex h-full items-center px-2 py-1">
          <PropertyValue property={property} value={value} className="truncate text-sm" />
        </div>
      );
    default:
      return <span className="text-muted-foreground px-2 py-1 text-xs">No editable aún</span>;
  }
}

/** Celda del título de la fila (propiedad Title / pages.title). */
export function TitleCell({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  return (
    <input
      key={value}
      defaultValue={value}
      onBlur={(e) => {
        if (e.target.value !== value) onCommit(e.target.value);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      placeholder="Sin título"
      className={cn(cellInput, "font-medium")}
    />
  );
}
