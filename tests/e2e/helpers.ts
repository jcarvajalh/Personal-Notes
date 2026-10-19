import { expect, type Page } from "@playwright/test";

/** Crea una página raíz desde el sidebar y le pone título. Devuelve la URL. */
export async function createPage(page: Page, title: string): Promise<string> {
  await page.goto("/");
  await page.getByRole("button", { name: "Nueva página", exact: true }).first().click();
  await page.waitForURL(/\/[0-9a-f-]{36}$/);
  const titleBox = page.getByPlaceholder("Sin título");
  await titleBox.click();
  await titleBox.fill(title);
  // Espera al autoguardado del título (debounce 500 ms) e indexado en el sidebar.
  await expect(page.locator("aside").getByText(title, { exact: true })).toBeVisible();
  return page.url();
}

/** Escribe texto en el editor BlockNote. */
export async function typeInEditor(page: Page, text: string): Promise<void> {
  const editor = page.locator(".bn-editor [contenteditable='true']").first();
  await editor.click();
  await page.keyboard.type(text);
}

/** Espera a que el indicador muestre "Guardado". */
export async function waitSaved(page: Page): Promise<void> {
  await expect(page.getByText("Guardado", { exact: true })).toBeVisible({ timeout: 20_000 });
}
