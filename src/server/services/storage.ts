import "server-only";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// Almacenamiento de archivos en Neon Object Storage (S3-compatible). Credenciales
// en variables STORAGE_* (DEC-015). §8.2: validación de tipo/tamaño y nombres
// aleatorios se aplican en la ruta /api/upload antes de llamar aquí.

const endpoint = process.env.STORAGE_ENDPOINT;
const region = process.env.STORAGE_REGION ?? "auto";
const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;
const bucket = process.env.STORAGE_BUCKET;
const publicBaseUrl = process.env.STORAGE_PUBLIC_BASE_URL;

export function isStorageConfigured(): boolean {
  return Boolean(endpoint && accessKeyId && secretAccessKey && bucket);
}

let client: S3Client | null = null;
function getClient(): S3Client {
  if (!isStorageConfigured()) {
    throw new Error("El almacenamiento de archivos no está configurado (STORAGE_*).");
  }
  if (!client) {
    client = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
      forcePathStyle: true,
    });
  }
  return client;
}

/** URL pública de un objeto. */
export function publicUrl(key: string): string {
  if (publicBaseUrl) return `${publicBaseUrl.replace(/\/$/, "")}/${key}`;
  return `${endpoint!.replace(/\/$/, "")}/${bucket}/${key}`;
}

/** Sube un objeto al bucket y devuelve su URL pública. */
export async function uploadObject(params: {
  key: string;
  body: Uint8Array;
  contentType: string;
}): Promise<string> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return publicUrl(params.key);
}
