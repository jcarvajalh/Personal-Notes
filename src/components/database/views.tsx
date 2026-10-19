"use client";

// Los hooks de @dnd-kit (useDraggable/useDroppable) exponen setNodeRef/isOver;
// la regla react-hooks/refs los confunde con refs de render (uso idiomático).
/* eslint-disable react-hooks/refs */

import { useState } from "react";
import Link from "next/link";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { CHIP, formatNumber, PropertyValue } from "@/components/database/value-display";
import { useDatabaseMutations, useDatabaseRows } from "@/hooks/use-database";
import { applyView, rawValue, type ViewConfig } from "@/lib/database/view-config";
import type { DateValue, NumberConfig, SelectOption } from "@/lib/database/types";
import type { DatabaseBundle, DbProperty, DbRow, DbView } from "@/server/queries/databases";

export interface ViewProps {
  pageId: string;
  bundle: DatabaseBundle;
  initialRows: DbRow[];
  view: DbView;
}

function useView({ pageId, bundle, initialRows, view }: ViewProps) {
  const databaseId = bundle.database.id;
  const { data: rawRows = [] } = useDatabaseRows(databaseId, initialRows);
  const m = useDatabaseMutations(pageId, databaseId);
  const rows = applyView(rawRows, bundle.properties, view.config as ViewConfig);
  const titleProp = bundle.properties.find((p) => p.type === "title");
  const otherProps = bundle.properties.filter((p) => p.type !== "title");
  return { rows, m, titleProp, otherProps };
}

function rowTitle(r: DbRow) {
  return r.title || "Sin título";
}

function AddRowButton({ onClick, label = "Nueva fila" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-muted-foreground hover:bg-muted flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
    >
      <Plus className="size-4" />
      {label}
    </button>
  );
}

/** Lista (DB-023): nombre a la izquierda, propiedades a la derecha. */
export function ListView(props: ViewProps) {
  const { rows, m, otherProps } = useView(props);
  return (
    <div className="py-2">
      <div className="border-border divide-border divide-y border-y">
        {rows.map((r) => (
          <div key={r.id} className="hover:bg-muted/30 flex items-center gap-3 px-2 py-1.5">
            <Link href={`/${r.id}`} className="min-w-0 flex-1 truncate text-sm font-medium">
              {rowTitle(r)}
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              {otherProps.slice(0, 4).map((p) => (
                <PropertyValue
                  key={p.id}
                  property={p}
                  value={rawValue(r, p)}
                  className="text-muted-foreground text-xs"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="pt-1">
        <AddRowButton onClick={() => m.createRow.mutate()} />
      </div>
    </div>
  );
}

/** Galería (DB-024): tarjetas con título y propiedades. */
export function GalleryView(props: ViewProps) {
  const { rows, m, otherProps } = useView(props);
  return (
    <div className="py-3">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
        {rows.map((r) => (
          <Link
            key={r.id}
            href={`/${r.id}`}
            className="border-border hover:bg-muted/30 flex flex-col gap-2 rounded-lg border p-3"
          >
            <span className="truncate text-sm font-medium">{rowTitle(r)}</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {otherProps.slice(0, 5).map((p) => (
                <PropertyValue
                  key={p.id}
                  property={p}
                  value={rawValue(r, p)}
                  className="text-muted-foreground text-xs"
                />
              ))}
            </div>
          </Link>
        ))}
      </div>
      <div className="pt-2">
        <AddRowButton onClick={() => m.createRow.mutate()} />
      </div>
    </div>
  );
}

/** Feed (DB-029): cada fila como una entrada ancha tipo publicación. */
export function FeedView(props: ViewProps) {
  const { rows, m, otherProps } = useView(props);
  return (
    <div className="space-y-3 py-3">
      {rows.map((r) => (
        <Link
          key={r.id}
          href={`/${r.id}`}
          className="border-border hover:bg-muted/30 block rounded-lg border p-4"
        >
          <span className="text-base font-medium">{rowTitle(r)}</span>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {otherProps.map((p) => (
              <span key={p.id} className="flex items-center gap-1 text-xs">
                <span className="text-muted-foreground">{p.name}:</span>
                <PropertyValue property={p} value={rawValue(r, p)} />
              </span>
            ))}
          </div>
        </Link>
      ))}
      <AddRowButton onClick={() => m.createRow.mutate()} />
    </div>
  );
}

/** Tablero / Kanban (DB-022): agrupa por la primera propiedad de selección. */
export function BoardView(props: ViewProps) {
  const { rows, m, otherProps } = useView(props);
  const groupProp = props.bundle.properties.find((p) => p.type === "select");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  if (!groupProp) {
    return (
      <p className="text-muted-foreground px-2 py-10 text-center text-sm">
        Añade una propiedad de tipo <strong>Selección</strong> para agrupar las tarjetas en
        columnas.
      </p>
    );
  }

  const options = (groupProp.config.options as SelectOption[] | undefined) ?? [];
  const columns: { id: string | null; name: string; color: string }[] = [
    ...options.map((o) => ({ id: o.id as string | null, name: o.name, color: o.color })),
    { id: null, name: "Sin asignar", color: "gray" },
  ];
  const cardProps = otherProps.filter((p) => p.id !== groupProp.id);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const rowId = String(active.id);
    const optionId = (over.data.current?.optionId as string | null | undefined) ?? null;
    const row = rows.find((r) => r.id === rowId);
    const current = (row?.properties[groupProp.id] as string | undefined) ?? null;
    if (current === optionId) return;
    m.updateValue.mutate({ pageId: rowId, propertyId: groupProp.id, value: optionId });
  };

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto py-3">
        {columns.map((col) => {
          const colRows = rows.filter(
            (r) => ((r.properties[groupProp.id] as string | undefined) ?? null) === col.id,
          );
          return (
            <BoardColumn
              key={col.id ?? "__none__"}
              col={col}
              rows={colRows}
              cardProps={cardProps}
              onAdd={() =>
                m.createRow.mutate(undefined, {
                  onSuccess: (data) => {
                    if (col.id)
                      m.updateValue.mutate({
                        pageId: data.id,
                        propertyId: groupProp.id,
                        value: col.id,
                      });
                  },
                })
              }
            />
          );
        })}
      </div>
    </DndContext>
  );
}

function BoardColumn({
  col,
  rows,
  cardProps,
  onAdd,
}: {
  col: { id: string | null; name: string; color: string };
  rows: DbRow[];
  cardProps: DbProperty[];
  onAdd: () => void;
}) {
  const drop = useDroppable({ id: col.id ?? "__none__", data: { optionId: col.id } });
  return (
    <div
      ref={drop.setNodeRef}
      className={cn(
        "bg-muted/40 flex w-64 shrink-0 flex-col gap-2 rounded-lg p-2",
        drop.isOver && "ring-brand ring-2 ring-inset",
      )}
    >
      <div className="flex items-center justify-between px-1">
        <span className={cn("rounded px-1.5 py-0.5 text-xs", CHIP[col.color] ?? CHIP.gray)}>
          {col.name}
        </span>
        <span className="text-muted-foreground text-xs">{rows.length}</span>
      </div>
      {rows.map((r) => (
        <BoardCard key={r.id} row={r} cardProps={cardProps} />
      ))}
      <AddRowButton onClick={onAdd} label="Nueva" />
    </div>
  );
}

function BoardCard({ row, cardProps }: { row: DbRow; cardProps: DbProperty[] }) {
  const drag = useDraggable({ id: row.id });
  return (
    <div
      ref={drag.setNodeRef}
      {...drag.attributes}
      {...drag.listeners}
      className={cn(
        "bg-background border-border cursor-grab rounded-md border p-2 shadow-sm",
        drag.isDragging && "opacity-40",
      )}
    >
      <div className="truncate text-sm font-medium">{rowTitle(row)}</div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        {cardProps.slice(0, 4).map((p) => (
          <PropertyValue
            key={p.id}
            property={p}
            value={rawValue(row, p)}
            className="text-muted-foreground text-xs"
          />
        ))}
      </div>
    </div>
  );
}

// --- Fecha ------------------------------------------------------------------
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

// --- Panel de control (DB-027 ligero) ---------------------------------------
function MetricCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-border rounded-lg border p-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export function DashboardView(props: ViewProps) {
  const { rows } = useView(props);
  const properties = props.bundle.properties;
  const selectProps = properties.filter((p) => p.type === "select");
  const numberProps = properties.filter((p) => p.type === "number");
  const checkboxProps = properties.filter((p) => p.type === "checkbox");

  return (
    <div className="space-y-4 py-3">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
        <MetricCard label="Total de filas" value={rows.length} />
        {numberProps.map((p) => {
          const sum = rows.reduce(
            (acc, r) =>
              acc + (typeof r.properties[p.id] === "number" ? (r.properties[p.id] as number) : 0),
            0,
          );
          return (
            <MetricCard
              key={p.id}
              label={`Suma · ${p.name}`}
              value={formatNumber(sum, p.config as NumberConfig)}
            />
          );
        })}
        {checkboxProps.map((p) => {
          const checked = rows.filter((r) => r.properties[p.id] === true).length;
          return <MetricCard key={p.id} label={p.name} value={`${checked}/${rows.length}`} />;
        })}
      </div>

      {selectProps.map((p) => {
        const options = (p.config.options as SelectOption[] | undefined) ?? [];
        const none = rows.filter((r) => !r.properties[p.id]).length;
        return (
          <div key={p.id} className="border-border rounded-lg border p-3">
            <div className="mb-2 text-sm font-medium">{p.name}</div>
            <div className="space-y-1">
              {options.map((o) => (
                <div key={o.id} className="flex items-center justify-between text-sm">
                  <span className={cn("rounded px-1.5 py-0.5 text-xs", CHIP[o.color] ?? CHIP.gray)}>
                    {o.name}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {rows.filter((r) => r.properties[p.id] === o.id).length}
                  </span>
                </div>
              ))}
              {none > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground text-xs">Sin asignar</span>
                  <span className="text-muted-foreground tabular-nums">{none}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {properties.length <= 1 && (
        <p className="text-muted-foreground text-sm">
          Añade propiedades (número, casilla o selección) para ver indicadores.
        </p>
      )}
    </div>
  );
}

// --- Calendario (DB-025) ----------------------------------------------------
const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function CalendarView(props: ViewProps) {
  const { rows, m } = useView(props);
  const dateProp = props.bundle.properties.find((p) => p.type === "date");
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), mo: d.getMonth() };
  });

  if (!dateProp) {
    return (
      <p className="text-muted-foreground px-2 py-10 text-center text-sm">
        Añade una propiedad de tipo <strong>Fecha</strong> para ver el calendario.
      </p>
    );
  }

  const first = new Date(cursor.y, cursor.mo, 1);
  const startOffset = (first.getDay() + 6) % 7; // lunes = 0
  const gridStart = new Date(cursor.y, cursor.mo, 1 - startOffset);
  const days = Array.from(
    { length: 42 },
    (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i),
  );

  const byDay = new Map<string, DbRow[]>();
  for (const r of rows) {
    const v = (r.properties[dateProp.id] as DateValue | undefined)?.start;
    if (v) {
      const arr = byDay.get(v) ?? [];
      arr.push(r);
      byDay.set(v, arr);
    }
  }

  const todayStr = ymd(new Date());
  const monthLabel = first.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  const shift = (delta: number) =>
    setCursor((c) => {
      const d = new Date(c.y, c.mo + delta, 1);
      return { y: d.getFullYear(), mo: d.getMonth() };
    });

  return (
    <div className="py-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-medium capitalize">{monthLabel}</span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            aria-label="Mes anterior"
            onClick={() => shift(-1)}
            className="hover:bg-muted rounded p-1"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              const d = new Date();
              setCursor({ y: d.getFullYear(), mo: d.getMonth() });
            }}
            className="hover:bg-muted rounded px-2 py-1 text-xs"
          >
            Hoy
          </button>
          <button
            type="button"
            aria-label="Mes siguiente"
            onClick={() => shift(1)}
            className="hover:bg-muted rounded p-1"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div className="border-border grid grid-cols-7 border-t border-l">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="border-border text-muted-foreground border-r border-b px-2 py-1 text-xs"
          >
            {w}
          </div>
        ))}
        {days.map((day) => {
          const key = ymd(day);
          const inMonth = day.getMonth() === cursor.mo;
          const dayRows = byDay.get(key) ?? [];
          return (
            <div
              key={key}
              className={cn(
                "border-border group/day min-h-20 border-r border-b p-1",
                !inMonth && "bg-muted/30",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-xs",
                    key === todayStr
                      ? "bg-brand text-brand-foreground rounded-full px-1.5"
                      : "text-muted-foreground",
                    !inMonth && "opacity-50",
                  )}
                >
                  {day.getDate()}
                </span>
                <button
                  type="button"
                  aria-label="Nueva fila en este día"
                  onClick={() =>
                    m.createRow.mutate(undefined, {
                      onSuccess: (data) =>
                        m.updateValue.mutate({
                          pageId: data.id,
                          propertyId: dateProp.id,
                          value: { start: key, include_time: false },
                        }),
                    })
                  }
                  className="hover:bg-muted rounded p-0.5 opacity-0 group-hover/day:opacity-100"
                >
                  <Plus className="size-3" />
                </button>
              </div>
              <div className="mt-1 space-y-0.5">
                {dayRows.map((r) => (
                  <Link
                    key={r.id}
                    href={`/${r.id}`}
                    className="bg-muted hover:bg-muted/70 block truncate rounded px-1 py-0.5 text-xs"
                  >
                    {rowTitle(r)}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Cronograma / Gantt (DB-026) --------------------------------------------
interface TimelineItem {
  row: DbRow;
  start: string;
  end: string;
}

export function TimelineView(props: ViewProps) {
  const { rows } = useView(props);
  const dateProps = props.bundle.properties.filter((p) => p.type === "date");
  const startProp = dateProps[0];
  const endProp = dateProps[1];

  if (!startProp) {
    return (
      <p className="text-muted-foreground px-2 py-10 text-center text-sm">
        Añade una propiedad de tipo <strong>Fecha</strong> (y opcionalmente otra de fin) para el
        cronograma.
      </p>
    );
  }

  const items: TimelineItem[] = rows
    .map((r): TimelineItem | null => {
      const s = (r.properties[startProp.id] as DateValue | undefined)?.start;
      if (!s) return null;
      const e = endProp ? ((r.properties[endProp.id] as DateValue | undefined)?.start ?? s) : s;
      return { row: r, start: s, end: e < s ? s : e };
    })
    .filter((x): x is TimelineItem => x !== null);

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground px-2 py-10 text-center text-sm">
        No hay filas con fecha para mostrar.
      </p>
    );
  }

  const allDates = items.flatMap((it) => [it.start, it.end]);
  const min = allDates.reduce((a, b) => (a < b ? a : b));
  const max = allDates.reduce((a, b) => (a > b ? a : b));
  const minD = new Date(`${min}T00:00:00`);
  const maxD = new Date(`${max}T00:00:00`);
  const dayMs = 86_400_000;
  const totalDays = Math.round((maxD.getTime() - minD.getTime()) / dayMs) + 1;
  const dayW = 30;
  const labelW = 160;
  const dayIndex = (s: string) =>
    Math.round((new Date(`${s}T00:00:00`).getTime() - minD.getTime()) / dayMs);
  const todayIdx = dayIndex(ymd(new Date()));
  const ticks = Array.from(
    { length: totalDays },
    (_, i) => new Date(minD.getFullYear(), minD.getMonth(), minD.getDate() + i),
  );

  return (
    <div className="overflow-x-auto py-3">
      <div style={{ width: totalDays * dayW + labelW }}>
        <div className="flex">
          <div style={{ width: labelW }} className="shrink-0" />
          {ticks.map((d) => (
            <div
              key={ymd(d)}
              style={{ width: dayW }}
              className="border-border text-muted-foreground shrink-0 border-l text-center text-[10px]"
            >
              {d.getDate()}
            </div>
          ))}
        </div>
        <div className="relative mt-1">
          {todayIdx >= 0 && todayIdx < totalDays && (
            <div
              className="bg-brand/60 absolute top-0 bottom-0 w-px"
              style={{ left: labelW + todayIdx * dayW }}
            />
          )}
          {items.map((it) => {
            const left = dayIndex(it.start) * dayW;
            const span = Math.max(1, dayIndex(it.end) - dayIndex(it.start) + 1);
            return (
              <div key={it.row.id} className="flex h-8 items-center">
                <div style={{ width: labelW }} className="shrink-0 truncate pr-2 text-sm">
                  {rowTitle(it.row)}
                </div>
                <div className="relative h-full flex-1">
                  <Link
                    href={`/${it.row.id}`}
                    style={{ left, width: span * dayW }}
                    className="bg-brand/80 hover:bg-brand text-brand-foreground absolute top-1.5 flex h-5 items-center overflow-hidden rounded px-1 text-xs"
                  >
                    {rowTitle(it.row)}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
