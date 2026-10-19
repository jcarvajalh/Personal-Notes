import { describe, expect, it } from "vitest";

import { validateImageUpload, MAX_UPLOAD_BYTES } from "@/lib/uploads";

// Firma PNG real (magic bytes) + relleno.
const PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
]);

describe("validateImageUpload (SEC-040/041)", () => {
  it("acepta una imagen PNG real", async () => {
    const r = await validateImageUpload(PNG, PNG.byteLength);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.mime).toBe("image/png");
  });

  it("rechaza un archivo con tipo falso (texto renombrado a .png)", async () => {
    const fake = new TextEncoder().encode("<script>alert(1)</script> no soy una imagen");
    const r = await validateImageUpload(fake, fake.byteLength);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(415);
  });

  it("rechaza un archivo que supera el tamaño máximo", async () => {
    const r = await validateImageUpload(PNG, MAX_UPLOAD_BYTES + 1);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(413);
  });
});
