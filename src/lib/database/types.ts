// Tipos y helpers compartidos de bases de datos (6.9/6.10). El Sub-bloque 1
// soporta edición de: title, text, number, checkbox, select, date. El resto de
// tipos del enum existen en el esquema pero aún no tienen edición en la UI.

export const SELECT_COLORS = [
  "gray",
  "brown",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
  "red",
] as const;
export type SelectColor = (typeof SELECT_COLORS)[number];

export interface SelectOption {
  id: string;
  name: string;
  color: SelectColor;
}

export interface SelectConfig {
  options: SelectOption[];
}

export interface NumberConfig {
  format?: "number" | "number_with_commas" | "percent" | "currency";
  currency?: "COP" | "EUR" | "USD";
  decimals?: number;
}

export interface DateConfig {
  include_time?: boolean;
}

/** Valor almacenado para una propiedad de tipo fecha (6.10). */
export interface DateValue {
  start: string;
  end?: string;
  include_time?: boolean;
}

/** Tipos de propiedad con edición completa en el Sub-bloque 1 (además de title). */
export const EDITABLE_PROPERTY_TYPES = ["text", "number", "checkbox", "select", "date"] as const;
export type EditablePropertyType = (typeof EDITABLE_PROPERTY_TYPES)[number];

/**
 * DB-004: propiedades automáticas (de solo lectura). Su valor no vive en
 * `pages.properties`, sino que se deriva de las columnas de la página:
 * `created_time` ← `created_at`, `last_edited_time` ← `updated_at`.
 */
export const AUTOMATIC_PROPERTY_TYPES = ["created_time", "last_edited_time"] as const;
export type AutomaticPropertyType = (typeof AUTOMATIC_PROPERTY_TYPES)[number];

export function isAutomaticType(type: string): type is AutomaticPropertyType {
  return (AUTOMATIC_PROPERTY_TYPES as readonly string[]).includes(type);
}

/** Etiquetas en español de los tipos de propiedad creables por el usuario. */
export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  text: "Texto",
  number: "Número",
  checkbox: "Casilla",
  select: "Selección",
  date: "Fecha",
  created_time: "Fecha de creación",
  last_edited_time: "Última edición",
};

/** Las ocho vistas ofrecidas al crear/añadir (orden del doc docs/vistas.docx). */
export const OFFERED_VIEW_TYPES = [
  "table",
  "board",
  "gallery",
  "list",
  "feed",
  "dashboard",
  "calendar",
  "timeline",
] as const;

export const VIEW_LABELS: Record<string, string> = {
  table: "Tabla",
  board: "Tablero",
  gallery: "Galería",
  list: "Lista",
  feed: "Feed",
  dashboard: "Panel de control",
  calendar: "Calendario",
  timeline: "Cronograma",
  chart: "Gráfico",
  map: "Mapa",
};

/** Valores por defecto de `config` al crear una propiedad de cada tipo. */
export function defaultConfigFor(type: string): Record<string, unknown> {
  switch (type) {
    case "select":
    case "multi_select":
      return { options: [], sort: "manual" };
    case "number":
      return { format: "number" };
    case "date":
      return { include_time: false };
    case "created_time":
    case "last_edited_time":
      return { include_time: true };
    default:
      return {};
  }
}
