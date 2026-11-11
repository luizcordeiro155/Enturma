import { test } from "./student-fixture";
import { expect } from "@playwright/test";
import { authenticate } from "./session";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const backend = process.env.E2E_API_URL ?? "http://localhost:8080";
test("mobile cards, navigation and transparent renewal preserve the document", async ({
  page,
  request,
}, info) => {
  const email = `mobile-${randomUUID()}@example.test`;
  const registration = await request.post(`${backend}/api/v1/auth/register`, {
    data: {
      name: "Estudante mobile",
      username: `m_${randomUUID().slice(0, 8)}`,
      email,
      password: "abc123",
      device: "E2E",
    },
  });
  expect(registration.ok()).toBe(true);
  const credentials = await registration.json();
  const headers = { Authorization: `Bearer ${credentials.accessToken}` };
  const db = new pg.Client({ connectionString: process.env.E2E_DATABASE_URL });
  await db.connect();
  try {
    expect(
      (await db.query("SELECT current_database() name")).rows[0].name,
    ).toBe("enturma_e2e");
    const subject = (
      await db.query(
        "SELECT s.id,s.parent_id FROM academic_entry s JOIN academic_entry p ON p.id=s.parent_id WHERE s.kind='SUBJECT' AND s.status='VERIFIED' AND p.status='VERIFIED' LIMIT 1",
      )
    ).rows[0];
    await db.query("UPDATE app_user SET email_verified=true WHERE id=$1", [
      credentials.userId,
    ]);
    expect(
      (
        await request.put(`${backend}/api/v1/users/me/enrollment`, {
          headers,
          data: {
            periodId: subject.parent_id,
            subjectIds: [subject.id],
            shift: "EVENING",
            preferences: "",
          },
        })
      ).ok(),
    ).toBe(true);
    const created = await request.post(`${backend}/api/v1/study-rooms`, {
      headers,
      data: {
        subjectId: subject.id,
        title:
          "Uma sala com um assunto bastante longo para estudar em companhia",
        minutes: 50,
        days: 1,
        maxParticipants: 10,
      },
    });
    expect(created.ok()).toBe(true);
    const room = await created.json();
    await authenticate(page.context(), credentials);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/home");
    await expect(page.locator(".enturma-launch-overlay")).toHaveCount(0, {
      timeout: 15000,
    });
    await page
      .getByPlaceholder("Busque pelo assunto ou objetivo")
      .fill("Uma sala com um assunto bastante longo");
    const card = page
      .locator(".dashboard-community .room-row")
      .filter({ hasText: "Uma sala com um assunto bastante longo" });
    await expect(card).toBeVisible();
    const cardBox = (await card.boundingBox())!,
      buttonBox = (await card
        .getByRole("button", { name: "Entrar na turma" })
        .boundingBox())!;
    expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(
      cardBox.x + cardBox.width - 10,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    const nav = page.getByRole("navigation", { name: "Navegação mobile" });
    await expect(nav.getByRole("link", { name: "Amigos" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Perfil" })).toHaveCount(0);
    await nav.getByRole("button", { name: "Mais opções" }).click();
    const menu = page.getByRole("dialog", { name: "Mais opções do Enturma" });
    expect(
      (await menu.getByRole("link").allTextContents()).map((t) => t.trim()),
    ).toEqual([
      "Desafios acadêmicos",
      ...((
        await (
          await request.get(`${backend}/api/v1/learning/access`, { headers })
        ).json()
      ).eligible
        ? ["Programação"]
        : []),
      "Cadernos IA",
      "Caronas",
      "Portfólio acadêmico",
      "Perfil",
      "Baixar o Enturma",
      "Configurações",
    ]);
    await menu.getByRole("button", { name: "Fechar menu" }).click();
    await page.screenshot({
      path: info.outputPath("home-mobile.png"),
      fullPage: true,
    });
    await page.evaluate(() => {
      (window as Window & { navigationProbe?: number }).navigationProbe = 7;
    });
    await page.context().clearCookies({ name: "enturma_access" });
    await nav.getByRole("link", { name: "Salas", exact: true }).click();
    await expect(page).toHaveURL(/\/rooms$/);
    expect(
      await page.evaluate(
        () => (window as Window & { navigationProbe?: number }).navigationProbe,
      ),
    ).toBe(7);
    await expect(page.locator(".enturma-launch-overlay")).toHaveCount(0);
    const cookie = (await page.context().cookies()).find(
      (c) => c.name === "enturma_refresh",
    )!;
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.expires - Date.now() / 1000).toBeGreaterThan(29 * 86400);
    await page.goto(`/rooms/${room.id}`);
    const message = `Mensagem legível ${randomUUID()}`;
    await page.getByLabel("Mensagem", { exact: true }).fill(message);
    await page
      .getByRole("button", { name: "Enviar mensagem", exact: true })
      .click();
    await page.setViewportSize({ width: 1440, height: 950 });
    await page.getByRole("button", { name: "Chamada", exact: true }).click();
    for (const theme of ["light", "dark"]) {
      await page.locator(".topbar .theme-picker").hover();
      await page
        .getByRole("menuitemradio", {
          name: theme === "light" ? "Claro" : "Escuro",
          exact: true,
        })
        .click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const pane = page.locator(".call-chat-pane");
      await expect(
        pane.getByText(message, { exact: true }).last(),
      ).toBeVisible();
      const colors = await pane.evaluate((el) => ({
        ink: getComputedStyle(el).color,
        bg: getComputedStyle(el).backgroundColor,
      }));
      expect(colors.ink).not.toBe(colors.bg);
      if (theme === "light") expect(colors.ink).not.toBe("rgb(238, 245, 242)");
      const composer = pane.locator(".composer-main-row");
      const input = (await composer.locator("textarea").boundingBox())!;
      expect(input.width).toBeGreaterThanOrEqual(90);
      expect(input.height).toBeLessThanOrEqual(60);
      expect(
        await composer.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      ).toBe(true);
      const author = pane
        .locator(
          ".persistent-message.mine .message-content header .identity-trigger strong",
        )
        .last();
      const nameBox = (await author.boundingBox())!;
      expect(nameBox.width).toBeGreaterThanOrEqual(100);
      expect(nameBox.height).toBeLessThanOrEqual(24);
      await composer
        .getByRole("button", { name: "Adicionar emoji", exact: true })
        .click();
      const library = page.getByRole("dialog", {
        name: "Emojis, figurinhas e GIFs",
      });
      await expect(
        library.getByRole("tab", { name: "Figurinhas", exact: true }),
      ).toBeVisible();
      await expect(
        library.getByRole("tab", { name: "GIFs", exact: true }),
      ).toBeVisible();
      await library.getByRole("button", { name: "Fechar biblioteca" }).click();
      await page.screenshot({
        path: info.outputPath(`call-${theme}.png`),
        fullPage: true,
      });
    }
  } finally {
    await db.end();
  }
});

test("screen quality dialog keeps checkbox labels inside mobile and desktop surfaces", async ({
  page,
}, info) => {
  const markup = execFileSync(
    process.execPath,
    [resolve("e2e/render-share-dialog.mjs")],
    { encoding: "utf8" },
  );
  await page.goto("/login");
  // Layout-only fixture uses the actual shared component, with production CSS.
  await page.evaluate((markup) => {
    const node = document.createElement("div");
    node.id = "share-layout-fixture";
    node.className = "room-tools";
    node.innerHTML = `<div class="room-tool-card"><div class="call-panel"><div class="discord-call">${markup}</div></div></div>`;
    document.body.append(node);
    node.querySelector("dialog")!.showModal();
  }, markup);
  for (const width of [360, 1440])
    for (const theme of ["light", "dark"]) {
      await page.setViewportSize({ width, height: 800 });
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
      }, theme);
      const dialog = page.locator("#share-layout-fixture dialog");
      expect(
        await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      ).toBe(true);
      for (const label of await dialog.locator(".share-audio").all()) {
        const input = (await label.locator("input").boundingBox())!,
          text = (await label.locator("span").boundingBox())!;
        expect(input.width).toBeLessThanOrEqual(24);
        expect(text.width).toBeGreaterThan(180);
      }
      await page.screenshot({
        path: info.outputPath(`share-${width}-${theme}.png`),
      });
    }
});
