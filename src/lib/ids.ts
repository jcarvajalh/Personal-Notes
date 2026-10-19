// Generación de UUID v7 en la aplicación (sección 6.1: "uuid v7 preferente,
// generados en la app"). UUID v7 ordena por tiempo, lo que mejora la localidad
// de los índices frente a v4 aleatorio.

export function uuidv7(): string {
  const ts = BigInt(Date.now());
  const bytes = new Uint8Array(16);

  // 48 bits de marca de tiempo en milisegundos (big-endian).
  bytes[0] = Number((ts >> 40n) & 0xffn);
  bytes[1] = Number((ts >> 32n) & 0xffn);
  bytes[2] = Number((ts >> 24n) & 0xffn);
  bytes[3] = Number((ts >> 16n) & 0xffn);
  bytes[4] = Number((ts >> 8n) & 0xffn);
  bytes[5] = Number(ts & 0xffn);

  // 74 bits aleatorios.
  const rnd = crypto.getRandomValues(new Uint8Array(10));
  bytes.set(rnd, 6);

  // Versión 7 y variante RFC 4122.
  bytes[6] = (bytes[6]! & 0x0f) | 0x70;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
