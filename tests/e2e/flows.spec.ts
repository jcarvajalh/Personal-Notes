import { test, expect } from "@playwright/test";

import { createPage, typeInEditor, waitSaved } from "./helpers";

test.describe.configure({ mode: "serial" });

test("crear y anidar páginas desde el sidebar", async ({ page }) => {
  await createPage(page, "Proyectos E2E");

  // Crear subpágina desde el nodo del sidebar (NV-002 / PG-004).
  const node = page.locator("aside").getByText("Proyectos E2E", { exact: true });
  await node.hover();
  const row = page.locator("aside .group\\/row", { hasText: "Proyectos E2E" }).first();
  await row.getByRole("button", { name: "Nueva subpágina" }).click({ force: true });
  await page.waitForURL(/\/[0-9a-f-]{36}$/);

  const titleBox = page.getByPlaceholder("Sin título");
  await titleBox.click();
  await titleBox.fill("Tareas E2E");

  await expect(page.locator("aside").getByText("Tareas E2E", { exact: true })).toBeVisible();
});

test("escribir bloques, mencionar y persistir al recargar", async ({ page }) => {
  await createPage(page, "Diario E2E");

  await typeInEditor(page, "Hola mundo");
  await page.keyboard.press("Enter");
  await page.keyboard.type("# Encabezado E2E");
  await page.keyboard.press("Enter");

  // Mención con @ a una página existente (ED-018).
  await page.keyboard.type("@Proyectos");
  await page.waitForTimeout(600);
  await page.keyboard.press("Enter");

  await expect(page.locator(".bn-editor").getByText("Encabezado E2E")).toBeVisible();
  await waitSaved(page);

  await page.reload();
  await expect(page.locator(".bn-editor").getByText("Hola mundo")).toBeVisible();
  await expect(page.locator(".bn-editor").getByText("Encabezado E2E")).toBeVisible();
  // La mención persiste como enlace.
  await expect(page.locator(".bn-editor a[data-page-mention]")).toHaveCount(1);
});

test("eliminar y restaurar desde la papelera", async ({ page }) => {
  await createPage(page, "Temporal E2E");

  const row = page.locator("aside .group\\/row", { hasText: "Temporal E2E" }).first();
  await row.hover();
  await row.getByRole("button", { name: "Opciones" }).click({ force: true });
  await page.getByRole("menuitem", { name: "Eliminar" }).click();

  await page.goto("/trash");
  await expect(page.getByText("Temporal E2E", { exact: true })).toBeVisible();
  const trashRow = page.locator("li", { hasText: "Temporal E2E" }).first();
  await trashRow.hover();
  await trashRow.getByRole("button", { name: "Restaurar" }).click();
  await expect(page.getByText("Temporal E2E", { exact: true })).toBeHidden();
});

test("búsqueda full-text con y sin tildes", async ({ page }) => {
  await createPage(page, "Notas con tildes E2E");
  await typeInEditor(page, "según mi corazón esto es relevante");
  await waitSaved(page);

  // Sin tilde.
  await page.keyboard.press("Control+k");
  const input = page.getByPlaceholder("Buscar páginas o ejecutar una acción…");
  await input.fill("segun corazon");
  await expect(page.getByText("Notas con tildes E2E").first()).toBeVisible();

  // Con tilde.
  await input.fill("según corazón");
  await expect(page.getByText("Notas con tildes E2E").first()).toBeVisible();
  await page.keyboard.press("Escape");
});

test("la subida rechaza un archivo con tipo falso (SEC-041)", async ({ page }) => {
  // POST directo a /api/upload con un archivo de texto renombrado a .png.
  const res = await page.request.post("/api/upload", {
    multipart: {
      file: {
        name: "falso.png",
        mimeType: "image/png",
        buffer: Buffer.from("esto no es una imagen, soy texto"),
      },
    },
  });
  expect(res.status()).toBe(415);
});
