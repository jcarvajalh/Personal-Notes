import { test as setup, expect } from "@playwright/test";

import { AUTH_STATE, OWNER_EMAIL, OWNER_PASSWORD } from "./constants";

// Inicia sesión como propietario (la cuenta ya existe en la rama dev) y guarda
// el estado. Si la cuenta no existiera, /login redirige a /setup y lo creamos.
setup("autenticar", async ({ page }) => {
  expect(OWNER_EMAIL, "OWNER_EMAIL debe estar en .env.local").not.toBe("");
  expect(OWNER_PASSWORD, "E2E_OWNER_PASSWORD debe estar en .env.local").not.toBe("");

  await page.goto("/login");

  if (page.url().includes("/setup")) {
    await page.locator("#name").fill("Propietario E2E");
    await page.locator("#password").fill(OWNER_PASSWORD);
    await page.getByRole("button", { name: /crear usuario/i }).click();
  } else {
    await page.locator("#email").fill(OWNER_EMAIL);
    await page.locator("#password").fill(OWNER_PASSWORD);
    await page.getByRole("button", { name: /iniciar sesión/i }).click();
  }

  // Esperar al shell de la app (solo existe con sesión). Timeout amplio por la
  // compilación en frío del dev server en el primer arranque.
  await expect(page.getByRole("button", { name: "Nueva página", exact: true }).first()).toBeVisible(
    { timeout: 45_000 },
  );

  await page.context().storageState({ path: AUTH_STATE });
});
