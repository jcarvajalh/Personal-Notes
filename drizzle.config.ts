import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Cargar variables de entorno locales para drizzle-kit (migrate/push/studio).
// `generate` no necesita conexión; las demás sí.
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema/index.ts",
  out: "./drizzle",
  // Migraciones por conexión directa (no pooled) cuando Neon la provee.
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
