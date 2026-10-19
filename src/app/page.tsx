import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { workspaces } from "@/server/db/schema";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // 8.2: verificar sesión en el servidor, no solo en el middleware.
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.ownerId, session.user.id))
    .limit(1);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notion personal</h1>
        <LogoutButton />
      </header>

      <section className="space-y-2 rounded-lg border p-6">
        <h2 className="text-lg font-medium">Sesión iniciada</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Usuario</dt>
          <dd>{session.user.name}</dd>
          <dt className="text-muted-foreground">Email</dt>
          <dd>{session.user.email}</dd>
          <dt className="text-muted-foreground">Workspace</dt>
          <dd>{workspace?.name ?? "—"}</dd>
        </dl>
      </section>

      <p className="text-muted-foreground text-sm">
        Fase 0 completada. Diagnóstico de base de datos en{" "}
        <a href="/api/health" className="underline">
          /api/health
        </a>
        .
      </p>
    </main>
  );
}
