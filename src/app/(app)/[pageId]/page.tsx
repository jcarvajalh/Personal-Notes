import { notFound, redirect } from "next/navigation";

import { requireUser, UnauthorizedError } from "@/server/session";
import { getPage } from "@/server/queries/pages";
import { PageHeader } from "@/components/page/page-header";
import { PageEditor } from "@/components/editor/page-editor";
import { VisitRecorder } from "@/components/page/visit-recorder";
import type { PageIcon } from "@/lib/validators/pages";

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
      <PageEditor pageId={page.id} initialContent={page.content} initialVersion={page.version} />
    </article>
  );
}
