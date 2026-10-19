"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { StickyNote } from "lucide-react";

import { PageEditor } from "@/components/editor/page-editor";
import { CardLayer } from "@/components/editor/card-layer";
import { savePageCardsAction } from "@/server/actions/pages";
import { newCard, type PageCard } from "@/lib/cards";

interface PageBodyProps {
  pageId: string;
  initialContent: unknown;
  initialVersion: number;
  initialCards: PageCard[];
}

// Historial de tarjetas para deshacer/rehacer (Ctrl+Z / Ctrl+Shift+Z). Solo se
// registran cambios estructurales (añadir, mover, redimensionar, eliminar); la
// edición de contenido de cada card la deshace su propio editor BlockNote.
interface CardsState {
  cards: PageCard[];
  past: PageCard[][];
  future: PageCard[][];
}

type CardsAction =
  | { type: "set"; update: (cards: PageCard[]) => PageCard[]; record: boolean }
  | { type: "undo" }
  | { type: "redo" };

const HISTORY_LIMIT = 50;

function cardsReducer(state: CardsState, action: CardsAction): CardsState {
  switch (action.type) {
    case "set": {
      const next = action.update(state.cards);
      if (!action.record) return { ...state, cards: next };
      return {
        cards: next,
        past: [...state.past, state.cards].slice(-HISTORY_LIMIT),
        future: [],
      };
    }
    case "undo": {
      if (state.past.length === 0) return state;
      const prev = state.past[state.past.length - 1];
      return {
        cards: prev,
        past: state.past.slice(0, -1),
        future: [state.cards, ...state.future],
      };
    }
    case "redo": {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        cards: next,
        past: [...state.past, state.cards],
        future: state.future.slice(1),
      };
    }
  }
}

/** Cuerpo de una página normal: editor + lienzo de tarjetas movibles. */
export function PageBody({ pageId, initialContent, initialVersion, initialCards }: PageBodyProps) {
  const [state, dispatch] = useReducer(cardsReducer, {
    cards: initialCards,
    past: [],
    future: [],
  });
  const cards = state.cards;
  const firstRef = useRef(true);

  // Autoguardado de tarjetas (posición, tamaño y contenido), con rebote.
  useEffect(() => {
    if (firstRef.current) {
      firstRef.current = false;
      return;
    }
    const t = setTimeout(() => void savePageCardsAction({ pageId, cards }), 700);
    return () => clearTimeout(t);
  }, [cards, pageId]);

  // Ctrl/Cmd+Z deshace tarjetas solo cuando el foco NO está en un editor (para
  // no pisar el deshacer propio de BlockNote al escribir).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const key = e.key.toLowerCase();
      const isUndo = key === "z" && !e.shiftKey;
      const isRedo = (key === "z" && e.shiftKey) || key === "y";
      if (!isUndo && !isRedo) return;
      const ae = document.activeElement as HTMLElement | null;
      if (ae?.closest('[contenteditable="true"], input, textarea, .bn-editor')) return;
      e.preventDefault();
      dispatch({ type: isRedo ? "redo" : "undo" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const addCard = useCallback((content: unknown[] = []) => {
    dispatch({
      type: "set",
      update: (cs) => [...cs, newCard(content, cs.length)],
      record: true,
    });
  }, []);
  const updateGeom = useCallback((id: string, patch: Partial<PageCard>) => {
    dispatch({
      type: "set",
      update: (cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      record: true,
    });
  }, []);
  const updateContent = useCallback((id: string, content: unknown[]) => {
    dispatch({
      type: "set",
      update: (cs) => cs.map((c) => (c.id === id ? { ...c, content } : c)),
      record: false,
    });
  }, []);
  const removeCard = useCallback((id: string) => {
    dispatch({ type: "set", update: (cs) => cs.filter((c) => c.id !== id), record: true });
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => addCard([])}
        title="Nueva tarjeta movible"
        className="text-muted-foreground hover:bg-muted absolute top-2 right-4 z-30 flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
      >
        <StickyNote className="size-3.5" />
        Tarjeta
      </button>
      <PageEditor
        pageId={pageId}
        initialContent={initialContent}
        initialVersion={initialVersion}
        onCreateCard={addCard}
      />
      <CardLayer
        cards={cards}
        onUpdate={updateGeom}
        onContentChange={updateContent}
        onRemove={removeCard}
      />
    </div>
  );
}
