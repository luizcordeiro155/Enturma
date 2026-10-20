import { test } from "./student-fixture";
import { authenticate } from "./session";
import { expect, type Page } from "@playwright/test";

async function panel(page: Page, title: string) {
  const dialog = page.getByRole("dialog");
  if (await dialog.isVisible()) {
    await dialog.getByRole("button", { name: "Aplicar", exact: true }).click();
    await expect(dialog).toBeHidden();
  }
  await page.getByRole("button", { name: new RegExp(`^${title}`) }).click();
  await expect(
    page.getByRole("dialog", { name: title, exact: true }),
  ).toBeVisible();
}
async function apply(page: Page) {
  const dialog = page.getByRole("dialog");
  if (await dialog.isVisible()) {
    await dialog.getByRole("button", { name: "Aplicar", exact: true }).click();
    await expect(dialog).toBeHidden();
  }
}

import { randomUUID } from "node:crypto";

test("cores vivas, mural independente e rascunho preservado ao trocar de página", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.setViewportSize({ width: 1920, height: 1080 });
  const tag = randomUUID().slice(0, 8);
  const response = await request.post(
    `${process.env.E2E_API_URL ?? "http://localhost:8080"}/api/v1/auth/register`,
    {
      data: {
        name: "Perfil visual",
        username: `visual_${tag}`,
        email: `visual_${tag}@example.test`,
        password: "Profile-visual-test-123",
        device: "E2E",
      },
    },
  );
  expect(response.ok()).toBe(true);
  const credentials = await response.json();
  await authenticate(page.context(), credentials);
  await page.addInitScript(() =>
    localStorage.setItem("enturma-intro:v0.3", "seen"),
  );
  await page.goto("/profile");
  await panel(page, "Mural e movimento");
  await page
    .getByRole("textbox", { name: "Objetivo da semana", exact: true })
    .fill("Atualizar meu projeto e compartilhar materiais com a turma.");
  await page
    .getByRole("textbox", { name: "Tecnologias que estudo", exact: true })
    .fill("Java / JavaScript / TypeScript / PostgreSQL");
  await panel(page, "Tema e identidade");
  await page.getByLabel("Cor principal do perfil").fill("#ff0044");
  await panel(page, "Mural e movimento");
  await page.getByLabel("Cor secundária", { exact: true }).fill("#240075");
  await page.getByLabel("Fundo decorativo").selectOption("GRADIENT");
  await apply(page);
  const preview = page.locator(".profile-preview-combined");
  await expect
    .poll(() =>
      preview.evaluate((node) => getComputedStyle(node).backgroundImage),
    )
    .toContain("rgb(255, 0, 68)");
  await panel(page, "Mural e movimento");
  await page
    .getByRole("combobox", { name: "Fundo do mural", exact: true })
    .selectOption("CUSTOM");
  await page
    .getByLabel("Cor principal do mural", { exact: true })
    .fill("#0055cc");
  await page
    .getByLabel("Segunda cor do mural", { exact: true })
    .fill("#00bb88");
  await expect
    .poll(() =>
      preview
        .locator(".profile-public-advanced")
        .evaluate((node) => getComputedStyle(node).backgroundImage),
    )
    .toContain("rgb(0, 85, 204)");
  await panel(page, "Sobre você");
  await page
    .getByLabel("Nome exibido", { exact: true })
    .fill("Meu rascunho preservado");
  await apply(page);
  await page.getByRole("link", { name: "Salas", exact: true }).first().click();
  await expect(page).toHaveURL(/rooms/);
  await page
    .getByRole("link", { name: "Abrir meu perfil para editar", exact: true })
    .click();
  await panel(page, "Sobre você");
  await expect(page.getByLabel("Nome exibido", { exact: true })).toHaveValue(
    "Meu rascunho preservado",
  );
  await panel(page, "Mural e movimento");
  await expect(
    page.getByLabel("Cor principal do mural", { exact: true }),
  ).toHaveValue("#0055cc");
  await apply(page);
  await page
    .getByRole("button", { name: "Salvar perfil", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Perfil salvo com sucesso." }),
  ).toBeVisible();
  await page.reload();
  await panel(page, "Mural e movimento");
  await expect(
    page.getByLabel("Cor principal do mural", { exact: true }),
  ).toHaveValue("#0055cc");
  await apply(page);
  await expect(
    page.getByRole("button", { name: "Reproduzir animação do perfil" }),
  ).toHaveCount(0);
  const controls = page.locator(".profile-editor-controls");
  const identity = preview.locator(".profile-preview-identity");
  const mural = preview.locator(".profile-preview-mural");
  await expect(identity).toBeVisible();
  await expect(mural).toBeVisible();
  expect((await controls.boundingBox())!.x).toBeLessThan(
    (await preview.boundingBox())!.x,
  );
  expect((await identity.boundingBox())!.width).toBeGreaterThanOrEqual(320);
  expect((await mural.boundingBox())!.width).toBeGreaterThanOrEqual(360);
  expect(
    await mural.evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
  expect(
    await mural
      .locator(".profile-advanced-highlight")
      .first()
      .evaluate((node) => node.clientWidth),
  ).toBeGreaterThan(270);
  await page.screenshot({
    path: "../../.local/profile-visual-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1366, height: 900 });
  await expect(
    page.getByRole("button", { name: "Perfil", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mural", exact: true }).click();
  expect((await mural.boundingBox())!.width).toBeGreaterThan(300);
  expect(
    await mural.evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
  await page.screenshot({ path: "../../.local/profile-visual-laptop.png" });
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(controls).toBeVisible();
  await expect(page.locator(".profile-preview-stage")).toBeHidden();
  await apply(page);
  await page.getByRole("button", { name: "Ver prévia", exact: true }).click();
  await expect(controls).toBeHidden();
  await page.getByRole("button", { name: "Mural", exact: true }).click();
  await expect(preview.locator(".profile-preview-mural")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "../../.local/profile-visual-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 360, height: 780 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Editar", exact: true }).click();
  await panel(page, "Sobre você");
  await expect(page.getByLabel("Nome exibido", { exact: true })).toHaveValue(
    "Meu rascunho preservado",
  );
  await panel(page, "Mural e movimento");
  await page
    .getByRole("combobox", { name: "Fundo do mural", exact: true })
    .selectOption("DEFAULT");
  await apply(page);
  await page.getByRole("button", { name: "Ver prévia", exact: true }).click();
  await expect
    .poll(() =>
      preview
        .locator(".profile-public-advanced")
        .evaluate((node) => getComputedStyle(node).backgroundImage),
    )
    .toBe("none");
  expect(errors).toEqual([]);
});
test("mural preserva widgets após recarregar e respeita privacidade", async ({
  page,
  request,
}) => {
  const tag = randomUUID().slice(0, 8),
    email = `profilev3-${tag}@example.test`,
    password = "Profile-v3-password-123";
  const registered = await request.post(
    `${process.env.E2E_API_URL ?? "http://localhost:8080"}/api/v1/auth/register`,
    {
      data: {
        name: "Perfil de estudo",
        username: `profilev3_${tag}`,
        email,
        password,
        device: "E2E",
      },
    },
  );
  expect(registered.ok()).toBe(true);
  const user = await registered.json();
  await authenticate(page.context(), user);
  await page.goto("/profile");
  await panel(page, "Mural e movimento");
  await page
    .getByRole("textbox", { name: "Objetivo da semana", exact: true })
    .fill("Revisar cálculo e compartilhar resumos");
  await panel(page, "Mural e movimento");
  await page.getByLabel("Cor secundária", { exact: true }).fill("#336699");
  await page.getByLabel("Fundo decorativo").selectOption("GRADIENT");
  await panel(page, "Widgets do mural");
  await page.getByLabel("Adicionar widget").selectOption("GOAL");
  await panel(page, "Privacidade");
  await page.getByLabel("Widgets e textos do mural", { exact: true }).check();
  await apply(page);
  await page
    .getByRole("button", { name: "Salvar perfil", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Perfil salvo com sucesso." }),
  ).toBeVisible();
  await page.reload();
  await panel(page, "Mural e movimento");
  await expect(
    page.getByRole("textbox", { name: "Objetivo da semana", exact: true }),
  ).toBeVisible({ timeout: 20000 });
  await expect(
    page.getByRole("textbox", { name: "Objetivo da semana", exact: true }),
  ).toHaveValue("Revisar cálculo e compartilhar resumos");
  await expect(page.getByLabel("Cor secundária", { exact: true })).toHaveValue(
    "#336699",
  );
  // Re-saving the GET payload used to include read-only widget fields and fail validation.
  await apply(page);
  await page
    .getByRole("button", { name: "Salvar perfil", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Perfil salvo com sucesso." }),
  ).toBeVisible();
  const peer = await request.post(
    `${process.env.E2E_API_URL ?? "http://localhost:8080"}/api/v1/auth/register`,
    {
      data: {
        name: "Colega",
        username: `peer_${tag}`,
        email: `peer-${tag}@example.test`,
        password,
        device: "E2E",
      },
    },
  );
  const credentials = await peer.json();
  const me = await page.request.get("/api/backend/users/me");
  const id = (await me.json()).id;
  const endpoint = `${process.env.E2E_API_URL ?? "http://localhost:8080"}/api/v1/users/${id}/showcase`;
  const publicView = await request.get(endpoint, {
    headers: { Authorization: `Bearer ${credentials.accessToken}` },
  });
  expect(publicView.ok()).toBe(true);
  expect(
    (await publicView.json()).widgets.some(
      (w: { kind: string }) => w.kind === "GOAL",
    ),
  ).toBe(true);
  await panel(page, "Privacidade");
  await page.getByLabel("Widgets e textos do mural", { exact: true }).uncheck();
  await apply(page);
  await page
    .getByRole("button", { name: "Salvar perfil", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Perfil salvo com sucesso." }),
  ).toBeVisible();
  const hidden = await request.get(endpoint, {
    headers: { Authorization: `Bearer ${credentials.accessToken}` },
  });
  const result = await hidden.json();
  expect(result.widgets).toEqual([]);
  expect(result.appearance.goal).toBeUndefined();
  await page.screenshot({
    path: "../../.local/profile-v3.png",
    fullPage: true,
  });
  expect(user.accessToken).toBeTruthy();
});
