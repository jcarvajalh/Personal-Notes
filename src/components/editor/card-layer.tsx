"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/components/theme-provider";
import { es as esLocale } from "@blocknote/core/locales";
import type { PartialBlock } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { GripHorizontal, X } from "lucide-react";

import { editorSchema } from "@/components/editor/schema";
import { CARD_MIN_HEIGHT, CARD_MIN_WIDTH, type PageCard } from "@/lib/cards";

interface CardLayerProps {
  cards: PageCard[];
  /** Cambios de geometría (mover/redimensionar): se registran en el historial. */
  onUpdate: (id: string, patch: Partial<PageCard>) => void;
  /** Cambios de contenido del mini-editor: NO entran al historial de tarjetas. */
  onContentChange: (id: string, content: unknown[]) => void;
  onRemove: (id: string) => void;
}

/** Capa flotante sobre la página con las tarjetas movibles. */
export function CardLayer({ cards, onUpdate, onContentChange, onRemove }: CardLayerProps) {
  if (cards.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {cards.map((card) => (
        <CardPanel
          key={card.id}
          card={card}
          onUpdate={onUpdate}
          onContentChange={onContentChange}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

function CardPanel({
  card,
  onUpdate,
  onContentChange,
  onRemove,
}: {
  card: PageCard;
  onUpdate: (id: string, patch: Partial<PageCard>) => void;
  onContentChange: (id: string, content: unknown[]) => void;
  onRemove: (id: string) => void;
}) {
  const { resolvedTheme } = useTheme();
  const elRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const resizeRef = useRef<{ px: number; py: number; ow: number; oh: number } | null>(null);

  const initial =
    Array.isArray(card.content) && card.content.length > 0
      ? (card.content as PartialBlock[])
      : undefined;

  const editor = useCreateBlockNote({
    schema: editorSchema,
    initialContent: initial,
    dictionary: esLocale,
    domAttributes: { editor: { spellcheck: "true" } },
  });

  // Mantener en un ref el último callback para no resuscribir onChange en cada render.
  const onContentRef = useRef(onContentChange);
  useEffect(() => {
    onContentRef.current = onContentChange;
  });
  useEffect(
    () => editor.onChange(() => onContentRef.current(card.id, editor.document)),
    [editor, card.id],
  );

  // --- Arrastre (barra superior) --------------------------------------------
  const onHeaderDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-card-action]")) return;
    e.preventDefault();
    dragRef.current = { px: e.clientX, py: e.clientY, ox: card.x, oy: card.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onHeaderMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || !elRef.current) return;
    elRef.current.style.left = `${Math.max(0, d.ox + (e.clientX - d.px))}px`;
    elRef.current.style.top = `${Math.max(0, d.oy + (e.clientY - d.py))}px`;
  };
  const onHeaderUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    onUpdate(card.id, {
      x: Math.max(0, d.ox + (e.clientX - d.px)),
      y: Math.max(0, d.oy + (e.clientY - d.py)),
    });
  };

  // --- Redimensionado (esquina inferior derecha) ----------------------------
  const onResizeDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { px: e.clientX, py: e.clientY, ow: card.width, oh: card.height };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onResizeMove = (e: React.PointerEvent) => {
    const r = resizeRef.current;
    if (!r || !elRef.current) return;
    elRef.current.style.width = `${Math.max(CARD_MIN_WIDTH, r.ow + (e.clientX - r.px))}px`;
    elRef.current.style.height = `${Math.max(CARD_MIN_HEIGHT, r.oh + (e.clientY - r.py))}px`;
  };
  const onResizeUp = (e: React.PointerEvent) => {
    const r = resizeRef.current;
    if (!r) return;
    resizeRef.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    onUpdate(card.id, {
      width: Math.max(CARD_MIN_WIDTH, r.ow + (e.clientX - r.px)),
      height: Math.max(CARD_MIN_HEIGHT, r.oh + (e.clientY - r.py)),
    });
  };

  return (
    <div
      ref={elRef}
      className="border-border bg-muted/60 pointer-events-auto absolute flex flex-col overflow-hidden rounded-lg border shadow-lg backdrop-blur-sm"
      style={{ left: card.x, top: card.y, width: card.width, height: card.height }}
    >
      <div
        onPointerDown={onHeaderDown}
        onPointerMove={onHeaderMove}
        onPointerUp={onHeaderUp}
        className="border-border bg-muted flex h-7 shrink-0 cursor-grab items-center gap-1 border-b px-2 active:cursor-grabbing"
      >
        <GripHorizontal className="text-muted-foreground size-3.5" />
        <span className="text-muted-foreground text-xs">Tarjeta</span>
        <button
          type="button"
          data-card-action
          aria-label="Eliminar tarjeta"
          onClick={() => onRemove(card.id)}
          className="hover:bg-background text-muted-foreground ml-auto rounded p-0.5"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <BlockNoteView editor={editor} theme={resolvedTheme === "dark" ? "dark" : "light"} />
      </div>
      <div
        onPointerDown={onResizeDown}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeUp}
        className="absolute right-0 bottom-0 size-3 cursor-se-resize"
        aria-hidden
      >
        <div className="border-muted-foreground/50 absolute right-0.5 bottom-0.5 size-1.5 border-r-2 border-b-2" />
      </div>
    </div>
  );
}
