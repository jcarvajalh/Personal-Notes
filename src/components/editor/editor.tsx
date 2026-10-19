"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/components/theme-provider";
import { del as idbDel, set as idbSet } from "idb-keyval";
import { Database, FileText, Info, SquarePlus } from "lucide-react";

import {
  filterSuggestionItems,
  insertOrUpdateBlockForSlashMenu,
  type PartialBlock,
} from "@blocknote/core";
import { es as esLocale } from "@blocknote/core/locales";
import {
  FormattingToolbar,
  FormattingToolbarController,
  getDefaultReactSlashMenuItems,
  getFormattingToolbarItems,
  SuggestionMenuController,
  useBlockNoteEditor,
  useComponentsContext,
  useCreateBlockNote,
  type DefaultReactSuggestionItem,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";

import { editorSchema } from "@/components/editor/schema";
import { useSaveStatusStore } from "@/stores/save-status";
import { pageKeys } from "@/hooks/use-pages";
import { createPageAction, savePageContentAction, searchPages } from "@/server/actions/pages";
import { createDatabaseAction } from "@/server/actions/databases";
import { OFFERED_VIEW_TYPES, VIEW_LABELS } from "@/lib/database/types";

const SAVE_DEBOUNCE_MS = 800; // flujo 4.3, paso 2

interface EditorProps {
  pageId: string;
  initialContent: unknown;
  initialVersion: number;
  onCreateCard?: (content: unknown[]) => void;
}

/** Botón "Agregar a tarjeta" en la barra de formato: mueve la selección a una card. */
function AddToCardButton({ onCreateCard }: { onCreateCard?: (content: unknown[]) => void }) {
  const editor = useBlockNoteEditor();
  const Components = useComponentsContext();
  if (!Components) return null;
  return (
    <Components.FormattingToolbar.Button
      label="Agregar a tarjeta"
      mainTooltip="Agregar a tarjeta"
      icon={<SquarePlus className="size-4" />}
      onClick={() => {
        const selection = editor.getSelection();
        const blocks = selection?.blocks ?? [editor.getTextCursorPosition().block];
        if (blocks.length === 0) return;
        onCreateCard?.(blocks as unknown[]);
        editor.removeBlocks(blocks);
      }}
    />
  );
}

export function Editor({ pageId, initialContent, initialVersion, onCreateCard }: EditorProps) {
  const { resolvedTheme } = useTheme();
  const qc = useQueryClient();
  const setStatus = useSaveStatusStore((s) => s.setStatus);

  const normalized =
    Array.isArray(initialContent) && initialContent.length > 0
      ? (initialContent as PartialBlock[])
      : undefined;

  const uploadFile = useCallback(
    async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("pageId", pageId);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "No se pudo subir el archivo");
      }
      const data = (await res.json()) as { url: string };
      return data.url;
    },
    [pageId],
  );

  const editor = useCreateBlockNote({
    schema: editorSchema,
    initialContent: normalized,
    dictionary: esLocale,
    uploadFile,
    // ED-044: corrector ortográfico del navegador.
    domAttributes: { editor: { spellcheck: "true" } },
  });

  // --- Autoguardado con versión optimista (4.3) -----------------------------
  const versionRef = useRef(initialVersion);
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const conflictVersionRef = useRef<number | null>(null);

  const save = useCallback(
    async (snapshot: boolean) => {
      if (!dirtyRef.current && !snapshot) return;
      const content = editor.document;
      setStatus("saving");
      try {
        const res = await savePageContentAction({
          pageId,
          content,
          baseVersion: versionRef.current,
          snapshot,
        });
        if (!res.ok) {
          setStatus("error");
          return;
        }
        if (res.data.status === "conflict") {
          // Conflicto de edición concurrente: se refleja en el indicador de la
          // barra superior (sin popup intrusivo abajo a la derecha). El usuario
          // puede recargar para traer la última versión.
          conflictVersionRef.current = res.data.version;
          setStatus("conflict");
          return;
        }
        versionRef.current = res.data.version;
        dirtyRef.current = false;
        setStatus("saved");
        void idbDel(`draft:${pageId}`);
        bcRef.current?.postMessage({ version: res.data.version });
      } catch {
        // Fallo de red: dejar el cambio en cola y marcar sin conexión.
        setStatus(navigator.onLine ? "error" : "offline");
      }
    },
    [editor, pageId, setStatus],
  );

  const handleChange = useCallback(() => {
    dirtyRef.current = true;
    setStatus("saving");
    void idbSet(`draft:${pageId}`, { content: editor.document, ts: Date.now() });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void save(false), SAVE_DEBOUNCE_MS);
  }, [editor, pageId, save, setStatus]);

  // Suscripción a TODOS los cambios del documento (incluye inserciones
  // programáticas como las menciones del menú, que no disparan el onChange de
  // BlockNoteView). Devuelve su propio cleanup.
  useEffect(() => editor.onChange(handleChange), [editor, handleChange]);

  // Canal entre pestañas para detectar ediciones concurrentes.
  useEffect(() => {
    const bc = new BroadcastChannel(`np.page.${pageId}`);
    bcRef.current = bc;
    bc.onmessage = (e: MessageEvent<{ version: number }>) => {
      const v = e.data?.version;
      if (typeof v !== "number") return;
      if (dirtyRef.current && v > versionRef.current) {
        conflictVersionRef.current = v;
        setStatus("conflict");
      } else if (v > versionRef.current) {
        versionRef.current = v;
      }
    };
    return () => {
      bc.close();
      bcRef.current = null;
    };
  }, [pageId, setStatus]);

  // Guardado forzado al salir / perder foco / ocultar; aviso si hay pendientes.
  useEffect(() => {
    const flush = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      void save(false);
    };
    const onBlur = () => flush();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    const onOnline = () => {
      if (dirtyRef.current) void save(false);
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("blur", onBlur);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      flush();
      setStatus("idle");
    };
  }, [save, setStatus]);

  // --- Menús de sugerencias (/, @, [[) --------------------------------------
  const slashItems = useCallback(
    async (query: string): Promise<DefaultReactSuggestionItem[]> =>
      filterSuggestionItems(
        [
          ...getDefaultReactSlashMenuItems(editor),
          {
            title: "Callout",
            subtext: "Caja destacada con icono",
            aliases: ["callout", "nota", "aviso", "destacado"],
            group: "Básicos",
            icon: <Info className="size-4" />,
            onItemClick: () => {
              insertOrUpdateBlockForSlashMenu(editor, { type: "callout" });
              handleChange();
            },
          },
          {
            title: "Enlace a página",
            subtext: "Enlaza una página existente",
            aliases: ["enlace", "link", "pagina", "página"],
            group: "Básicos",
            icon: <FileText className="size-4" />,
            onItemClick: () => {
              insertOrUpdateBlockForSlashMenu(editor, { type: "pageLink" });
              handleChange();
            },
          },
          ...OFFERED_VIEW_TYPES.map((viewType) => ({
            title: `Vista de ${(VIEW_LABELS[viewType] ?? viewType).toLowerCase()}`,
            subtext: "Base de datos embebida en esta página",
            aliases: [
              "base de datos",
              "database",
              "bd",
              "db",
              viewType,
              VIEW_LABELS[viewType]?.toLowerCase() ?? viewType,
            ],
            group: "Base de datos",
            icon: <Database className="size-4" />,
            onItemClick: async () => {
              // Inline: crea la BD y la inserta como bloque en el documento actual
              // (no navega a una subpágina).
              const res = await createDatabaseAction({
                parentId: pageId,
                viewType,
                isInline: true,
              });
              if (res.ok) {
                qc.invalidateQueries({ queryKey: pageKeys.all });
                insertOrUpdateBlockForSlashMenu(editor, {
                  type: "databaseView",
                  props: { pageId: res.data.pageId },
                });
                handleChange();
              }
            },
          })),
        ],
        query,
      ),
    [editor, handleChange, pageId, qc],
  );

  const mentionItems = useCallback(
    async (query: string): Promise<DefaultReactSuggestionItem[]> => {
      const results = await searchPages(query);
      const items: DefaultReactSuggestionItem[] = results.map((r) => ({
        title: r.title || "Sin título",
        onItemClick: () => {
          editor.insertInlineContent([
            { type: "pageMention", props: { pageId: r.id, title: r.title || "Sin título" } },
            " ",
          ]);
          // La inserción programática no dispara onChange: forzar el guardado.
          handleChange();
        },
      }));
      if (query.trim().length > 0) {
        items.push({
          title: `Crear página «${query.trim()}»`,
          onItemClick: async () => {
            const res = await createPageAction({ title: query.trim() });
            if (res.ok) {
              editor.insertInlineContent([
                { type: "pageMention", props: { pageId: res.data.id, title: query.trim() } },
                " ",
              ]);
              handleChange();
              qc.invalidateQueries({ queryKey: pageKeys.all });
            }
          },
        });
      }
      return items;
    },
    [editor, qc, handleChange],
  );

  return (
    <div className="mx-auto w-full max-w-(--content-max-width) px-8 pt-2">
      <BlockNoteView
        editor={editor}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        slashMenu={false}
        formattingToolbar={false}
      >
        <SuggestionMenuController triggerCharacter="/" getItems={slashItems} />
        <SuggestionMenuController triggerCharacter="@" getItems={mentionItems} />
        <SuggestionMenuController triggerCharacter="[[" getItems={mentionItems} />
        <FormattingToolbarController
          formattingToolbar={() => (
            <FormattingToolbar>
              {getFormattingToolbarItems()}
              <AddToCardButton onCreateCard={onCreateCard} />
            </FormattingToolbar>
          )}
        />
      </BlockNoteView>
    </div>
  );
}
