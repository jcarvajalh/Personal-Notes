import { describe, expect, it } from "vitest";

import { applyView, groupRows, operatorGroup, rawValue } from "@/lib/database/view-config";
import type { DbProperty, DbRow } from "@/server/queries/databases";

const createdProp: DbProperty = {
  id: "p_created",
  name: "Fecha de creación",
  type: "created_time",
  config: { include_time: true },
  description: null,
  position: "a",
};

const editedProp: DbProperty = {
  id: "p_edited",
  name: "Última edición",
  type: "last_edited_time",
  config: { include_time: true },
  description: null,
  position: "b",
};

function row(id: string, createdAt: string, updatedAt: string): DbRow {
  return {
    id,
    title: id,
    icon: null,
    properties: {},
    position: id,
    createdAt,
    updatedAt,
  };
}

const rows: DbRow[] = [
  row("r1", "2026-10-17T08:00:00.000Z", "2026-10-19T12:00:00.000Z"),
  row("r2", "2026-10-18T09:30:00.000Z", "2026-10-18T09:30:00.000Z"),
  row("r3", "2026-10-19T23:00:00.000Z", "2026-10-20T06:00:00.000Z"),
];

describe("propiedades automáticas (DB-004)", () => {
  it("rawValue lee los timestamps de la página, no pages.properties", () => {
    expect(rawValue(rows[0], createdProp)).toBe("2026-10-17T08:00:00.000Z");
    expect(rawValue(rows[0], editedProp)).toBe("2026-10-19T12:00:00.000Z");
  });

  it("se filtran con operadores de fecha", () => {
    expect(operatorGroup("created_time")).toBe("date");
    expect(operatorGroup("last_edited_time")).toBe("date");
  });

  it("'is' compara por la porción de fecha, ignorando la hora", () => {
    const result = applyView(rows, [createdProp], {
      filters: [{ property_id: createdProp.id, operator: "is", value: "2026-10-19" }],
    });
    expect(result.map((r) => r.id)).toEqual(["r3"]);
  });

  it("'after' incluye las filas posteriores a la fecha", () => {
    const result = applyView(rows, [createdProp], {
      filters: [{ property_id: createdProp.id, operator: "after", value: "2026-10-17" }],
    });
    expect(result.map((r) => r.id).sort()).toEqual(["r2", "r3"]);
  });

  it("ordena por fecha automática ascendente y descendente", () => {
    const asc = applyView(rows, [editedProp], {
      sorts: [{ property_id: editedProp.id, direction: "asc" }],
    });
    expect(asc.map((r) => r.id)).toEqual(["r2", "r1", "r3"]);

    const desc = applyView(rows, [editedProp], {
      sorts: [{ property_id: editedProp.id, direction: "desc" }],
    });
    expect(desc.map((r) => r.id)).toEqual(["r3", "r1", "r2"]);
  });

  it("agrupa por la porción de fecha", () => {
    const groups = groupRows(rows, createdProp);
    const keys = groups.map((g) => g.key).sort();
    expect(keys).toEqual(["2026-10-17", "2026-10-18", "2026-10-19"]);
  });
});
