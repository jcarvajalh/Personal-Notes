import { cache } from "react";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { workspaces } from "@/server/db/schema";

export class UnauthorizedError extends Error {
  constructor(message = "No autenticado") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export interface AuthContext {
  userId: string;
  workspaceId: string;
  workspaceName: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

// Verificación real de sesión para Server Actions y Route Handlers (§8.2: no
// confiar solo en el middleware). Devuelve el usuario y su workspace_id, que se
// usa para filtrar TODAS las consultas. Cacheado por petición con `cache()`.
export const requireUser = cache(async (): Promise<AuthContext> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new UnauthorizedError();
  }

  const [workspace] = await db
    .select({ id: workspaces.id, name: workspaces.name })
    .from(workspaces)
    .where(eq(workspaces.ownerId, session.user.id))
    .limit(1);

  if (!workspace) {
    throw new UnauthorizedError("El usuario no tiene un workspace asociado");
  }

  return {
    userId: session.user.id,
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    },
  };
});
