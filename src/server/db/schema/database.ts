import {
  boolean,
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

import { propertyType, viewType } from "./enums";
import { pages, workspaces } from "./core";

// Esquema de bases de datos (sección 6.6). "Todo es una página": una BD es una
// página con kind=database; sus filas son páginas con kind=row y database_id.
// Nota: `pages.database_id` no lleva FK a `databases` a nivel de BD para evitar
// una importación circular entre módulos de esquema; la integridad (borrado de
// filas al eliminar la BD) se gestiona en el servicio. Igual que `title_property_id`
// y `default_view_id`, que son referencias circulares y se guardan como uuid.

const tz = { withTimezone: true } as const;

export const databases = pgTable(
  "databases",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    isInline: boolean("is_inline").notNull().default(false),
    titlePropertyId: uuid("title_property_id"),
    defaultViewId: uuid("default_view_id"),
    rowOpenMode: text("row_open_mode").notNull().default("side_peek"),
    uniqueIdPrefix: text("unique_id_prefix"),
    nextUniqueNumber: integer("next_unique_number").notNull().default(1),
    subItemsPropertyId: uuid("sub_items_property_id"),
    dependenciesPropertyId: uuid("dependencies_property_id"),
    description: text("description"),
    createdAt: timestamp("created_at", tz).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", tz).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("databases_page_id_unique").on(t.pageId)],
);

export const databaseProperties = pgTable(
  "database_properties",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    databaseId: uuid("database_id")
      .notNull()
      .references(() => databases.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: propertyType("type").notNull(),
    config: jsonb("config").notNull().default({}),
    description: text("description"),
    position: text("position").notNull(),
    createdAt: timestamp("created_at", tz).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", tz).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("database_properties_name_unique").on(t.databaseId, t.name),
    index("database_properties_db_idx").on(t.databaseId, t.position),
  ],
);

export const databaseViews = pgTable(
  "database_views",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    databaseId: uuid("database_id")
      .notNull()
      .references(() => databases.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: viewType("type").notNull(),
    position: text("position").notNull(),
    hostPageId: uuid("host_page_id").references(() => pages.id, { onDelete: "cascade" }),
    hostBlockId: text("host_block_id"),
    config: jsonb("config").notNull().default({}),
    isLocked: boolean("is_locked").notNull().default(false),
    createdAt: timestamp("created_at", tz).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", tz).notNull().defaultNow(),
  },
  (t) => [
    index("database_views_db_idx").on(t.databaseId, t.position),
    index("database_views_host_idx").on(t.hostPageId),
  ],
);
