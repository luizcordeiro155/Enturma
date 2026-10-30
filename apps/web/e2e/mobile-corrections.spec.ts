import { test } from "./student-fixture";
import { expect } from "@playwright/test";
import { authenticate } from "./session";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ScreenShareDialog } from "../src/components/screen-share-dialog";

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
      "Programação",
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
    await page
      .getByLabel("Mensagem", { exact: true })
      .fill("Mensagem legível no modo claro");
    await page
      .getByRole("button", { name: "Enviar mensagem", exact: true })
      .click();
    await page.setViewportSize({ width: 1440, height: 950 });
    await page.getByRole("button", { name: "Chamada", exact: true }).click();
    for (const theme of ["light", "dark"]) {
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
      }, theme);
      const pane = page.locator(".call-chat-pane");
      await expect(
        pane.getByText("Mensagem legível no modo claro", { exact: true }),
      ).toBeVisible();
      const colors = await pane.evaluate((el) => ({
        ink: getComputedStyle(el).color,
        bg: getComputedStyle(el).backgroundColor,
      }));
      expect(colors.ink).not.toBe(colors.bg);
      if (theme === "light") expect(colors.ink).not.toBe("rgb(238, 245, 242)");
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
  const noop = () => {};
  const markup = renderToStaticMarkup(
    createElement(ScreenShareDialog, {
      resolution: "1440p",
      fps: 60,
      audio: false,
      noiseSuppression: true,
      sharing: false,
      busy: false,
      error: "",
      onResolution: noop,
      onFps: noop,
      onAudio: noop,
      onNoiseSuppression: noop,
      onClose: noop,
      onShare: noop,
    }),
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
