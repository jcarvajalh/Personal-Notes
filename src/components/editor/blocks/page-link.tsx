"use client";

import { useState } from "react";
import { createReactBlockSpec } from "@blocknote/react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Search } from "lucide-react";

import { searchPages } from "@/server/actions/pages";
import { PageIcon } from "@/components/page-icon";

// ED-017: Enlace a página (custom). Enlaza a una página existente sin crearla
// como hija. Si aún no tiene destino, muestra un buscador para elegirlo.
export const PageLink = createReactBlockSpec(
  {
    type: "pageLink",
    propSchema: {
      pageId: { default: "" },
      title: { default: "" },
    },
    content: "none",
  },
  {
    render: ({ block, editor }) => {
      const { pageId, title } = block.props;
      if (pageId) {
        return (
          <a
            href={`/${pageId}`}
            contentEditable={false}
            className="hover:bg-muted my-1 flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
          >
            <FileText className="text-muted-foreground size-4" />
            <span className="font-medium underline-offset-2 hover:underline">
              {title || "Sin título"}
            </span>
          </a>
        );
      }
      return (
        <PageLinkPicker
          onPick={(p) =>
            editor.updateBlock(block, {
              type: "pageLink",
              props: { pageId: p.id, title: p.title },
            })
          }
        />
      );
    },
  },
);

function PageLinkPicker({ onPick }: { onPick: (p: { id: string; title: string }) => void }) {
  const [query, setQuery] = useState("");
  const { data: results = [] } = useQuery({
    queryKey: ["pagelink-search", query],
    queryFn: () => searchPages(query),
  });

  return (
    <div contentEditable={false} className="my-1 rounded-md border p-2">
      <div className="flex items-center gap-2 border-b px-1 pb-2">
        <Search className="text-muted-foreground size-4" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar página a enlazar…"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>
      <div className="max-h-56 overflow-y-auto pt-1">
        {results.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => onPick({ id: r.id, title: r.title })}
            className="hover:bg-muted flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm"
          >
            <PageIcon icon={r.icon} />
            <span className="truncate">{r.title || "Sin título"}</span>
          </button>
        ))}
        {results.length === 0 && (
          <p className="text-muted-foreground px-2 py-2 text-sm">Sin resultados.</p>
        )}
      </div>
    </div>
  );
}
