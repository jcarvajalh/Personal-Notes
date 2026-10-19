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

// Reordenar dentro de Favoritos (soltar entre dos elementos).
export const reorderFavoriteSchema = z.object({
  id: z.uuid(),
  beforeId: z.uuid().nullable().optional(),
  afterId: z.uuid().nullable().optional(),
});
