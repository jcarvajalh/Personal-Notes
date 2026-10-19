"use client";

import { createReactInlineContentSpec } from "@blocknote/react";

// ED-018: Mención de página (inline). Enlace vivo a otra página; muestra el
// título capturado y navega a /{pageId}. La extracción a `backlinks` ocurre al
// guardar (motor blocknote.ts).
export const PageMention = createReactInlineContentSpec(
  {
    type: "pageMention",
    propSchema: {
      pageId: { default: "" },
      title: { default: "" },
    },
    content: "none",
  },
  {
    render: ({ inlineContent }) => {
      const { pageId, title } = inlineContent.props;
      return (
        <a
          href={`/${pageId}`}
          data-page-mention={pageId}
          className="text-brand decoration-brand/40 hover:bg-brand-muted rounded px-0.5 font-medium underline underline-offset-2"
          contentEditable={false}
        >
          @{title || "Sin título"}
        </a>
      );
    },
  },
);
