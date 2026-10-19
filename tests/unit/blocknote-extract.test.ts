import { describe, expect, it } from "vitest";

import { extractFromDocument } from "@/lib/engines/blocknote";

describe("extractFromDocument", () => {
  it("extrae texto plano de párrafos y encabezados anidados", () => {
    const doc = [
      { id: "1", type: "heading", content: [{ type: "text", text: "Título" }] },
      {
        id: "2",
        type: "paragraph",
        content: [
          { type: "text", text: "Hola " },
          { type: "text", text: "mundo" },
        ],
        children: [{ id: "3", type: "paragraph", content: [{ type: "text", text: "anidado" }] }],
      },
    ];
    const r = extractFromDocument(doc);
    expect(r.text).toBe("Título\nHola mundo\nanidado");
    expect(r.wordCount).toBe(4);
  });

  it("captura menciones de página como backlinks 'mention'", () => {
    const doc = [
      {
        id: "b1",
        type: "paragraph",
        content: [
          { type: "text", text: "Ver " },
          { type: "pageMention", props: { pageId: "p-123", title: "Proyectos" } },
        ],
      },
    ];
    const r = extractFromDocument(doc);
    expect(r.text).toBe("Ver Proyectos");
    expect(r.backlinks).toEqual([
      { blockId: "b1", targetPageId: "p-123", kind: "mention", context: "Ver Proyectos" },
    ]);
  });

  it("captura bloques de enlace a página como backlinks 'link'", () => {
    const doc = [{ id: "b2", type: "pageLink", props: { pageId: "p-9" }, content: [] }];
    const r = extractFromDocument(doc);
    expect(r.backlinks).toEqual([
      { blockId: "b2", targetPageId: "p-9", kind: "link", context: null },
    ]);
  });

  it("deduplica menciones repetidas del mismo bloque al mismo destino", () => {
    const doc = [
      {
        id: "b3",
        type: "paragraph",
        content: [
          { type: "pageMention", props: { pageId: "p-1", title: "A" } },
          { type: "pageMention", props: { pageId: "p-1", title: "A" } },
        ],
      },
    ];
    const r = extractFromDocument(doc);
    expect(r.backlinks).toHaveLength(1);
  });

  it("tolera documentos vacíos o inválidos", () => {
    expect(extractFromDocument([]).text).toBe("");
    expect(extractFromDocument(null).wordCount).toBe(0);
    expect(extractFromDocument(undefined).backlinks).toEqual([]);
  });
});
