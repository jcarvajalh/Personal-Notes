import { expect, type Page } from "@playwright/test";

let seq = 0;
/** Título único por ejecución (el dev DB persiste entre runs: evita duplicados). */
export function uniqueTitle(base: string): string {
  return `${base} ${Date.now().toString(36)}${seq++}`;
}

/** Crea una página raíz desde el sidebar y le pone título único. Devuelve el título. */
export async function createPage(page: Page, baseTitle: string): Promise<string> {
  const title = uniqueTitle(baseTitle);
  await page.goto("/");
  await page.getByRole("button", { name: "Nueva página", exact: true }).first().click();
  await page.waitForURL(/\/[0-9a-f-]{36}$/);
  const titleBox = page.getByPlaceholder("Sin título");
  await titleBox.click();
  await titleBox.fill(title);
  // Espera al autoguardado del título (debounce 500 ms) e indexado en el sidebar.
  await expect(page.locator("aside").getByText(title, { exact: true })).toBeVisible();
  return title;
}

/** Escribe texto en el editor BlockNote. */
export async function typeInEditor(page: Page, text: string): Promise<void> {
  const editor = page.locator(".ProseMirror").first();
  await editor.waitFor({ state: "visible", timeout: 20_000 });
  await editor.click();
  await page.keyboard.type(text);
}

/** Espera a que el indicador muestre "Guardado". */
export async function waitSaved(page: Page): Promise<void> {
  await expect(page.getByText("Guardado", { exact: true })).toBeVisible({ timeout: 20_000 });
}
