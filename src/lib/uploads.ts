import { fileTypeFromBuffer } from "file-type";

// Validación de subidas (§8.2 / SEC-040-041). Tipos permitidos en la Fase 1:
// imágenes rasterizadas (SVG excluido por XSS). Lógica pura y testeable.

export const ALLOWED_IMAGE_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/avif",
]);

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB

export type UploadValidation =
  { ok: true; mime: string; ext: string } | { ok: false; status: 413 | 415; reason: string };

/**
 * Valida tamaño y **tipo real** por magic bytes (no el declarado por el cliente),
 * de modo que un archivo con extensión/MIME falsos se rechaza.
 */
export async function validateImageUpload(
  bytes: Uint8Array,
  size: number,
): Promise<UploadValidation> {
  if (size > MAX_UPLOAD_BYTES) {
    return { ok: false, status: 413, reason: "El archivo supera el máximo de 50 MB." };
  }
  const sniffed = await fileTypeFromBuffer(bytes);
  if (!sniffed || !ALLOWED_IMAGE_MIME.has(sniffed.mime)) {
    return { ok: false, status: 415, reason: "Tipo de archivo no permitido." };
  }
  return { ok: true, mime: sniffed.mime, ext: sniffed.ext };
}
