import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/server/db";

// Prueba de humo (sección 5.1): SELECT 1 + versión de Postgres.
// Ruta pública (ver middleware AU-004).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await db.execute(sql`select 1 as ok, version() as version`);
    const row = result.rows[0] as { ok: number; version: string } | undefined;
    return NextResponse.json({
      ok: true,
      database: "up",
      select1: row?.ok ?? null,
      version: row?.version ?? null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        database: "down",
        error: error instanceof Error ? error.message : "error desconocido",
      },
      { status: 503 },
    );
  }
}
