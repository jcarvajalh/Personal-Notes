import { generateKeyBetween } from "fractional-indexing";

// Orden con índices fraccionarios (6.1): reordenar no exige actualizar filas
// vecinas. `fractional-indexing` genera una clave entre dos existentes.

/** Clave entre `a` y `b` (null = extremo). Para añadir al final: between(last, null). */
export function positionBetween(a: string | null, b: string | null): string {
  return generateKeyBetween(a ?? null, b ?? null);
}

/** Genera N claves consecutivas entre `a` y `b` (para insertar varios elementos). */
export function positionsBetween(a: string | null, b: string | null, n: number): string[] {
  if (n <= 0) return [];
  // generateNKeysBetween no está tipado en todas las versiones; lo encadenamos.
  const keys: string[] = [];
  let left = a ?? null;
  for (let i = 0; i < n; i++) {
    const key = generateKeyBetween(left, b ?? null);
    keys.push(key);
    left = key;
  }
  return keys;
}
