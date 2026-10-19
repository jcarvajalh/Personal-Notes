import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "./db";
import { account, session, user, userSettings, verification, workspaces } from "./db/schema";
import { uuidv7 } from "@/lib/ids";

const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();

export const auth = betterAuth({
  appName: "Notion personal",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  // AU-002: límite de 5 intentos de login por IP cada 15 minutos.
  rateLimit: {
    enabled: true,
    window: 900,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 900, max: 5 },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // AU-003: solo OWNER_EMAIL puede registrarse. Cualquier otro email se
        // rechaza en el servidor. Combinado con el UNIQUE de email y la guarda de
        // /setup, garantiza un único usuario dueño (AU-001).
        before: async (newUser) => {
          if (!ownerEmail) {
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message: "OWNER_EMAIL no está configurado en el servidor.",
            });
          }
          if (newUser.email.trim().toLowerCase() !== ownerEmail) {
            throw new APIError("FORBIDDEN", {
              message: "El registro está restringido al propietario de este espacio.",
            });
          }
          return { data: newUser };
        },
        // AU-001: al crear el usuario dueño se crean su workspace y user_settings.
        after: async (newUser) => {
          await db.transaction(async (tx) => {
            await tx.insert(workspaces).values({
              id: uuidv7(),
              ownerId: newUser.id,
              name: newUser.name || "Mi espacio",
            });
            await tx.insert(userSettings).values({ userId: newUser.id }).onConflictDoNothing();
          });
        },
      },
    },
  },
  // nextCookies debe ir al final para que las Server Actions escriban cookies.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
