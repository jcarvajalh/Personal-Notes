import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/server/db";
import { backlinks, pages, pageVersions } from "@/server/db/schema";
import { extractFromDocument } from "@/lib/engines/blocknote";
import type { AuthContext } from "@/server/session";

export type SaveContentInput = {
  pageId: string;
  content: unknown[];
  baseVersion: number;
  snapshot?: boolean;
};

export type SaveContentResult =
  { status: "saved"; version: number } | { status: "conflict"; version: number; content: unknown };

const SNAPSHOT_INTERVAL_MS = 10 * 60 * 1000; // 10 min (flujo 4.3, paso 4)

/**
 * Guarda el contenido del editor con concurrencia optimista (4.3):
 * - Si `baseVersion` no coincide con `pages.version`, devuelve conflicto.
 * - Si coincide: guarda, incrementa versión, extrae `content_text`/`word_count`,
 *   reconstruye `backlinks` y marca el embedding como pendiente, todo en una
 *   transacción. Crea un snapshot en `page_versions` si procede.
 */
export async function savePageContent(
  ctx: AuthContext,
  input: SaveContentInput,
): Promise<SaveContentResult> {
  return db.transaction(async (tx) => {
    const [page] = await tx
      .select({
        version: pages.version,
        title: pages.title,
        icon: pages.icon,
        cover: pages.cover,
        properties: pages.properties,
      })
      .from(pages)
      .where(and(eq(pages.id, input.pageId), eq(pages.workspaceId, ctx.workspaceId)))
      .limit(1);

    if (!page) throw new Error("La página no existe");

    if (page.version !== input.baseVersion) {
      const [current] = await tx
        .select({ content: pages.content, version: pages.version })
        .from(pages)
        .where(eq(pages.id, input.pageId))
        .limit(1);
      return { status: "conflict", version: current.version, content: current.content };
    }

    const extracted = extractFromDocument(input.content);
    const newVersion = page.version + 1;
    const now = new Date();

    await tx
      .update(pages)
      .set({
        content: input.content,
        contentText: extracted.text,
        wordCount: extracted.wordCount,
        version: newVersion,
        updatedAt: now,
        contentEditedAt: now,
        embeddingStale: true,
      })
      .where(and(eq(pages.id, input.pageId), eq(pages.workspaceId, ctx.workspaceId)));

    // Reconstruir backlinks: borrar y reinsertar en la misma transacción (6.7).
    await tx.delete(backlinks).where(eq(backlinks.sourcePageId, input.pageId));
    if (extracted.backlinks.length > 0) {
      const targetIds = [...new Set(extracted.backlinks.map((b) => b.targetPageId))];
      const existing = await tx
        .select({ id: pages.id })
        .from(pages)
        .where(and(eq(pages.workspaceId, ctx.workspaceId), inArray(pages.id, targetIds)));
      const valid = new Set(existing.map((r) => r.id));
      const rows = extracted.backlinks
        .filter((b) => valid.has(b.targetPageId) && b.targetPageId !== input.pageId)
        .map((b) => ({
          sourcePageId: input.pageId,
          sourceBlockId: b.blockId,
          targetPageId: b.targetPageId,
          kind: b.kind,
          context: b.context,
        }));
      if (rows.length > 0) {
        await tx.insert(backlinks).values(rows).onConflictDoNothing();
      }
    }

    // Snapshot en page_versions si se solicita o si el último es antiguo.
    let shouldSnapshot = input.snapshot === true;
    if (!shouldSnapshot) {
      const [last] = await tx
        .select({ createdAt: pageVersions.createdAt })
        .from(pageVersions)
        .where(eq(pageVersions.pageId, input.pageId))
        .orderBy(desc(pageVersions.createdAt))
        .limit(1);
      shouldSnapshot = !last || now.getTime() - last.createdAt.getTime() > SNAPSHOT_INTERVAL_MS;
    }
    if (shouldSnapshot) {
      const serialized = JSON.stringify(input.content);
      await tx.insert(pageVersions).values({
        pageId: input.pageId,
        version: newVersion,
        title: page.title,
        icon: page.icon,
        cover: page.cover,
        content: input.content,
        properties: page.properties,
        reason: "auto",
        sizeBytes: Buffer.byteLength(serialized, "utf8"),
      });
    }

    return { status: "saved", version: newVersion };
  });
}
