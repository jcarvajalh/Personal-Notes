import { BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs } from "@blocknote/core";

import { Callout } from "@/components/editor/blocks/callout";
import { PageLink } from "@/components/editor/blocks/page-link";
import { PageMention } from "@/components/editor/inline/page-mention";

// Esquema del editor (BlockNote): bloques nativos P0 (párrafo, encabezados,
// listas, cita, código, tabla, imagen, divisor, toggle…) + personalizados de la
// Fase 1 (callout ED-006, enlace a página ED-017, mención inline ED-018).
export const editorSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    // createReactBlockSpec devuelve una factory en BlockNote 0.56: se invoca.
    callout: Callout(),
    pageLink: PageLink(),
  },
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    pageMention: PageMention,
  },
});

export type EditorSchema = typeof editorSchema;
