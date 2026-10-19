// Motor puro: extrae texto plano, recuento de palabras y referencias (menciones
// y enlaces a páginas) de un documento BlockNote. Sin dependencias de BD; se usa
// al guardar (flujo 4.3, paso 3) para `content_text`, `word_count` y `backlinks`.

export type BacklinkKind = "mention" | "link" | "embed" | "synced";

export interface ExtractedBacklink {
  blockId: string;
  targetPageId: string;
  kind: BacklinkKind;
  context: string | null;
}

export interface ExtractResult {
  text: string;
  wordCount: number;
  backlinks: ExtractedBacklink[];
}

interface UnknownBlock {
  id?: unknown;
  type?: unknown;
  props?: Record<string, unknown>;
  content?: unknown;
  children?: unknown;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** Texto plano de un array de inline content de BlockNote. */
function inlineText(content: unknown): string {
  if (!Array.isArray(content)) return "";
  let out = "";
  for (const item of content) {
    if (!isRecord(item)) continue;
    if (item.type === "text" && typeof item.text === "string") {
      out += item.text;
    } else if (item.type === "link") {
      out += inlineText(item.content);
    } else if (item.type === "pageMention" && isRecord(item.props)) {
      // Texto legible de la mención (título capturado).
      const title = item.props.title;
      if (typeof title === "string") out += title;
    }
  }
  return out;
}

/** Recoge las menciones de página (inline) dentro de un inline content. */
function collectMentions(content: unknown): string[] {
  if (!Array.isArray(content)) return [];
  const ids: string[] = [];
  for (const item of content) {
    if (!isRecord(item)) continue;
    if (item.type === "pageMention" && isRecord(item.props)) {
      const pageId = item.props.pageId;
      if (typeof pageId === "string" && pageId.length > 0) ids.push(pageId);
    } else if (item.type === "link") {
      ids.push(...collectMentions(item.content));
    }
  }
  return ids;
}

function walk(blocks: unknown[], acc: ExtractResult, seen: Set<string>): void {
  for (const raw of blocks) {
    if (!isRecord(raw)) continue;
    const block = raw as UnknownBlock;
    const blockId = typeof block.id === "string" ? block.id : "";
    const lineText = inlineText(block.content);
    if (lineText) acc.text += (acc.text ? "\n" : "") + lineText;

    // Menciones inline → backlinks kind "mention".
    for (const targetPageId of collectMentions(block.content)) {
      const key = `${blockId}:${targetPageId}:mention`;
      if (seen.has(key)) continue;
      seen.add(key);
      acc.backlinks.push({ blockId, targetPageId, kind: "mention", context: lineText || null });
    }

    // Bloque "Enlace a página" (ED-017) → backlink kind "link".
    if (block.type === "pageLink" && isRecord(block.props)) {
      const targetPageId = block.props.pageId;
      if (typeof targetPageId === "string" && targetPageId.length > 0) {
        const key = `${blockId}:${targetPageId}:link`;
        if (!seen.has(key)) {
          seen.add(key);
          acc.backlinks.push({ blockId, targetPageId, kind: "link", context: null });
        }
      }
    }

    if (Array.isArray(block.children) && block.children.length > 0) {
      walk(block.children, acc, seen);
    }
  }
}

export function extractFromDocument(document: unknown): ExtractResult {
  const acc: ExtractResult = { text: "", wordCount: 0, backlinks: [] };
  if (Array.isArray(document)) {
    walk(document, acc, new Set<string>());
  }
  acc.wordCount = acc.text.trim() === "" ? 0 : acc.text.trim().split(/\s+/).length;
  return acc;
}
