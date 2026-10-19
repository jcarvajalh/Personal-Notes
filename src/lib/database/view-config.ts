// Filtros, orden, búsqueda y agrupación de vistas (6.11, subconjunto práctico).
import type { DateValue, SelectOption } from "@/lib/database/types";
import type { DbProperty, DbRow } from "@/server/queries/databases";

export interface FilterRule {
  property_id: string;
  operator: string;
  value?: unknown;
}

export interface ViewConfig {
  filterOp?: "and" | "or";
  filters?: FilterRule[];
  sorts?: { property_id: string; direction: "asc" | "desc" }[];
  group_by?: string | null;
  search?: string;
}

/** Operadores disponibles por tipo de propiedad (etiqueta visible + clave). */
export const OPERATORS: Record<string, { value: string; label: string; unary?: boolean }[]> = {
  text: [
    { value: "contains", label: "contiene" },
    { value: "does_not_contain", label: "no contiene" },
    { value: "is", label: "es" },
    { value: "is_not", label: "no es" },
    { value: "is_empty", label: "está vacío", unary: true },
    { value: "is_not_empty", label: "no está vacío", unary: true },
  ],
  number: [
    { value: "eq", label: "=" },
    { value: "neq", label: "≠" },
    { value: "gt", label: ">" },
    { value: "lt", label: "<" },
    { value: "gte", label: "≥" },
    { value: "lte", label: "≤" },
    { value: "is_empty", label: "está vacío", unary: true },
    { value: "is_not_empty", label: "no está vacío", unary: true },
  ],
  select: [
    { value: "is", label: "es" },
    { value: "is_not", label: "no es" },
    { value: "is_empty", label: "está vacío", unary: true },
    { value: "is_not_empty", label: "no está vacío", unary: true },
  ],
  checkbox: [
    { value: "checked", label: "marcado", unary: true },
    { value: "unchecked", label: "sin marcar", unary: true },
  ],
  date: [
    { value: "is", label: "es" },
    { value: "before", label: "antes de" },
    { value: "after", label: "después de" },
    { value: "is_empty", label: "está vacío", unary: true },
    { value: "is_not_empty", label: "no está vacío", unary: true },
  ],
};

/** Normaliza el tipo de propiedad al grupo de operadores que le aplica. */
export function operatorGroup(type: string): keyof typeof OPERATORS {
  if (type === "number") return "number";
  if (type === "select" || type === "status") return "select";
  if (type === "checkbox") return "checkbox";
  if (type === "date") return "date";
  return "text";
}

function rawValue(row: DbRow, prop: DbProperty): unknown {
  return prop.type === "title" ? row.title : row.properties[prop.id];
}

function asText(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

function isEmpty(v: unknown): boolean {
  return v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
}

function evaluate(row: DbRow, prop: DbProperty, rule: FilterRule): boolean {
  const v = rawValue(row, prop);
  switch (rule.operator) {
    case "is_empty":
      return isEmpty(v);
    case "is_not_empty":
      return !isEmpty(v);
    case "checked":
      return v === true;
    case "unchecked":
      return v !== true;
    case "contains":
      return asText(v).toLowerCase().includes(asText(rule.value).toLowerCase());
    case "does_not_contain":
      return !asText(v).toLowerCase().includes(asText(rule.value).toLowerCase());
    case "is":
      if (prop.type === "date") return (v as DateValue | undefined)?.start === rule.value;
      return asText(v) === asText(rule.value);
    case "is_not":
      if (prop.type === "date") return (v as DateValue | undefined)?.start !== rule.value;
      return asText(v) !== asText(rule.value);
    case "eq":
      return typeof v === "number" && v === Number(rule.value);
    case "neq":
      return !(typeof v === "number" && v === Number(rule.value));
    case "gt":
      return typeof v === "number" && v > Number(rule.value);
    case "lt":
      return typeof v === "number" && v < Number(rule.value);
    case "gte":
      return typeof v === "number" && v >= Number(rule.value);
    case "lte":
      return typeof v === "number" && v <= Number(rule.value);
    case "before":
      return (
        Boolean((v as DateValue | undefined)?.start) && (v as DateValue).start < asText(rule.value)
      );
    case "after":
      return (
        Boolean((v as DateValue | undefined)?.start) && (v as DateValue).start > asText(rule.value)
      );
    default:
      return true;
  }
}

function matchesSearch(row: DbRow, properties: DbProperty[], search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  if (row.title.toLowerCase().includes(q)) return true;
  return properties.some((p) => {
    if (p.type === "title") return false;
    const v = row.properties[p.id];
    return typeof v === "string" && v.toLowerCase().includes(q);
  });
}

function compare(a: unknown, b: unknown, prop: DbProperty): number {
  if (prop.type === "number") return (Number(a) || 0) - (Number(b) || 0);
  if (prop.type === "date") {
    const av = (a as DateValue | undefined)?.start ?? "";
    const bv = (b as DateValue | undefined)?.start ?? "";
    return av < bv ? -1 : av > bv ? 1 : 0;
  }
  if (prop.type === "checkbox") return (a === true ? 1 : 0) - (b === true ? 1 : 0);
  return asText(a).localeCompare(asText(b), "es");
}

/** Aplica búsqueda + filtros + orden a las filas (no muta la entrada). */
export function applyView(rows: DbRow[], properties: DbProperty[], config: ViewConfig): DbRow[] {
  const byId = new Map(properties.map((p) => [p.id, p]));
  const filters = (config.filters ?? []).filter((f) => byId.has(f.property_id));
  const op = config.filterOp ?? "and";

  let result = rows.filter((row) => {
    if (!matchesSearch(row, properties, config.search ?? "")) return false;
    if (filters.length === 0) return true;
    const results = filters.map((rule) => evaluate(row, byId.get(rule.property_id)!, rule));
    return op === "and" ? results.every(Boolean) : results.some(Boolean);
  });

  const sorts = (config.sorts ?? []).filter((s) => byId.has(s.property_id));
  if (sorts.length > 0) {
    result = [...result].sort((ra, rb) => {
      for (const s of sorts) {
        const prop = byId.get(s.property_id)!;
        const c = compare(rawValue(ra, prop), rawValue(rb, prop), prop);
        if (c !== 0) return s.direction === "asc" ? c : -c;
      }
      return 0;
    });
  }
  return result;
}

export interface RowGroup {
  key: string;
  label: string;
  color?: string;
  rows: DbRow[];
}

/** Agrupa filas por una propiedad (para la vista de tabla). */
export function groupRows(rows: DbRow[], property: DbProperty): RowGroup[] {
  const options = (property.config.options as SelectOption[] | undefined) ?? [];
  const groups = new Map<string, RowGroup>();
  const ensure = (key: string, label: string, color?: string) => {
    if (!groups.has(key)) groups.set(key, { key, label, color, rows: [] });
    return groups.get(key)!;
  };

  // Opciones de select en su orden; el resto se agrupa dinámicamente.
  if (property.type === "select" || property.type === "status") {
    for (const o of options) ensure(o.id, o.name, o.color);
  }

  for (const row of rows) {
    const v = property.type === "title" ? row.title : row.properties[property.id];
    if (property.type === "select" || property.type === "status") {
      const key = typeof v === "string" && v ? v : "__none__";
      const opt = options.find((o) => o.id === v);
      ensure(key, opt ? opt.name : "Sin asignar", opt?.color ?? "gray").rows.push(row);
    } else if (property.type === "checkbox") {
      const key = v === true ? "true" : "false";
      ensure(key, v === true ? "Marcado" : "Sin marcar").rows.push(row);
    } else {
      const label = asText(property.type === "date" ? (v as DateValue | undefined)?.start : v);
      const key = label || "__none__";
      ensure(key, label || "Sin valor").rows.push(row);
    }
  }

  return Array.from(groups.values()).filter(
    (g) => g.rows.length > 0 || property.type === "select" || property.type === "status",
  );
}
