import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
test("amizade, perfil público e conversa ponta a ponta entre dois navegadores", async ({
  page,
  browser,
}) => {
  const tag = randomUUID().slice(0, 8),
    a = `alice_${tag}`,
    b = `bob_${tag}`;
  async function register(p: Page, name: string) {
    await p.goto("/register");
    await p.getByLabel("Seu nome").fill(name);
    await p.getByLabel("Nome de usuário").fill(name);
    await p.getByLabel("E-mail").fill(`${name}@example.test`);
    await p.getByLabel("Senha", { exact: true }).fill("E2E-password-long-123");
    await p.getByRole("button", { name: "Criar conta" }).click();
    await expect(p).toHaveURL(/onboarding/);
    await p.goto("/friends");
    await p.getByText("Chaves e backup das conversas").click();
    await expect(
      p.getByRole("button", { name: "Baixar backup cifrado" }),
    ).toBeEnabled();
  }
  await register(page, a);
  await page.goto("/profile");
  await page.getByLabel("Status personalizado").fill("Estudando JavaScript");
  await page
    .getByRole("combobox", { name: "Decoração do avatar" })
    .selectOption("RING");
  await page.getByRole("button", { name: "Salvar identidade" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Personalização salva" }),
  ).toBeVisible();
  await page.screenshot({
    path: "../../.local/profile-desktop.png",
    fullPage: true,
  });
  await page.goto("/friends");

  const peer = await browser.newContext();
  const other = await peer.newPage();
  await register(other, b);
  await page.getByLabel("Adicionar pelo nome de usuário").fill(b);
  await page.getByRole("button", { name: "Enviar convite" }).click();
  await expect(
    other.getByRole("button", { name: "Aceitar convite" }),
  ).toBeVisible({ timeout: 10000 });
  await other.getByRole("button", { name: "Aceitar convite" }).click();
  await expect(
    page.getByRole("button", { name: "Conversar", exact: true }),
  ).toBeVisible({ timeout: 10000 });
  await page.getByRole("button", { name: "Conversar", exact: true }).click();
  await other.getByRole("button", { name: "Conversar", exact: true }).click();
  await expect(page.getByLabel("Mensagem privada")).toBeEnabled();
  await expect(other.getByLabel("Mensagem privada")).toBeEnabled();
  await page
    .getByLabel("Mensagem privada")
    .fill("Conversa privada ponta a ponta 🔒");
  await page.getByLabel("Mensagem privada").press("Enter");
  await expect(
    other.getByText("Conversa privada ponta a ponta 🔒", { exact: true }),
  ).toBeVisible({ timeout: 10000 });
  await other.getByLabel("Mensagem privada").fill("Resposta protegida");
  await other.getByRole("button", { name: "Enviar mensagem" }).click();
  await expect(
    page.getByText("Resposta protegida", { exact: true }),
  ).toBeVisible({ timeout: 10000 });
  await page.getByText("Código de segurança", { exact: true }).click();
  await other.getByText("Código de segurança", { exact: true }).click();
  expect(await page.locator(".safety-code").textContent()).toEqual(
    await other.locator(".safety-code").textContent(),
  );
  const friends = await (await page.request.get("/api/backend/friends")).json();
  const stored = await (
    await page.request.get(`/api/backend/friends/${friends[0].id}/messages`)
  ).json();
  expect(JSON.stringify(stored)).not.toContain("Resposta protegida");
  expect(stored[0].ciphertext).toBeTruthy();
  await page
    .getByRole("button", { name: `Ver perfil de ${b}`, exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("dialog", { name: `Perfil de ${b}` }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "../../.local/friends-mobile.png",
    fullPage: true,
  });
  await page.reload();
  await page.getByRole("button", { name: "Conversar", exact: true }).click();
  await expect(
    page.getByText("Resposta protegida", { exact: true }),
  ).toBeVisible();
  await peer.close();
});
