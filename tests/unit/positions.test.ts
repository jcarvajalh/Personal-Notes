import { describe, expect, it } from "vitest";

import { positionBetween, positionsBetween } from "@/lib/positions";

describe("positionBetween", () => {
  it("genera una clave al final cuando no hay vecinos", () => {
    const first = positionBetween(null, null);
    expect(typeof first).toBe("string");
    expect(first.length).toBeGreaterThan(0);
  });

  it("genera claves ordenables entre dos existentes", () => {
    const a = positionBetween(null, null);
    const b = positionBetween(a, null);
    const mid = positionBetween(a, b);
    expect(a < mid).toBe(true);
    expect(mid < b).toBe(true);
  });

  it("mantiene el orden al añadir al final repetidamente", () => {
    const keys: string[] = [];
    let last: string | null = null;
    for (let i = 0; i < 5; i++) {
      last = positionBetween(last, null);
      keys.push(last);
    }
    const sorted = [...keys].sort();
    expect(keys).toEqual(sorted);
  });
});

describe("positionsBetween", () => {
  it("genera N claves consecutivas y ordenadas", () => {
    const keys = positionsBetween(null, null, 4);
    expect(keys).toHaveLength(4);
    expect([...keys].sort()).toEqual(keys);
  });

  it("devuelve lista vacía para n<=0", () => {
    expect(positionsBetween(null, null, 0)).toEqual([]);
  });
});
