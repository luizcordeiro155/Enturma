import { authenticate, authenticateWithPassword } from "./session";
import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
test("amizade, perfil público e conversa ponta a ponta entre dois navegadores", async ({
  page,
  browser,
  request,
}) => {
  test.setTimeout(90000);
  const tag = randomUUID().slice(0, 8),
    a = `alice_${tag}`,
    b = `bob_${tag}`;
  async function register(p: Page, name: string) {
    const response = await request.post(
      `${process.env.E2E_API_URL ?? "http://localhost:8080"}/api/v1/auth/register`,
      {
        data: {
          name,
          username: name,
          email: `${name}@example.test`,
          password: "E2E-password-long-123",
          device: "E2E",
        },
      },
    );
    expect(response.ok()).toBe(true);
    await authenticate(p.context(), await response.json());
  }

  async function initializeConversationKeys(p: Page) {
    await p.goto("/friends");
    await p.getByText("Chaves e backup das conversas").click();
    await expect(
      p.getByRole("button", { name: "Baixar backup cifrado" }),
    ).toBeEnabled();
  }
  await register(page, a);
  await page.goto("/profile");
  await expect(page.locator("html")).toHaveAttribute(
    "data-realtime",
    "connected",
    { timeout: 20000 },
  );
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
    await page
      .locator(".profile-media-action")
      .filter({ hasText: label })
      .locator('input[type="file"]')
      .setInputFiles({
        name: "crop.png",
        mimeType: "image/png",
        buffer: Buffer.from(png, "base64"),
      });
    const crop = page.getByRole("dialog", {
      name: kind === "avatar" ? "Ajustar foto de perfil" : "Ajustar banner",
    });
    await expect(crop).toBeVisible();
    await crop.getByLabel("Zoom", { exact: true }).fill("1.5");
    await crop.getByLabel("Horizontal", { exact: true }).fill("75");
    if (kind === "avatar")
      await page.screenshot({ path: "../../.local/profile-crop.png" });
    await crop.getByRole("button", { name: "Aplicar", exact: true }).click();
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
  await page
    .getByLabel("Cor principal do perfil", { exact: true })
    .fill("#b328ac");
  await expect
    .poll(() =>
      page
        .locator(".public-profile-card")
        .evaluate((el) =>
          getComputedStyle(el).getPropertyValue("--profile-accent").trim(),
        ),
    )
    .toBe("#b328ac");
  await page.getByLabel("Status personalizado").fill("Estudando JavaScript");
  await page
    .getByRole("combobox", { name: "Decoração do avatar" })
    .selectOption("RING");
  await page.getByRole("button", { name: "Salvar perfil" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Perfil salvo com sucesso." }),
  ).toBeVisible();
  await page.reload();
  await expect
    .poll(() =>
      page
        .locator(".public-profile-card")
        .evaluate((el) =>
          getComputedStyle(el).getPropertyValue("--profile-accent").trim(),
        ),
    )
    .toBe("#b328ac");
  await page.screenshot({
    path: "../../.local/profile-desktop.png",
    fullPage: true,
  });
  await initializeConversationKeys(page);

  const peer = await browser.newContext();
  const other = await peer.newPage();
  await register(other, b);
  await initializeConversationKeys(other);
  await expect(other.locator("html")).toHaveAttribute(
    "data-realtime",
    "connected",
    { timeout: 20000 },
  );
  await page.getByLabel("Adicionar pelo nome de usuário").fill(b);
  await page.getByRole("button", { name: "Enviar convite" }).click();
  await expect(
    other.getByRole("button", { name: "Aceitar convite" }),
  ).toBeVisible({ timeout: 10000 });
  await other.getByRole("button", { name: "Aceitar convite" }).click();
  await page.bringToFront();
  await expect(
    page.getByRole("button", { name: "Conversar", exact: true }),
  ).toBeVisible({ timeout: 10000 });
  let peerNotReady = true;
  await page.route("**/api/backend/friends/*/identity", (route) =>
    peerNotReady
      ? route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Chave ainda não ativada",
            code: "NOT_FOUND",
          }),
        })
      : route.continue(),
  );
  await page.getByRole("button", { name: "Conversar", exact: true }).click();
  await expect(
    page.getByText("Aguardando seu amigo", { exact: true }),
  ).toBeVisible();
  peerNotReady = false;

  await other.getByRole("button", { name: "Conversar", exact: true }).click();
  await expect(page.getByLabel("Mensagem privada")).toBeEnabled();
  await expect(other.getByLabel("Mensagem privada")).toBeEnabled();
  // Incoming refreshes must preserve the established key and the typed draft.
  await page.getByLabel("Mensagem privada").fill("Rascunho preservado");
  await page.evaluate(() =>
    window.dispatchEvent(new Event("enturma-live-ready")),
  );
  await expect(page.getByLabel("Mensagem privada")).toBeEnabled();
  await expect(page.getByLabel("Mensagem privada")).toHaveValue(
    "Rascunho preservado",
  );

  const notificationBadge = other.locator(".notification-count");
  const unreadBeforePrivateMessage = await notificationBadge
    .textContent()
    .then((value) => Number(value || 0))
    .catch(() => 0);
  await page
    .getByLabel("Mensagem privada")
    .fill("Conversa privada ponta a ponta 🔒");
  await page.getByLabel("Mensagem privada").press("Enter");
  await expect(
    other
      .locator(".private-messages")
      .getByText("Conversa privada ponta a ponta 🔒", { exact: true }),
  ).toBeVisible({ timeout: 10000 });
  await expect(
    other.getByRole("button", { name: "Nova mensagem · ir para ela" }),
  ).not.toBeVisible();
  // A message already visible at the bottom needs neither a local notice nor
  // an additional global notification. The accepted invitation may be unread.
  await expect
    .poll(async () =>
      (await other.locator(".notification-count").count())
        ? Number(
            (await other.locator(".notification-count").textContent()) || 0,
          )
        : 0,
    )
    .toBe(unreadBeforePrivateMessage);
  await other.goto("/home");
  await page
    .getByLabel("Mensagem privada")
    .fill(`Olá @${b}, confira a revisão`);
  await page.getByLabel("Mensagem privada").press("Enter");
  await other.getByRole("button", { name: /Notificações,.*não lidas/ }).click();
  const inbox = other.getByRole("dialog", { name: "Sua caixa de entrada" });
  await expect(inbox).toContainText(
    "Você foi mencionado em uma conversa privada.",
  );
  await inbox
    .getByRole("button")
    .filter({ hasText: "Você foi mencionado em uma conversa privada." })
    .click();
  await expect(other).toHaveURL(/friends\?chat=/);
  await expect(
    other
      .locator(".private-messages")
      .getByText(`Olá @${b}, confira a revisão`, { exact: true }),
  ).toBeVisible();
  await other.getByLabel("Mensagem privada").fill("Resposta protegida");
  await other.getByRole("button", { name: "Enviar mensagem" }).click();
  await expect(
    page
      .locator(".private-messages")
      .getByText("Resposta protegida", { exact: true }),
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
  const popover = await page
    .getByRole("dialog", { name: `Perfil de ${b}` })
    .boundingBox();
  const viewport = await page.evaluate(() => ({
    width: innerWidth,
    height: innerHeight,
  }));
  expect(popover!.x).toBeGreaterThanOrEqual(0);
  expect(popover!.y).toBeGreaterThanOrEqual(0);
  expect(popover!.x + popover!.width).toBeLessThanOrEqual(viewport.width);
  expect(popover!.y + popover!.height).toBeLessThanOrEqual(viewport.height);
  // O perfil público atual é um painel centralizado estilo Discord no desktop.
  // innerWidth/innerHeight refletem o layout viewport usado pelos 50% do CSS.
  await expect
    .poll(async () => {
      const bounds = await page
        .getByRole("dialog", { name: `Perfil de ${b}` })
        .boundingBox();
      return Math.abs(bounds!.x + bounds!.width / 2 - viewport.width / 2);
    })
    .toBeLessThan(16);
  await expect
    .poll(async () => {
      const bounds = await page
        .getByRole("dialog", { name: `Perfil de ${b}` })
        .boundingBox();
      return Math.abs(bounds!.y + bounds!.height / 2 - viewport.height / 2);
    })
    .toBeLessThan(16);
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
    page
      .locator(".private-messages")
      .getByText("Resposta protegida", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Voltar para conversas" }).click();
  const sync = page.locator("#private-sync");
  await sync
    .getByLabel("Senha das conversas", { exact: true })
    .fill("conversation-sync-secret-123");
  await sync
    .getByLabel("Confirmar senha das conversas")
    .fill("conversation-sync-secret-123");
  await sync.getByRole("button", { name: "Ativar sincronização" }).click();
  await expect(sync).toContainText("Sincronização ativa neste dispositivo");
  const vaultResponse = await page.request.get("/api/backend/private-vault");
  expect(await vaultResponse.text()).not.toContain(
    "conversation-sync-secret-123",
  );
  const clean = await browser.newContext();
  const fresh = await clean.newPage();
  await authenticateWithPassword(
    clean,
    request,
    `${a}@example.test`,
    "E2E-password-long-123",
  );
  await fresh.goto("/friends");
  await fresh.getByRole("button", { name: "Conversar", exact: true }).click();
  await expect(
    fresh.getByText("Sua chave precisa de atenção", { exact: true }),
  ).toBeVisible();
  await expect(fresh.getByLabel("Mensagem privada")).toBeDisabled();
  await fresh
    .getByRole("button", { name: "Desbloquear neste dispositivo" })
    .click();
  const unlock = fresh.locator("#private-sync");
  await unlock
    .getByLabel("Senha das conversas", { exact: true })
    .fill("wrong-conversation-password");
  await unlock
    .getByRole("button", { name: "Desbloquear conversas", exact: true })
    .click();
  await expect(unlock.getByRole("alert")).toContainText(
    "Confira a senha das conversas",
  );
  await expect(fresh.getByLabel("Mensagem privada")).not.toBeVisible();
  await unlock
    .getByLabel("Senha das conversas", { exact: true })
    .fill("conversation-sync-secret-123");
  await unlock
    .getByRole("button", { name: "Desbloquear conversas", exact: true })
    .click();
  await fresh.getByRole("button", { name: "Conversar", exact: true }).click();
  await expect(fresh.getByLabel("Mensagem privada")).toBeEnabled();
  await expect(
    fresh
      .locator(".private-messages")
      .getByText("Resposta protegida", { exact: true }),
  ).toBeVisible();
  await fresh.getByText("Código de segurança", { exact: true }).click();
  expect(await fresh.locator(".safety-code").textContent()).toEqual(
    await other.locator(".safety-code").textContent(),
  );
  await fresh
    .getByLabel("Mensagem privada")
    .fill("Enviado pelo novo dispositivo");
  await fresh.getByLabel("Mensagem privada").press("Enter");
  await other.bringToFront();
  await expect(
    other
      .locator(".private-messages")
      .getByText("Enviado pelo novo dispositivo", { exact: true }),
  ).toBeVisible({ timeout: 10000 });
  await fresh.reload();
  await fresh.getByRole("button", { name: "Conversar", exact: true }).click();
  await expect(fresh.getByLabel("Mensagem privada")).toBeEnabled();
  await expect(
    fresh
      .locator(".private-messages")
      .getByText("Resposta protegida", { exact: true }),
  ).toBeVisible();
  await clean.close();
  await peer.close();
});
