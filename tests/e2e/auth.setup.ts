import { test as setup, expect } from "@playwright/test";

import { AUTH_STATE, OWNER_EMAIL, OWNER_PASSWORD } from "./constants";

// Inicia sesión como propietario (la cuenta ya existe en la rama dev) y guarda
// el estado. Si la cuenta no existiera, hace el setup inicial.
setup("autenticar", async ({ page }) => {
  expect(OWNER_EMAIL, "OWNER_EMAIL debe estar en .env.local").not.toBe("");
  expect(OWNER_PASSWORD, "E2E_OWNER_PASSWORD debe estar en .env.local").not.toBe("");

  await page.goto("/login");
  await page.locator("#email").fill(OWNER_EMAIL);
  await page.locator("#password").fill(OWNER_PASSWORD);
  await page.getByRole("button", { name: /iniciar sesión/i }).click();
  await page.waitForTimeout(2500);

  if (page.url().includes("/login") && !page.url().includes("/2fa")) {
    // La cuenta no existe todavía: crearla con el setup inicial.
    await page.goto("/setup");
    const nameField = page.locator("#name");
    await expect(nameField).toBeVisible();
    await nameField.fill("Propietario E2E");
    await page.locator("#password").fill(OWNER_PASSWORD);
    await page.getByRole("button", { name: /crear usuario/i }).click();
  }

  // Autenticado: el sidebar (botón "Nueva página") solo existe con sesión.
  await expect(page.getByRole("button", { name: "Nueva página", exact: true }).first()).toBeVisible(
    { timeout: 20_000 },
  );

  await page.context().storageState({ path: AUTH_STATE });
});
