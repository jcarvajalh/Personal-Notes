import {
  bigint,
  bigserial,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { uuidv7 } from "@/lib/ids";

import { backlinkKind, versionReason } from "./enums";
import { pages, workspaces } from "./core";

// Tablas auxiliares de contenido — secciones 6.5 (page_versions, page_visits),
// 6.7 (files, backlinks). Se introducen en la Fase 1 (migración 0002_fase1).

const tz = { withTimezone: true } as const;

// --- page_versions (6.5) ------------------------------------------------------
// Snapshots completos de una página. Un snapshot cada ~10 min de edición activa
// o al cerrar la sesión de edición (flujo 4.3, paso 4).
export const pageVersions = pgTable(
  "page_versions",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    title: text("title").notNull(),
    icon: jsonb("icon"),
    cover: jsonb("cover"),
    content: jsonb("content").notNull(),
    properties: jsonb("properties").notNull(),
    reason: versionReason("reason").notNull().default("auto"),
    label: text("label"),
    sizeBytes: integer("size_bytes").notNull(),
    createdAt: timestamp("created_at", tz).notNull().defaultNow(),
  },
  (t) => [index("page_versions_page_idx").on(t.pageId, t.createdAt.desc())],
);

// --- page_visits (6.5) --------------------------------------------------------
// Registro ligero de visitas para "Recientes" (NV-009) y estadísticas.
export const pageVisits = pgTable(
  "page_visits",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    visitedAt: timestamp("visited_at", tz).notNull().defaultNow(),
  },
  (t) => [index("page_visits_visited_idx").on(t.visitedAt.desc())],
);

// --- files (6.7) --------------------------------------------------------------
// Archivos subidos al object storage (imágenes, adjuntos, portadas).
export const files = pgTable(
  "files",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    pageId: uuid("page_id").references(() => pages.id, { onDelete: "set null" }),
    storageKey: text("storage_key").notNull().unique(),
    url: text("url").notNull(),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    width: integer("width"),
    height: integer("height"),
    blurhash: text("blurhash"),
    checksum: text("checksum"),
    extractedText: text("extracted_text"),
    createdAt: timestamp("created_at", tz).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", tz),
  },
  (t) => [index("files_page_idx").on(t.pageId), index("files_checksum_idx").on(t.checksum)],
);

// --- backlinks (6.7) ----------------------------------------------------------
// Referencias entre páginas extraídas del contenido al guardar. Alimenta el panel
// de backlinks (PG-015, Fase 4) y el grafo. En la Fase 1 se pueblan al guardar
// (flujo 4.3, paso 3) aunque el panel llegue después.
export const backlinks = pgTable(
  "backlinks",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    sourcePageId: uuid("source_page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    sourceBlockId: text("source_block_id").notNull(),
    targetPageId: uuid("target_page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    kind: backlinkKind("kind").notNull(),
    context: text("context"),
    createdAt: timestamp("created_at", tz).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("backlinks_unique").on(t.sourcePageId, t.sourceBlockId, t.targetPageId, t.kind),
    index("backlinks_target_idx").on(t.targetPageId),
  ],
);
