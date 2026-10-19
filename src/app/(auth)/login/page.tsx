import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/server/db";
import { user } from "@/server/db/schema";

import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  // Si aún no existe el usuario dueño, llevar al setup inicial (AU-001).
  const [row] = await db.select({ count: sql<number>`count(*)` }).from(user);
  if (Number(row?.count ?? 0) === 0) {
    redirect("/setup");
  }

  const params = await searchParams;
  const redirectParam = params.redirect;
  const redirectTo =
    typeof redirectParam === "string" && redirectParam.startsWith("/") ? redirectParam : "/";

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Notion personal</h1>
          <p className="text-muted-foreground text-sm">Inicia sesión para continuar.</p>
        </div>
        <LoginForm redirectTo={redirectTo} />
      </div>
    </main>
  );
}
