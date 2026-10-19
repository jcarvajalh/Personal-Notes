"use client";

import { createReactBlockSpec } from "@blocknote/react";

// ED-006: Callout (custom). Caja con icono y color de fondo que contiene texto.
const COLORS: Record<string, string> = {
  gray: "bg-muted/60 border-border",
  brand: "bg-brand-muted border-brand/30",
  amber: "bg-amber-100 border-amber-300 dark:bg-amber-950/40 dark:border-amber-900",
  green: "bg-emerald-100 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-900",
  red: "bg-red-100 border-red-300 dark:bg-red-950/40 dark:border-red-900",
};

export const Callout = createReactBlockSpec(
  {
    type: "callout",
    propSchema: {
      color: { default: "gray" },
      emoji: { default: "💡" },
    },
    content: "inline",
  },
  {
    render: ({ block, contentRef }) => {
      const color = COLORS[block.props.color] ?? COLORS.gray;
      return (
        <div className={`my-1 flex gap-2 rounded-md border px-3 py-2 ${color}`}>
          <span className="shrink-0 text-lg leading-6 select-none" aria-hidden>
            {block.props.emoji}
          </span>
          <div ref={contentRef} className="min-w-0 flex-1" />
        </div>
      );
    },
  },
);
