"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDownUp, Filter, Layers, Plus, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  OPERATORS,
  operatorGroup,
  type FilterRule,
  type ViewConfig,
} from "@/lib/database/view-config";
import type { SelectOption } from "@/lib/database/types";
import type { DatabaseBundle, DbProperty } from "@/server/queries/databases";

interface ViewToolbarProps {
  bundle: DatabaseBundle;
  view: { config: Record<string, unknown> };
  onChange: (patch: Partial<ViewConfig>) => void;
}

export function ViewToolbar({ bundle, view, onChange }: ViewToolbarProps) {
  const config = (view.config ?? {}) as ViewConfig;
  const properties = bundle.properties;
  const filters = config.filters ?? [];
  const sorts = config.sorts ?? [];

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      <SearchBox value={config.search ?? ""} onChange={(search) => onChange({ search })} />
      <div className="ml-auto flex items-center gap-1">
        <FilterMenu
          properties={properties}
          filters={filters}
          filterOp={config.filterOp ?? "and"}
          onChange={(filters, filterOp) => onChange({ filters, filterOp })}
        />
        <SortMenu properties={properties} sorts={sorts} onChange={(sorts) => onChange({ sorts })} />
        <GroupMenu
          properties={properties}
          groupBy={config.group_by ?? null}
          onChange={(group_by) => onChange({ group_by })}
        />
      </div>
    </div>
  );
}

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => onChange(draft), 300);
    return () => clearTimeout(t);
    // onChange se mantiene estable por el merge en el padre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  return (
    <div className="bg-muted/50 flex items-center gap-1.5 rounded-md px-2 py-1">
      <Search className="text-muted-foreground size-3.5" />
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Buscar…"
        className="w-32 bg-transparent text-sm outline-none"
      />
    </div>
  );
}

/** Control del valor de un filtro según el tipo de propiedad. */
function ValueControl({
  property,
  value,
  onChange,
}: {
  property: DbProperty;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const base = "bg-background ring-border h-7 rounded px-1.5 text-sm ring-1 outline-none";
  if (property.type === "select" || property.type === "status") {
    const options = (property.config.options as SelectOption[] | undefined) ?? [];
    return (
      <select
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        className={base}
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    );
  }
  const inputType =
    property.type === "date" ? "date" : property.type === "number" ? "number" : "text";
  return (
    <input
      type={inputType}
      value={typeof value === "string" || typeof value === "number" ? String(value) : ""}
      onChange={(e) =>
        onChange(property.type === "number" ? Number(e.target.value) : e.target.value)
      }
      className={cn(base, "w-32")}
    />
  );
}

function FilterMenu({
  properties,
  filters,
  filterOp,
  onChange,
}: {
  properties: DbProperty[];
  filters: FilterRule[];
  filterOp: "and" | "or";
  onChange: (filters: FilterRule[], op: "and" | "or") => void;
}) {
  const propById = (id: string) => properties.find((p) => p.id === id);
  const addFilter = () => {
    const p = properties[0];
    if (!p) return;
    const ops = OPERATORS[operatorGroup(p.type)];
    onChange([...filters, { property_id: p.id, operator: ops[0].value }], filterOp);
  };
  const setFilter = (i: number, patch: Partial<FilterRule>) =>
    onChange(
      filters.map((f, idx) => (idx === i ? { ...f, ...patch } : f)),
      filterOp,
    );
  const removeFilter = (i: number) =>
    onChange(
      filters.filter((_, idx) => idx !== i),
      filterOp,
    );

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="sm" className={cn(filters.length > 0 && "text-brand")} />
        }
      >
        <Filter className="size-3.5" />
        Filtros
        {filters.length > 0 && <span className="text-muted-foreground">{filters.length}</span>}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-2">
        {filters.length > 1 && (
          <div className="mb-2 flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Coincidir</span>
            <select
              value={filterOp}
              onChange={(e) => onChange(filters, e.target.value as "and" | "or")}
              className="bg-background ring-border rounded px-1 py-0.5 ring-1 outline-none"
            >
              <option value="and">todos</option>
              <option value="or">cualquiera</option>
            </select>
          </div>
        )}
        <div className="space-y-1.5">
          {filters.map((f, i) => {
            const prop = propById(f.property_id) ?? properties[0];
            const ops = OPERATORS[operatorGroup(prop.type)];
            const current = ops.find((o) => o.value === f.operator) ?? ops[0];
            return (
              <div key={i} className="flex items-center gap-1">
                <select
                  value={f.property_id}
                  onChange={(e) => {
                    const np = propById(e.target.value)!;
                    const nops = OPERATORS[operatorGroup(np.type)];
                    setFilter(i, { property_id: np.id, operator: nops[0].value, value: undefined });
                  }}
                  className="bg-background ring-border h-7 max-w-28 rounded px-1 text-sm ring-1 outline-none"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <select
                  value={f.operator}
                  onChange={(e) => setFilter(i, { operator: e.target.value })}
                  className="bg-background ring-border h-7 rounded px-1 text-sm ring-1 outline-none"
                >
                  {ops.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {!current.unary && (
                  <ValueControl
                    property={prop}
                    value={f.value}
                    onChange={(v) => setFilter(i, { value: v })}
                  />
                )}
                <button
                  type="button"
                  aria-label="Quitar filtro"
                  onClick={() => removeFilter(i)}
                  className="hover:bg-muted ml-auto rounded p-1"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={addFilter}
          className="text-muted-foreground hover:bg-muted mt-2 flex items-center gap-1 rounded px-1.5 py-1 text-sm"
        >
          <Plus className="size-3.5" />
          Añadir filtro
        </button>
      </PopoverContent>
    </Popover>
  );
}

function SortMenu({
  properties,
  sorts,
  onChange,
}: {
  properties: DbProperty[];
  sorts: { property_id: string; direction: "asc" | "desc" }[];
  onChange: (sorts: { property_id: string; direction: "asc" | "desc" }[]) => void;
}) {
  const addSort = () => {
    const p = properties[0];
    if (!p) return;
    onChange([...sorts, { property_id: p.id, direction: "asc" }]);
  };
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="sm" className={cn(sorts.length > 0 && "text-brand")} />
        }
      >
        <ArrowDownUp className="size-3.5" />
        Ordenar
        {sorts.length > 0 && <span className="text-muted-foreground">{sorts.length}</span>}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-2">
        <div className="space-y-1.5">
          {sorts.map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <select
                value={s.property_id}
                onChange={(e) =>
                  onChange(
                    sorts.map((x, idx) => (idx === i ? { ...x, property_id: e.target.value } : x)),
                  )
                }
                className="bg-background ring-border h-7 flex-1 rounded px-1 text-sm ring-1 outline-none"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                value={s.direction}
                onChange={(e) =>
                  onChange(
                    sorts.map((x, idx) =>
                      idx === i ? { ...x, direction: e.target.value as "asc" | "desc" } : x,
                    ),
                  )
                }
                className="bg-background ring-border h-7 rounded px-1 text-sm ring-1 outline-none"
              >
                <option value="asc">Ascendente</option>
                <option value="desc">Descendente</option>
              </select>
              <button
                type="button"
                aria-label="Quitar orden"
                onClick={() => onChange(sorts.filter((_, idx) => idx !== i))}
                className="hover:bg-muted rounded p-1"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addSort}
          className="text-muted-foreground hover:bg-muted mt-2 flex items-center gap-1 rounded px-1.5 py-1 text-sm"
        >
          <Plus className="size-3.5" />
          Añadir orden
        </button>
      </PopoverContent>
    </Popover>
  );
}

function GroupMenu({
  properties,
  groupBy,
  onChange,
}: {
  properties: DbProperty[];
  groupBy: string | null;
  onChange: (groupBy: string | null) => void;
}) {
  const groupable = properties.filter((p) => p.type !== "title");
  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant="ghost" size="sm" className={cn(groupBy && "text-brand")} />}
      >
        <Layers className="size-3.5" />
        Agrupar
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={cn(
            "hover:bg-muted flex w-full items-center rounded px-2 py-1.5 text-sm",
            !groupBy && "font-medium",
          )}
        >
          Sin agrupar
        </button>
        {groupable.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.id)}
            className={cn(
              "hover:bg-muted flex w-full items-center rounded px-2 py-1.5 text-sm",
              groupBy === p.id && "font-medium",
            )}
          >
            {p.name}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
