import { notFound, redirect } from "next/navigation";

import { requireUser, UnauthorizedError } from "@/server/session";
import { getPage } from "@/server/queries/pages";
import { getDatabaseByPageId, getDatabaseRows } from "@/server/queries/databases";
import { PageHeader } from "@/components/page/page-header";
import { PageBody } from "@/components/editor/page-body";
import { DatabaseScreen } from "@/components/database/database-view";
import { VisitRecorder } from "@/components/page/visit-recorder";
import type { PageIcon } from "@/lib/validators/pages";
import type { PageCard } from "@/lib/cards";

export const dynamic = "force-dynamic";

export default async function PageRoute({ params }: PageProps<"/[pageId]">) {
  const { pageId } = await params;

  let ctx;
  try {
    ctx = await requireUser();
  } catch (error) {
    if (error instanceof UnauthorizedError) redirect("/login");
    throw error;
  }

  const page = await getPage(ctx.workspaceId, pageId);
  if (!page || page.deletedAt) notFound();

  if (page.kind === "database") {
    const bundle = await getDatabaseByPageId(ctx.workspaceId, page.id);
    if (!bundle) notFound();
    const rows = await getDatabaseRows(ctx.workspaceId, bundle.database.id);
    return (
      <article className="pb-32" data-page-editor>
        <VisitRecorder pageId={page.id} />
        <PageHeader
          key={page.id}
          pageId={page.id}
          initialTitle={page.title}
          initialIcon={(page.icon as PageIcon | null) ?? null}
          initialFavorite={page.isFavorite}
        />
        <DatabaseScreen pageId={page.id} initialBundle={bundle} initialRows={rows} />
      </article>
    );
  }

  return (
    <article className="pb-32" data-page-editor>
      <VisitRecorder pageId={page.id} />
      <PageHeader
        key={page.id}
        pageId={page.id}
        initialTitle={page.title}
        initialIcon={(page.icon as PageIcon | null) ?? null}
        initialFavorite={page.isFavorite}
      />
      <PageBody
        key={page.id}
        pageId={page.id}
        initialContent={page.content}
        initialVersion={page.version}
        initialCards={(page.cards as PageCard[] | null) ?? []}
      />
    </article>
  );
}
