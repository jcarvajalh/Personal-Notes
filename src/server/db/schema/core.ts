import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

import { uuidv7 } from "@/lib/ids";

import { pageFont, pageKind } from "./enums";
import { user } from "./auth";

const tz = { withTimezone: true } as const;

// tsvector no tiene tipo nativo en Drizzle; lo definimos como tipo personalizado.
const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

// --- workspaces (6.5) ---------------------------------------------------------
export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().$defaultFn(uuidv7),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id),
  name: text("name").notNull(),
  icon: jsonb("icon"),
  createdAt: timestamp("created_at", tz).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", tz).notNull().defaultNow(),
});

// --- page_groups (organización personalizada del sidebar) --------------------
// Grupos definidos por el usuario para agrupar páginas raíz en el sidebar,
// además de la sección "Páginas" por defecto (sin grupo).
export const pageGroups = pgTable(
  "page_groups",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull().default(""),
    position: text("position").notNull(),
    createdAt: timestamp("created_at", tz).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", tz).notNull().defaultNow(),
  },
  (t) => [index("page_groups_ws_idx").on(t.workspaceId, t.position)],
);

// --- pages (6.5) --------------------------------------------------------------
// Nota: database_id referencia databases.id (ON DELETE CASCADE), pero la tabla
// `databases` pertenece a la Fase 2. En la Fase 0 la columna existe sin la FK;
// la restricción se añadirá al crear `databases` (ver docs/DECISIONS.md DEC-003).
export const pages = pgTable(
  "pages",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    kind: pageKind("kind").notNull().default("page"),
    parentId: uuid("parent_id").references((): AnyPgColumn => pages.id, {
      onDelete: "set null",
    }),
    // Grupo del sidebar (solo aplica a páginas raíz). null = sección "Páginas".
    groupId: uuid("group_id").references(() => pageGroups.id, { onDelete: "set null" }),
    databaseId: uuid("database_id"),
    position: text("position").notNull(),
    title: text("title").notNull().default(""),
    icon: jsonb("icon"),
    cover: jsonb("cover"),
    content: jsonb("content").notNull().default([]),
    // Tarjetas flotantes movibles del lienzo de la página (extensión propia, no
    // en la spec 6.5): [{ id, x, y, width, height, content: Bloque[] }].
    cards: jsonb("cards").notNull().default([]),
    contentText: text("content_text").notNull().default(""),
    properties: jsonb("properties").notNull().default({}),
    computed: jsonb("computed").notNull().default({}),
    searchVector: tsvector("search_vector").generatedAlwaysAs(
      sql`setweight(to_tsvector('spanish', immutable_unaccent("title")), 'A') || setweight(to_tsvector('spanish', immutable_unaccent("content_text")), 'B')`,
    ),
    embedding: vector("embedding", { dimensions: 1024 }),
    embeddingStale: boolean("embedding_stale").notNull().default(true),
    isFavorite: boolean("is_favorite").notNull().default(false),
    favoritePosition: text("favorite_position"),
    isLocked: boolean("is_locked").notNull().default(false),
    fullWidth: boolean("full_width").notNull().default(false),
    smallText: boolean("small_text").notNull().default(false),
    font: pageFont("font").notNull().default("default"),
    showToc: boolean("show_toc").notNull().default(false),
    isDailyNote: boolean("is_daily_note").notNull().default(false),
    dailyDate: date("daily_date"),
    templateConfig: jsonb("template_config"),
    uniqueNumber: integer("unique_number"),
    wordCount: integer("word_count").notNull().default(0),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", tz).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", tz).notNull().defaultNow(),
    contentEditedAt: timestamp("content_edited_at", tz).notNull().defaultNow(),
    lastVisitedAt: timestamp("last_visited_at", tz),
    archivedAt: timestamp("archived_at", tz),
    deletedAt: timestamp("deleted_at", tz),
  },
  (t) => [
    index("pages_tree_idx")
      .on(t.workspaceId, t.parentId, t.position)
      .where(sql`${t.deletedAt} is null`),
    index("pages_database_idx")
      .on(t.databaseId, t.position)
      .where(sql`${t.deletedAt} is null`),
    index("pages_properties_idx").using("gin", t.properties.op("jsonb_path_ops")),
    index("pages_search_idx").using("gin", t.searchVector),
    index("pages_title_trgm_idx").using("gin", t.title.op("gin_trgm_ops")),
    index("pages_embedding_idx").using("hnsw", t.embedding.op("vector_cosine_ops")),
    index("pages_recent_idx").on(t.workspaceId, t.lastVisitedAt.desc()),
    index("pages_favorite_idx")
      .on(t.workspaceId, t.isFavorite)
      .where(sql`${t.isFavorite}`),
    index("pages_trash_idx")
      .on(t.deletedAt)
      .where(sql`${t.deletedAt} is not null`),
    uniqueIndex("pages_daily_date_unique").on(t.workspaceId, t.dailyDate),
    check("pages_row_requires_database", sql`${t.kind} <> 'row' or ${t.databaseId} is not null`),
  ],
);

// --- user_settings (6.5) ------------------------------------------------------
export const userSettings = pgTable("user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id),
  theme: text("theme").default("system"),
  accentColor: text("accent_color").default("blue"),
  defaultFont: pageFont("default_font").default("default"),
  locale: text("locale").default("es-CO"),
  timezone: text("timezone").default("America/Bogota"),
  weekStartsOn: smallint("week_starts_on").default(1),
  startPage: text("start_page").default("last"),
  sidebarWidth: integer("sidebar_width").default(260),
  sidebarCollapsed: boolean("sidebar_collapsed").default(false),
  dailyNotesParentId: uuid("daily_notes_parent_id").references(() => pages.id),
  dailyNoteTemplateId: uuid("daily_note_template_id").references(() => pages.id),
  inboxPageId: uuid("inbox_page_id").references(() => pages.id),
  shortcuts: jsonb("shortcuts").default({}),
  aiSettings: jsonb("ai_settings").default({}),
  updatedAt: timestamp("updated_at", tz).notNull().defaultNow(),
});
