import { fileTypeFromBuffer } from "file-type";
import { NextResponse } from "next/server";

import { requireUser, UnauthorizedError } from "@/server/session";
import { db } from "@/server/db";
import { files } from "@/server/db/schema";
import { uuidv7 } from "@/lib/ids";
import { isStorageConfigured, uploadObject } from "@/server/services/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tipos permitidos en la Fase 1 (imágenes rasterizadas; SVG excluido por XSS).
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/gif", "image/webp", "image/avif"]);
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB (§8.2)

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(request: Request) {
  // §8.2: verificar sesión en el Route Handler (no solo en el middleware).
  let ctx;
  try {
    ctx = await requireUser();
  } catch (error) {
    if (error instanceof UnauthorizedError) return json({ error: "No autenticado" }, 401);
    throw error;
  }

  if (!isStorageConfigured()) {
    return json({ error: "Almacenamiento no configurado en el servidor." }, 503);
  }

  const form = await request.formData();
  const file = form.get("file");
  const pageIdRaw = form.get("pageId");
  const pageId = typeof pageIdRaw === "string" && pageIdRaw.length > 0 ? pageIdRaw : null;

  if (!(file instanceof File)) {
    return json({ error: "Falta el archivo." }, 400);
  }
  if (file.size > MAX_BYTES) {
    return json({ error: "El archivo supera el máximo de 50 MB." }, 413);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  // SEC-040/041: validar el tipo REAL por magic bytes, no el declarado por el
  // cliente. Rechaza un archivo con extensión/MIME falsos.
  const sniffed = await fileTypeFromBuffer(bytes);
  if (!sniffed || !ALLOWED_MIME.has(sniffed.mime)) {
    return json({ error: "Tipo de archivo no permitido." }, 415);
  }

  const id = uuidv7();
  const key = `${ctx.workspaceId}/${id}.${sniffed.ext}`;

  let url: string;
  try {
    url = await uploadObject({ key, body: bytes, contentType: sniffed.mime });
  } catch {
    return json({ error: "No se pudo subir el archivo." }, 500);
  }

  await db.insert(files).values({
    id,
    workspaceId: ctx.workspaceId,
    pageId,
    storageKey: key,
    url,
    filename: file.name,
    mimeType: sniffed.mime,
    sizeBytes: bytes.byteLength,
  });

  return json({ id, url, name: file.name, mimeType: sniffed.mime });
}
