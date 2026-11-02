import { test } from "./student-fixture";
import { expect } from "@playwright/test";
import { authenticate } from "./session";
import { randomUUID } from "node:crypto";
import pg from "pg";

const backend = process.env.E2E_API_URL ?? "http://localhost:8080";
test.use({
  permissions: ["microphone"],
  launchOptions: {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
  },
});

test("auth loop follows all themes without replacing its player", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/login");
  const film = page.locator(".auth-film");
  await expect(film.locator("[data-brand-book]")).toBeVisible();
  await film.evaluate((node) => node.setAttribute("data-continuity", "kept"));
  const buttons = page.locator(".auth-theme-control button");
  const boxes = await buttons.evaluateAll((nodes) =>
    nodes.map((n) => n.getBoundingClientRect().y),
  );
  expect(Math.max(...boxes) - Math.min(...boxes)).toBeLessThan(2);
  for (const theme of ["Claro", "Escuro", "Enturma", "Sistema"]) {
    await buttons.filter({ hasText: theme }).click();
    await expect(buttons.filter({ hasText: theme })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(film).toHaveAttribute("data-continuity", "kept");
    if (theme === "Enturma")
      await expect(page.locator("html")).toHaveAttribute(
        "data-palette",
        "enturma",
      );
    else
      await expect(page.locator("html")).not.toHaveAttribute(
        "data-palette",
        "enturma",
      );
    const colors = await film.evaluate((el) => {
      const scene =
        el.querySelector("[data-brand-book]")!.parentElement!.parentElement!;
      return [
        getComputedStyle(scene).color,
        getComputedStyle(scene).backgroundColor,
      ];
    });
    expect(colors[0]).not.toBe(colors[1]);
    if (theme === "Enturma") expect(colors[1]).toBe("rgb(22, 55, 43)");
    // Inspect actual foregrounds, not just the scene's inherited color. Legacy
    // auth descendant rules used to paint these dark green in every theme.
    const foregrounds = page.locator(
      ".auth-story-top .enturma-app-mark, .auth-film .enturma-app-mark, .auth-film strong, .auth-film svg.lucide-message-circle, .auth-film svg.lucide-book-open",
    );
    const dark =
      (await page.locator("html").getAttribute("data-theme")) === "dark";
    const expectedInk =
      theme === "Enturma"
        ? "rgb(242, 248, 239)"
        : dark
          ? "rgb(242, 246, 244)"
          : "rgb(23, 63, 54)";
    await expect
      .poll(() =>
        foregrounds.evaluateAll((nodes) =>
          nodes.map((node) => getComputedStyle(node).color),
        ),
      )
      .toEqual(Array(7).fill(expectedInk));
    await page.screenshot({
      path: info.outputPath(`auth-${theme}.png`),
      fullPage: true,
    });
  }
});

test("two accounts acknowledge private and room messages, with compact themed composers", async ({
  page,
  browser,
  request,
}, info) => {
  test.setTimeout(150000);
  const db = new pg.Client({ connectionString: process.env.E2E_DATABASE_URL });
  await db.connect();
  expect((await db.query("SELECT current_database() name")).rows[0].name).toBe(
    "enturma_e2e",
  );
  const otherContext = await browser.newContext();
  const other = await otherContext.newPage();
  try {
    async function register() {
      const username = `receipt_${randomUUID().slice(0, 8)}`;
      const response = await request.post(`${backend}/api/v1/auth/register`, {
        data: {
          name: username,
          username,
          email: `${username}@example.test`,
          password: "abc123",
          device: "E2E",
        },
      });
      expect(response.ok()).toBe(true);
      const credentials = await response.json();
      await db.query("UPDATE app_user SET email_verified=true WHERE id=$1", [
        credentials.userId,
      ]);
      return {
        ...credentials,
        username,
        headers: { Authorization: `Bearer ${credentials.accessToken}` },
      };
    }
    const a = await register(),
      b = await register();
    const invite = await request.post(`${backend}/api/v1/friends`, {
      headers: a.headers,
      data: { username: b.username },
    });
    expect(invite.ok()).toBe(true);
    const friendship = (await invite.json()).id;
    expect(
      (
        await request.post(`${backend}/api/v1/friends/${friendship}/accept`, {
          headers: b.headers,
        })
      ).ok(),
    ).toBe(true);
    await authenticate(page.context(), a);
    await authenticate(otherContext, b);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await other.emulateMedia({ reducedMotion: "reduce" });
    let holdDelivery = true;
    await other.route("**/messages/receipts", (route) =>
      holdDelivery ? route.abort() : route.continue(),
    );
    await other.goto("/friends");
    await page.goto("/friends");
    await page.getByRole("button", { name: "Conversar", exact: true }).click();
    const input = page.getByLabel("Mensagem privada", { exact: true });
    await expect(input).toBeEnabled();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(
      page.getByRole("button", { name: "Gravar mensagem de voz" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Enviar mensagem", exact: true }),
    ).toHaveCount(0);
    const text = `Confirmação privada ${randomUUID()}`;
    await input.fill(text);
    await expect(
      page.getByRole("button", { name: "Gravar mensagem de voz" }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Enviar mensagem", exact: true })
      .click();
    const sent = page.locator("article.mine").filter({ hasText: text });
    await expect(
      sent.getByRole("img", { name: "Enviada", exact: true }),
    ).toBeVisible();
    holdDelivery = false;
    await other.evaluate(() =>
      window.dispatchEvent(new Event("enturma-live-resync")),
    );
    await expect(
      sent.getByRole("img", { name: "Entregue", exact: true }),
    ).toBeVisible({ timeout: 20000 });
    await other.bringToFront();
    await other.getByRole("button", { name: "Conversar", exact: true }).click();
    await expect(
      other
        .getByRole("region", { name: "Conversa privada" })
        .getByText(text, { exact: true }),
    ).toBeVisible();
    await expect(
      sent.getByRole("img", { name: "Lida", exact: true }),
    ).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: info.outputPath("private-read-mobile.png") });

    const subject = (
      await db.query(
        "SELECT s.id,s.parent_id FROM academic_entry s JOIN academic_entry p ON p.id=s.parent_id WHERE s.kind='SUBJECT' AND s.status='VERIFIED' AND p.status='VERIFIED' LIMIT 1",
      )
    ).rows[0];
    for (const account of [a, b])
      expect(
        (
          await request.put(`${backend}/api/v1/users/me/enrollment`, {
            headers: account.headers,
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
      headers: a.headers,
      data: {
        subjectId: subject.id,
        title: "Recebimento e temas",
        minutes: 50,
        maxParticipants: 10,
      },
    });
    expect(created.ok()).toBe(true);
    const room = await created.json();
    expect(
      (
        await request.post(`${backend}/api/v1/study-rooms/${room.id}/join`, {
          headers: b.headers,
        })
      ).ok(),
    ).toBe(true);
    await page.setViewportSize({ width: 1440, height: 950 });
    await page.goto(`/rooms/${room.id}`);
    await other.goto(`/rooms/${room.id}`);
    await page
      .getByLabel("Mensagem", { exact: true })
      .fill("Uma mensagem para nossa turma https://example.org");
    await page
      .getByRole("button", { name: "Enviar mensagem", exact: true })
      .click();
    await other.bringToFront();
    const roomMessage = page
      .locator(".persistent-message.mine")
      .filter({ hasText: "Uma mensagem para nossa turma" });
    await expect(
      other
        .locator(".persistent-message")
        .filter({ hasText: "Uma mensagem para nossa turma" }),
    ).toBeVisible();
    await other.getByLabel("Mensagem", { exact: true }).click();
    await expect(
      roomMessage.getByRole("img", { name: "Lida", exact: true }),
    ).toBeVisible({ timeout: 20000 });
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 950 });
      for (const theme of ["light", "dark", "enturma"]) {
        await page.evaluate((theme) => {
          document.documentElement.dataset.theme =
            theme === "light" ? "light" : "dark";
          document.documentElement.dataset.palette =
            theme === "enturma" ? "enturma" : "";
        }, theme);
        const composer = page.locator(".persistent-composer");
        await expect
          .poll(async () => {
            const box = (await composer
              .locator(".composer-main-row")
              .boundingBox())!;
            const messageBox = (await roomMessage.boundingBox())!;
            return box.y - messageBox.y - messageBox.height;
          })
          .toBeLessThan(48);
        const microphone = composer.getByRole("button", {
          name: "Gravar mensagem de voz",
        });
        const iconBox = (await microphone.locator("svg").boundingBox())!;
        expect(iconBox.width).toBeGreaterThanOrEqual(18);
        expect(iconBox.height).toBeGreaterThanOrEqual(18);
        await page.screenshot({
          path: info.outputPath(`composer-${theme}-${width}.png`),
        });
        await microphone.click();
        await expect(composer.getByRole("status")).toContainText(
          "Gravando · 0:01",
        );
        for (const name of ["Descartar áudio", "Parar e ouvir áudio"]) {
          const icon = composer.getByRole("button", { name }).locator("svg");
          expect((await icon.boundingBox())!.width).toBeGreaterThanOrEqual(18);
        }
        expect(
          await composer.getByLabel("Mensagem", { exact: true }).isVisible(),
        ).toBe(false);
        const row = (await composer
          .locator(".composer-main-row")
          .boundingBox())!;
        const panel = (await composer
          .locator(".voice-record-panel")
          .boundingBox())!;
        expect(panel.y).toBeGreaterThanOrEqual(row.y);
        expect(panel.y + panel.height).toBeLessThanOrEqual(row.y + row.height);
        await page.screenshot({
          path: info.outputPath(`recording-${theme}-${width}.png`),
        });
        await composer
          .getByRole("button", { name: "Parar e ouvir áudio" })
          .click();
        await expect(
          composer.getByLabel("Ouvir áudio antes de enviar"),
        ).toBeVisible();
        await page.screenshot({
          path: info.outputPath(`voice-preview-${theme}-${width}.png`),
        });
        await composer.getByRole("button", { name: "Descartar áudio" }).click();
        await composer
          .getByRole("button", { name: "Adicionar emoji", exact: true })
          .click();
        const library = page.getByRole("dialog", {
          name: "Emojis, figurinhas e GIFs",
        });
        const tab = library.getByRole("tab", { name: "GIFs", exact: true });
        const color = await tab.evaluate((el) => getComputedStyle(el).color);
        if (theme !== "light") expect(color).not.toBe("rgb(24, 63, 54)");
        await page.screenshot({
          path: info.outputPath(`room-media-${theme}-${width}.png`),
        });
        await library
          .getByRole("button", { name: "Fechar biblioteca" })
          .click();
        await roomMessage
          .getByRole("link", { name: "https://example.org", exact: true })
          .click();
        const confirmation = page.getByRole("dialog", {
          name: "Você está saindo do Enturma",
        });
        expect(
          await confirmation.evaluate(
            (el) => el.parentElement === document.body,
          ),
        ).toBe(true);
        const colors = await confirmation.evaluate((el) => [
          getComputedStyle(el).color,
          getComputedStyle(el).backgroundColor,
        ]);
        expect(colors[0]).not.toBe(colors[1]);
        await page.screenshot({
          path: info.outputPath(`external-${theme}-${width}.png`),
        });
        await confirmation
          .getByRole("button", { name: "Ficar no Enturma" })
          .click();
      }
    }
  } finally {
    await otherContext.close();
    await db.end();
  }
});
