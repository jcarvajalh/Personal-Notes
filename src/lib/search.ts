// Marcadores de resaltado de ts_headline (SR-002). Se definen aquí (sin
// "server-only") para compartirlos entre la query del servidor y el renderizado
// en el cliente, que los convierte en <mark> sin inyectar HTML.
export const HL_START = "[[h]]";
export const HL_END = "[[/h]]";

export interface HighlightSegment {
  text: string;
  mark: boolean;
}

/** Divide un fragmento con marcadores en segmentos resaltados/normales. */
export function splitHighlights(snippet: string): HighlightSegment[] {
  const segments: HighlightSegment[] = [];
  let rest = snippet;
  while (rest.length > 0) {
    const start = rest.indexOf(HL_START);
    if (start === -1) {
      segments.push({ text: rest, mark: false });
      break;
    }
    if (start > 0) segments.push({ text: rest.slice(0, start), mark: false });
    const afterStart = rest.slice(start + HL_START.length);
    const end = afterStart.indexOf(HL_END);
    if (end === -1) {
      segments.push({ text: afterStart, mark: true });
      break;
    }
    segments.push({ text: afterStart.slice(0, end), mark: true });
    rest = afterStart.slice(end + HL_END.length);
  }
  return segments;
}
