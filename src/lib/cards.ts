// Tarjeta flotante movible del lienzo de una página (extensión propia).
export interface PageCard {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: unknown[];
}

export const CARD_MIN_WIDTH = 160;
export const CARD_MIN_HEIGHT = 100;

/** Crea una tarjeta nueva, escalonando la posición según cuántas ya hay. */
export function newCard(content: unknown[], index: number): PageCard {
  const offset = (index % 6) * 28;
  return {
    id: crypto.randomUUID(),
    x: 48 + offset,
    y: 48 + offset,
    width: 340,
    height: 220,
    content,
  };
}
