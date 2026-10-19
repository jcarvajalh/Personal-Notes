import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// SEC-090/091: guardas estáticas sobre el código nuevo de la Fase 1.

const root = process.cwd();
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

describe("toda Server Action verifica sesión (requireUser)", () => {
  it("cada 'export async function' de actions/pages.ts llama a requireUser()", () => {
    const src = read("src/server/actions/pages.ts");
    const segments = src.split(/export async function /).slice(1);
    expect(segments.length).toBeGreaterThan(10);
    const offenders = segments
      .map((seg) => seg.slice(0, seg.indexOf("\n}\n") === -1 ? seg.length : seg.indexOf("\n}\n")))
      .map((seg, i) => ({ name: segments[i].slice(0, segments[i].indexOf("(")), seg }))
      .filter(({ seg }) => !seg.includes("requireUser("))
      .map(({ name }) => name);
    expect(offenders).toEqual([]);
  });
});

describe("el Route Handler de subida está protegido y valida el tipo", () => {
  it("/api/upload llama a requireUser y a validateImageUpload", () => {
    const src = read("src/app/api/upload/route.ts");
    expect(src).toContain("requireUser(");
    expect(src).toContain("validateImageUpload(");
  });
});

describe("no se inyecta HTML sin sanitizar (XSS) en el código nuevo", () => {
  const files = [
    "src/components/command-palette/command-palette.tsx",
    "src/components/page/page-header.tsx",
    "src/components/editor/inline/page-mention.tsx",
    "src/components/editor/blocks/callout.tsx",
    "src/components/editor/blocks/page-link.tsx",
    "src/components/sidebar/tree-node.tsx",
  ];
  for (const f of files) {
    it(`${f} no usa dangerouslySetInnerHTML`, () => {
      expect(read(f)).not.toContain("dangerouslySetInnerHTML");
    });
  }
});
