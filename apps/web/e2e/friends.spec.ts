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
  await expect(page.locator(".public-profile-card")).toHaveCount(1);
  await expect(page.locator(".profile-details-editor form")).toHaveCount(1);
  const png = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#d04060";
    ctx.fillRect(0, 0, 300, 400);
    ctx.fillStyle = "#208050";
    ctx.fillRect(300, 0, 300, 400);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  for (const [label, kind, width, height] of [
    ["Foto de perfil", "avatar", 512, 512],
    ["Banner", "banner", 1500, 500],
  ] as const) {
    await page.getByLabel(label, { exact: true }).setInputFiles({
      name: "crop.png",
      mimeType: "image/png",
      buffer: Buffer.from(png, "base64"),
    });
    const crop = page.getByRole("dialog", {
      name: kind === "avatar" ? "Editar foto de perfil" : "Editar banner",
    });
    await expect(crop).toBeVisible();
    await crop.getByLabel("Zoom", { exact: true }).fill("1.5");
    await crop.getByLabel("Posição horizontal").fill("75");
    if (kind === "avatar")
      await page.screenshot({ path: "../../.local/profile-crop.png" });
    await crop.getByRole("button", { name: "Aplicar recorte" }).click();
    await expect(crop).not.toBeVisible();
    await expect(
      page.getByRole("status").filter({ hasText: "Imagem atualizada" }),
    ).toBeVisible();
    const dimensions = await page.evaluate(async (type) => {
      const me = await (await fetch("/api/backend/users/me")).json();
      const blob = await (
        await fetch(`/api/backend/users/${me.id}/${type}?test=${Date.now()}`)
      ).blob();
      const bitmap = await createImageBitmap(blob);
      return [bitmap.width, bitmap.height];
    }, kind);
    expect(dimensions).toEqual([width, height]);
  }
  await page.getByLabel("Cor do perfil", { exact: true }).fill("#b328ac");
  await expect(page.locator(".public-profile-card")).toHaveCSS(
    "border-top-color",
    "rgb(179, 40, 172)",
  );
  await page.getByLabel("Status personalizado").fill("Estudando JavaScript");
  await page
    .getByRole("combobox", { name: "Decoração do avatar" })
    .selectOption("RING");
  await page.getByRole("button", { name: "Salvar perfil" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Personalização salva" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator(".public-profile-card")).toHaveCSS(
    "border-top-color",
    "rgb(179, 40, 172)",
  );
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
  const anchor = await page
    .getByRole("button", { name: `Ver perfil de ${b}`, exact: true })
    .first()
    .boundingBox();
  const popover = await page
    .getByRole("dialog", { name: `Perfil de ${b}` })
    .boundingBox();
  expect(popover!.x).toBeGreaterThan(0);
  expect(
    Math.min(
      Math.abs(popover!.x - (anchor!.x + anchor!.width)),
      Math.abs(popover!.x + popover!.width - anchor!.x),
    ),
  ).toBeLessThan(30);
  await page.screenshot({ path: "../../.local/profile-popover.png" });
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: `Ver perfil de ${b}`, exact: true })
    .first()
    .click();
  const mobilePopover = page.getByRole("dialog", { name: `Perfil de ${b}` });
  await expect(mobilePopover).toBeVisible();
  const mobileBounds = await mobilePopover.boundingBox();
  expect(mobileBounds!.x).toBeGreaterThanOrEqual(0);
  expect(mobileBounds!.x + mobileBounds!.width).toBeLessThanOrEqual(390);
  await page.keyboard.press("Escape");
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
