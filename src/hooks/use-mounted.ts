"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * true tras el primer render en cliente (evita mismatch de hidratación).
 * Implementado con useSyncExternalStore: snapshot de servidor = false,
 * de cliente = true, sin setState en efecto.
 */
export function useMounted() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
