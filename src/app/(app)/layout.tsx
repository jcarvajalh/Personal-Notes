import { redirect } from "next/navigation";

import { requireUser, UnauthorizedError } from "@/server/session";
import { getFavoritePages, getRootPages } from "@/server/queries/pages";
import { AppShell } from "@/components/app/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  let ctx;
  try {
    ctx = await requireUser();
  } catch (error) {
    if (error instanceof UnauthorizedError) redirect("/login");
    throw error;
  }

  // Datos iniciales para evitar parpadeo del sidebar (8.1).
  const [initialRoot, initialFavorites] = await Promise.all([
    getRootPages(ctx.workspaceId),
    getFavoritePages(ctx.workspaceId),
  ]);

  return (
    <AppShell
      workspaceName={ctx.workspaceName}
      initialRoot={initialRoot}
      initialFavorites={initialFavorites}
    >
      {children}
    </AppShell>
  );
}
