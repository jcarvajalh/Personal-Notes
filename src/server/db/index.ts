import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

import * as schema from "./schema";

// En entornos Node (incluido el runtime serverless de Node en Vercel) el driver
// de Neon necesita un constructor de WebSocket. En el edge/navegador existe uno
// global, pero `db` es exclusivamente de servidor, así que fijamos `ws`.
if (!neonConfig.webSocketConstructor) {
  neonConfig.webSocketConstructor = ws;
}

// Driver WebSocket/Pool: soporta transacciones interactivas (las usa Better Auth
// y las operaciones multi-tabla). Ver docs/spec/02 (Stack) y docs/DECISIONS.md.
// El Pool no conecta hasta la primera consulta, por lo que importar este módulo
// sin DATABASE_URL no lanza error (necesario para build y para la CLI).
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });

export const db = drizzle(pool, { schema, casing: "snake_case" });

export type Database = typeof db;
export { schema };
