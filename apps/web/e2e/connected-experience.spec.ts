import { test } from "./student-fixture";
import { expect } from "@playwright/test";
import { authenticate } from "./session";
import { randomUUID } from "node:crypto";

test("tema por hover e toque, edição cancelável e portfólio com arquivo real", async ({
  page,
  request,
}) => {
  const tag = randomUUID().slice(0, 8),
    username = `connected_${tag}`;
  const response = await request.post(
    `${process.env.E2E_API_URL ?? "http://localhost:8080"}/api/v1/auth/register`,
    {
      data: {
        name: "Perfil conectado",
        username,
        email: `${username}@example.test`,
        password: "Connected-test-12345",
        device: "E2E",
      },
    },
  );
  expect(response.ok()).toBe(true);
  await authenticate(page.context(), await response.json());
  await page.goto("/profile");
  await expect(page.getByRole("button", { name: /^Sobre você/ })).toBeVisible();
  const theme = page.getByRole("button", { name: /^Tema .*Escolher tema/ });
  await theme.hover();
  await expect(page.getByRole("menu", { name: "Escolher tema" })).toBeVisible();
  await page.getByRole("menuitemradio", { name: /Escuro/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const editCard = page.getByRole("button", { name: /^Sobre você/ });
    await expect(editCard).toHaveCSS("background-color", "rgb(22, 30, 33)");
    await expect(editCard).toHaveCSS("color", "rgb(242, 246, 244)");
    await expect(editCard.locator(".profile-edit-thumbnail svg")).toHaveCSS("color", "rgb(242, 246, 244)");
    await expect(editCard.locator("small")).toHaveCSS("opacity", "1");

  await theme.click();
  const darkMenu = page.getByRole("menu", { name: "Escolher tema" });
  const selectedDark = darkMenu.getByRole("menuitemradio", { name: /Escuro/ });
  await expect(selectedDark).toHaveCSS("color", "rgb(242, 246, 244)");
  await expect(selectedDark.locator("svg").first()).toHaveCSS("color", "rgb(227, 232, 255)");
  await selectedDark.click();
  await page.getByRole("button", { name: /^Sobre você/ }).click();
  await page
    .getByLabel("Nome exibido", { exact: true })
    .fill("Rascunho cancelado");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancelar", exact: true })
    .click();
  await page.getByRole("button", { name: /^Sobre você/ }).click();
  await expect(page.getByLabel("Nome exibido", { exact: true })).toHaveValue(
    "Perfil conectado",
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancelar", exact: true })
    .click();
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/settings");
  await theme.click();
  const menu = page.getByRole("menu", { name: "Escolher tema" });
  const bounds = (await menu.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(360);
  await page.getByRole("menuitemradio", { name: /Claro/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/profile");
  const lightCard = page.getByRole("button", { name: /^Sobre você/ });
  await expect(lightCard).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(lightCard).toHaveCSS("color", "rgb(23, 63, 54)");
  await expect(lightCard.locator(".profile-edit-thumbnail svg")).toHaveCSS("color", "rgb(23, 63, 54)");
  await page.getByRole("button", { name: /^Estilo do nome/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page
      .getByRole("dialog")
      .evaluate((n) => n.scrollWidth <= n.clientWidth),
  ).toBe(true);
  await page.screenshot({ path: "../../.local/connected-editor-mobile.png" });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Aplicar", exact: true })
    .click();
  await page.goto("/portfolio");
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  await page
    .getByLabel("Nome do projeto 1", { exact: true })
    .fill("Pesquisa acadêmica");
  await page
    .locator(".portfolio-upload input")
    .setInputFiles({
      name: "pesquisa.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7\nDocumento de teste\n%%EOF"),
    });
  await expect(page.getByRole("link", { name: /pesquisa.pdf/ })).toBeVisible();
  await page
    .getByRole("button", { name: "Salvar portfólio", exact: true })
    .click();
  await expect(
    page.getByText("Portfólio atualizado.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("link", { name: /pesquisa.pdf/ })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
