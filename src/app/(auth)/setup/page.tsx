import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/server/db";
import { user } from "@/server/db/schema";

import { SetupForm } from "./setup-form";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  // AU-001: /setup solo está disponible si no existe ningún usuario.
  const [row] = await db.select({ count: sql<number>`count(*)` }).from(user);
  if (Number(row?.count ?? 0) > 0) {
    redirect("/login");
  }

  const ownerEmail = process.env.OWNER_EMAIL?.trim() ?? "";

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Configuración inicial</h1>
          <p className="text-muted-foreground text-sm">
            Crea el usuario dueño de este espacio. Esto solo ocurre una vez.
          </p>
        </div>
        {ownerEmail ? (
          <SetupForm ownerEmail={ownerEmail} />
        ) : (
          <p className="text-sm text-red-600">
            Falta definir la variable de entorno <code>OWNER_EMAIL</code> en el servidor.
          </p>
        )}
      </div>
    </main>
  );
}
