import { NextResponse } from "next/server";

import { requireUser, UnauthorizedError } from "@/server/session";
import { db } from "@/server/db";
import { files } from "@/server/db/schema";
import { uuidv7 } from "@/lib/ids";
import { validateImageUpload } from "@/lib/uploads";
import { isStorageConfigured, uploadObject } from "@/server/services/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const form = await request.formData();
  const file = form.get("file");
  const pageIdRaw = form.get("pageId");
  const pageId = typeof pageIdRaw === "string" && pageIdRaw.length > 0 ? pageIdRaw : null;

  if (!(file instanceof File)) {
    return json({ error: "Falta el archivo." }, 400);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  // SEC-040/041: validar tamaño y tipo REAL (magic bytes) antes de tocar el
  // almacenamiento, para que un tipo falso se rechace aunque el storage no esté
  // configurado.
  const valid = await validateImageUpload(bytes, file.size);
  if (!valid.ok) {
    return json({ error: valid.reason }, valid.status);
  }

  if (!isStorageConfigured()) {
    return json({ error: "Almacenamiento no configurado en el servidor." }, 503);
  }

  const id = uuidv7();
  const key = `${ctx.workspaceId}/${id}.${valid.ext}`;

  let url: string;
  try {
    url = await uploadObject({ key, body: bytes, contentType: valid.mime });
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
    mimeType: valid.mime,
    sizeBytes: bytes.byteLength,
  });

  return json({ id, url, name: file.name, mimeType: valid.mime });
}
