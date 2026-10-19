import { test, expect, type APIRequestContext } from "@playwright/test";
import { TOTP, URI } from "otpauth";

import { OWNER_EMAIL, OWNER_PASSWORD } from "./constants";

// Asegura que el 2FA quede desactivado pase lo que pase (no bloquear la cuenta
// real de la rama dev). Reautentica por API si hiciera falta.
async function ensureDisabled(request: APIRequestContext, totp: TOTP | null) {
  let res = await request.post("/api/auth/two-factor/disable", {
    data: { password: OWNER_PASSWORD },
    failOnStatusCode: false,
  });
  if (res.ok()) return;
  // Sin sesión válida: iniciar sesión de nuevo (puede requerir 2FA).
  const signIn = await request.post("/api/auth/sign-in/email", {
    data: { email: OWNER_EMAIL, password: OWNER_PASSWORD },
    failOnStatusCode: false,
  });
  const body = (await signIn.json().catch(() => ({}))) as { twoFactorRedirect?: boolean };
  if (body.twoFactorRedirect && totp) {
    await request.post("/api/auth/two-factor/verify-totp", {
      data: { code: totp.generate() },
      failOnStatusCode: false,
    });
  }
  res = await request.post("/api/auth/two-factor/disable", {
    data: { password: OWNER_PASSWORD },
    failOnStatusCode: false,
  });
}

// AU-006: activa 2FA, cierra sesión, vuelve a entrar y completa el paso TOTP.
test("login con verificación en dos pasos (TOTP)", async ({ page, request }) => {
  let totp: TOTP | null = null;
  try {
    const enableRes = await page.request.post("/api/auth/two-factor/enable", {
      data: { password: OWNER_PASSWORD },
    });
    expect(enableRes.ok(), "enable 2FA debe responder OK").toBeTruthy();
    const { totpURI } = (await enableRes.json()) as { totpURI: string };
    expect(totpURI).toContain("otpauth://");
    totp = URI.parse(totpURI) as TOTP;

    const verifyRes = await page.request.post("/api/auth/two-factor/verify-totp", {
      data: { code: totp.generate() },
    });
    expect(verifyRes.ok(), "verify-totp debe responder OK").toBeTruthy();

    // Cerrar sesión y volver a entrar: debe exigir 2FA.
    await page.request.post("/api/auth/sign-out");
    await page.context().clearCookies();

    await page.goto("/login");
    await page.locator("#email").fill(OWNER_EMAIL);
    await page.locator("#password").fill(OWNER_PASSWORD);
    await page.getByRole("button", { name: /iniciar sesión/i }).click();

    await page.waitForURL("**/login/2fa");
    await page.getByRole("textbox").first().fill(totp.generate());
    await page.getByRole("button", { name: /verificar/i }).click();
    await expect(
      page.getByRole("button", { name: "Nueva página", exact: true }).first(),
    ).toBeVisible({ timeout: 20_000 });
  } finally {
    await ensureDisabled(page.request, totp);
    await ensureDisabled(request, totp);
  }
});
