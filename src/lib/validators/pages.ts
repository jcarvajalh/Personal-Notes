import { z } from "zod";

// Formato de icono de página (6.5): { type, value, color? }.
export const pageIconSchema = z.object({
  type: z.enum(["emoji", "icon", "file"]),
  value: z.string().min(1).max(2048),
  color: z.string().max(32).optional(),
});
export type PageIcon = z.infer<typeof pageIconSchema>;

export const createPageSchema = z.object({
  parentId: z.uuid().nullable().optional(),
  title: z.string().max(2000).optional(),
});

export const renamePageSchema = z.object({
  id: z.uuid(),
  title: z.string().max(2000),
});

export const setPageIconSchema = z.object({
  id: z.uuid(),
  icon: pageIconSchema.nullable(),
});

// Mover: a un nuevo padre (o raíz = null) y, opcionalmente, entre dos hermanos
// para fijar la posición con índice fraccionario.
export const movePageSchema = z.object({
  id: z.uuid(),
  parentId: z.uuid().nullable(),
  beforeId: z.uuid().nullable().optional(),
  afterId: z.uuid().nullable().optional(),
});

export const duplicatePageSchema = z.object({
  id: z.uuid(),
  withChildren: z.boolean().optional().default(true),
});

export const pageIdSchema = z.object({
  id: z.uuid(),
});

export const toggleFavoriteSchema = z.object({
  id: z.uuid(),
  favorite: z.boolean(),
});

// Guardado del contenido del editor (flujo 4.3).
export const savePageContentSchema = z.object({
  pageId: z.uuid(),
  content: z.array(z.unknown()),
  baseVersion: z.number().int().nonnegative(),
  snapshot: z.boolean().optional().default(false),
});

// Reordenar dentro de Favoritos (soltar entre dos elementos).
export const reorderFavoriteSchema = z.object({
  id: z.uuid(),
  beforeId: z.uuid().nullable().optional(),
  afterId: z.uuid().nullable().optional(),
});

// Acciones en lote (multiselección en el sidebar).
export const pageIdsSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(500),
});

export const setFavoritesSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(500),
  favorite: z.boolean(),
});

// Grupos del sidebar.
export const createGroupSchema = z.object({
  name: z.string().max(200).optional(),
});

export const renameGroupSchema = z.object({
  id: z.uuid(),
  name: z.string().max(200),
});

export const groupIdSchema = z.object({
  id: z.uuid(),
});

export const assignGroupSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(500),
  groupId: z.uuid().nullable(),
});

// Tarjetas flotantes movibles del lienzo de la página.
export const pageCardSchema = z.object({
  id: z.string().max(64),
  x: z.number(),
  y: z.number(),
  width: z.number().min(120).max(2000),
  height: z.number().min(80).max(2000),
  content: z.array(z.unknown()),
});

export const savePageCardsSchema = z.object({
  pageId: z.uuid(),
  cards: z.array(pageCardSchema).max(200),
});
