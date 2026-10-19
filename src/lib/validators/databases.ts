import { z } from "zod";

// Tipos de propiedad que el usuario puede crear (editables + automáticas DB-004).
export const creatablePropertyType = z.enum([
  "text",
  "number",
  "checkbox",
  "select",
  "date",
  "created_time",
  "last_edited_time",
]);

// Tipos de vista (el esquema soporta todos; la UI irá habilitándolos por fases).
export const viewTypeSchema = z.enum([
  "table",
  "board",
  "list",
  "gallery",
  "calendar",
  "timeline",
  "chart",
  "map",
  "feed",
  "dashboard",
]);

export const createDatabaseSchema = z.object({
  parentId: z.uuid().nullable().optional(),
  title: z.string().max(2000).optional(),
  viewType: viewTypeSchema.optional(),
  isInline: z.boolean().optional(),
});

export const addPropertySchema = z.object({
  databaseId: z.uuid(),
  type: creatablePropertyType,
  name: z.string().min(1).max(200),
});

export const renamePropertySchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(200),
});

export const updatePropertyConfigSchema = z.object({
  id: z.uuid(),
  config: z.record(z.string(), z.unknown()),
});

export const propertyIdSchema = z.object({ id: z.uuid() });

export const createRowSchema = z.object({ databaseId: z.uuid() });

export const updateRowValueSchema = z.object({
  pageId: z.uuid(),
  propertyId: z.uuid(),
  value: z.unknown(),
});

export const createViewSchema = z.object({
  databaseId: z.uuid(),
  type: viewTypeSchema,
  name: z.string().min(1).max(200),
});

export const renameViewSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(200),
});

export const viewIdSchema = z.object({ id: z.uuid() });

export const updateViewConfigSchema = z.object({
  id: z.uuid(),
  config: z.record(z.string(), z.unknown()),
});
