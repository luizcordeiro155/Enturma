import { test } from "./student-fixture";
import { expect, type Page, type APIRequestContext } from "@playwright/test";
import { authenticate } from "./session";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";

async function register(page: Page, request: APIRequestContext) {
  const username = `ui_${randomUUID().slice(0, 8)}`;
  const response = await request.post(
    `${process.env.E2E_API_URL ?? "http://localhost:8080"}/api/v1/auth/register`,
    {
      data: {
        name: "Estudante de interface",
        username,
        email: `${username}@example.test`,
        password: "Interface-test-12345",
        device: "E2E",
      },
    },
  );
  expect(response.ok()).toBeTruthy();
  await authenticate(page.context(), await response.json());
  return username;
}

test("emoji picker follows the mobile keyboard viewport without blurring the composer", async ({ browser, request, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  try {
    await register(page, request);
    await page.goto("/notebooks");
    await page.getByLabel("Nome do caderno").fill("Emojis e teclado");
    await page.getByRole("button", { name: "Criar caderno", exact: true }).click();
    await expect(page).toHaveURL(/notebooks\/[a-f0-9-]+/);
    await expect(page.locator(".enturma-launch-overlay")).toHaveCount(0);
    await page.evaluate(() => {
      document.documentElement.style.setProperty("--native-safe-top", "24px");
    });
    const input = page.getByLabel("Mensagem para o Enturma APP");
    await input.fill("Estudando ");
    await input.evaluate(node => {
      node.dataset.blurCount = "0";
      node.addEventListener("blur", () => { node.dataset.blurCount = String(Number(node.dataset.blurCount) + 1); });
    });
    // Headless browsers have no software keyboard. Exercise Android's resized
    // viewport geometry and real touch/focus events, without pretending to test an IME.
    await page.setViewportSize({ width: 390, height: 480 });
    await page.getByRole("button", { name: "Adicionar emoji" }).tap();
    const picker = page.getByRole("dialog", { name: "Emojis, figurinhas e GIFs" });
    await expect(picker).toBeVisible();
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute("data-blur-count", "0");
    const fits = async () => {
      const panel = await picker.boundingBox();
      const composer = await page.locator(".notebook-question").boundingBox();
      return !!panel && !!composer && panel.y >= 35 && panel.y + panel.height <= composer.y - 6 && panel.x >= 0 && panel.x + panel.width <= page.viewportSize()!.width;
    };
    await expect.poll(fits).toBe(true);
    await page.emulateMedia({ colorScheme: "dark" });
    await page.screenshot({ path: join(tmpdir(), "enturma-emoji-mobile-dark.png") });
    await page.setViewportSize({ width: 360, height: 420 });
    await expect.poll(fits).toBe(true);
    await expect(input).toBeFocused();
    const grid = picker.locator(".emoji-grid");
    const box = (await grid.boundingBox())!;
    const touch = await context.newCDPSession(page);
    const x = box.x + 24, startY = box.y + box.height - 8;
    await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: startY }] });
    for (let step = 1; step <= 5; step++) {
      await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: startY - step * 10 }] });
      await page.waitForTimeout(20);
    }
    await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(() => grid.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
    await expect(input).toBeFocused();
    await touch.detach();
    await picker.getByRole("button", { name: "Animais e natureza", exact: true }).tap();
    await expect(input).toBeFocused();
    await picker.locator(".emoji-grid button").first().tap();
    await expect(picker).toHaveCount(0);
    await expect(input).toBeFocused();
    await expect(input).not.toHaveValue("Estudando ");
    await expect(input).toHaveAttribute("data-blur-count", "0");
    await page.getByRole("button", { name: "Adicionar emoji" }).tap();
    const search = picker.getByRole("searchbox", { name: "Pesquisar emoji" });
    await search.fill("sorriso");
    await expect(search).toBeFocused();
    await picker.getByRole("button", { name: "Fechar biblioteca" }).tap();
    await expect(input).toBeFocused();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Adicionar emoji" }).tap();
    await expect.poll(fits).toBe(true);
    await page.emulateMedia({ colorScheme: "light" });
    await page.screenshot({ path: join(tmpdir(), "enturma-emoji-mobile-light.png") });
    await page.keyboard.press("Escape");
    await expect(picker).toHaveCount(0);
    await expect(input).toBeFocused();
    await page.setViewportSize({ width: 1376, height: 900 });
    await page.getByRole("button", { name: "Adicionar emoji" }).focus();
    await page.keyboard.press("Enter");
    await expect(picker).toBeFocused();
    await expect.poll(fits).toBe(true);
    await page.keyboard.press("Tab");
    await expect(picker.getByRole("tab", { name: "Emoji", exact: true })).toBeFocused();
    await page.screenshot({ path: join(tmpdir(), "enturma-emoji-desktop.png") });
    await page.keyboard.press("Escape");
    await expect(picker).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});

test("notebook keeps the conversation and composer visible across themes, phone and keyboard", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await register(page, request);
  await page.goto("/notebooks");
  await page
    .getByLabel("Nome do caderno")
    .fill("Biologia · minhas fontes e perguntas");
  await page
    .getByRole("button", { name: "Criar caderno", exact: true })
    .click();
  await expect(page).toHaveURL(/notebooks\/[a-f0-9-]+/);
  await expect(page.locator(".enturma-launch-overlay")).toHaveCount(0);
  for (const theme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: theme });
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    for (const [width, height] of [
      [1487, 1058],
      [390, 844],
      [360, 640],
    ]) {
      await page.setViewportSize({ width, height });
      const send = page.getByRole("button", {
        name: "Enviar mensagem",
        exact: true,
      });
      await expect(send).toBeInViewport();
      await expect(
        page.getByRole("button", {
          name: /^(Ativar pesquisa na Web|Pesquisa na Web ativada|Pesquisa na Web indisponível)$/,
        }),
      ).toBeInViewport();
      await expect(
        page.getByRole("checkbox", { name: /Pesquisar/ }),
      ).toHaveCount(0);
      const composerHeight = await page
        .locator(".notebook-question .composer-main-row")
        .evaluate((node) => node.clientHeight);
      expect(composerHeight).toBeLessThan(85);
      await expect
        .poll(async () => {
          const box = (await send.boundingBox())!;
          return box.y + box.height;
        })
        .toBeLessThan(height - (width < 760 ? 70 : 5));
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(
        await page
          .locator(".notebook-conversation")
          .evaluate((node) => node.clientHeight),
      ).toBeGreaterThan(140);
      await expect(
        page.getByRole("button", {
          name: /Baixar material|Download|Baixar resposta/i,
        }),
      ).toHaveCount(0);
      await page.screenshot({
        path: join(tmpdir(), `enturma-chat-${theme}-${width}.png`),
      });
    }
  }
  await page.getByRole("button", { name: /^Fontes/ }).click();
  const sources = page.getByRole("dialog", { name: "Fontes do caderno" });
  await expect(sources).toBeVisible();
  await sources.getByRole("button", { name: "Texto", exact: true }).click();
  await sources.getByLabel("Título da fonte").fill("Respiração celular");
  await sources
    .getByLabel("Conteúdo para estudar")
    .fill(
      "A respiração celular transforma nutrientes em energia disponível para a célula.",
    );
  await sources
    .getByRole("button", { name: "Adicionar fonte", exact: true })
    .click();
  await expect(sources.getByLabel("Usar Respiração celular")).toBeChecked();
  await page.goBack();
  await expect(sources).toBeHidden();
  await page.getByRole("button", { name: "Ferramentas de estudo" }).click();
  await expect(
    page.getByRole("dialog", { name: "Ferramentas de estudo" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Gerenciar caderno" }).click();
  await page.getByLabel("Renomear caderno").fill("Biologia para revisar");
  await page.getByRole("button", { name: "Salvar nome", exact: true }).click();
  await expect(page.locator(".notebook-title h1")).toHaveText(
    "Biologia para revisar",
  );
  await page.getByRole("button", { name: "Fechar configurações" }).click();
  const composer = page.getByLabel("Mensagem para o Enturma APP");
  // Native Android explicitly marks its IME context; a resized desktop pointer is still a desktop.
  await page.evaluate(() => {
    document.documentElement.dataset.enturmaMobile = "true";
  });
  await composer.fill("Como a célula usa essa energia?");
  await page.setViewportSize({ width: 390, height: 500 });
  await expect(page.locator("html")).toHaveAttribute(
    "data-enturma-text-input",
    "true",
  );
  await expect(composer).toBeInViewport();
  await expect(
    page.getByRole("button", { name: "Enviar mensagem", exact: true }),
  ).toBeInViewport();
  await composer.press("Enter");
  await expect(composer).toHaveValue("Como a célula usa essa energia?\n");
  await page.screenshot({ path: join(tmpdir(), "enturma-chat-keyboard.png") });
  expect(errors).toEqual([]);
});

test("profile badges are exclusive, removal is readable and the chosen colors flow", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const username = await register(page, request);
  const db = new pg.Client({ connectionString: process.env.E2E_DATABASE_URL });
  await db.connect();
  try {
    if (
      !(await db.query("SELECT current_database() name")).rows[0].name.includes(
        "e2e",
      )
    )
      throw Error("Only isolated E2E fixtures are allowed");
    const user = (
      await db.query("SELECT id FROM app_user WHERE username=$1", [username])
    ).rows[0].id;
    for (const [position, code] of ["FIRST_SPARK", "GAMES_10"].entries()) {
      await db.query(
        "INSERT INTO user_achievement(user_id,code,definition_version) VALUES ($1,$2,1) ON CONFLICT DO NOTHING",
        [user, code],
      );
      await db.query(
        "INSERT INTO profile_featured_badge(user_id,code,position) VALUES ($1,$2,$3)",
        [user, code, position],
      );
    }
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/profile");
    await page.getByRole("button", { name: /^Tema e identidade/ }).click();
    await page.getByLabel("Cor principal do perfil").fill("#ff0044");
    await page.getByRole("button", { name: "Aplicar", exact: true }).click();
    await page.getByRole("button", { name: /^Mural e movimento/ }).click();
    await page.getByLabel("Cor secundária", { exact: true }).fill("#2400e0");
    await page.getByLabel("Fundo decorativo").selectOption("GRADIENT");
    await page
      .getByRole("combobox", { name: "Efeito", exact: true })
      .selectOption("DOTS");
    await page.getByLabel("Movimento das cores").selectOption("FLOW");
    await page.getByRole("button", { name: "Aplicar", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const identity = page.locator(".profile-preview-identity");
    const river = identity.locator("[data-river-current]").first();
    await expect(river).toBeVisible();
    const gradient = await river.evaluate(
      (node) => getComputedStyle(node).backgroundImage,
    );
    expect(gradient).toContain("rgb(255, 0, 68)");
    expect(gradient).toContain("rgb(36, 0, 224)");
    await expect
      .poll(() => river.evaluate((node) => node.getAnimations()[0]?.playState))
      .toBe("running");
    // Sample the color field at two points on the real WAAPI timeline.
    const frames = await river.evaluate((node) => {
      const animation = node.getAnimations()[0];
      animation.pause();
      animation.currentTime = 0;
      const first = getComputedStyle(node).transform;
      animation.currentTime = 9000;
      const second = getComputedStyle(node).transform;
      animation.play();
      return [first, second];
    });
    expect(frames[0]).not.toBe(frames[1]);
    for (const time of [0, 9000]) {
      await identity
        .locator("[data-river-current]")
        .evaluateAll((nodes, time) => {
          nodes.forEach((node) =>
            node.getAnimations().forEach((animation) => {
              animation.pause();
              animation.currentTime = time;
            }),
          );
        }, time);
      await identity.screenshot({
        path: join(tmpdir(), `enturma-river-${time}.png`),
      });
    }
    expect(
      await identity
        .locator(".profile-color-dots")
        .evaluate((node) => node.getAnimations().length),
    ).toBe(0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect
      .poll(() => river.evaluate((node) => node.getAnimations().length))
      .toBe(0);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const badges = identity.locator(".profile-achievement-badge > summary");
    await badges.nth(0).click();
    await expect(
      identity.locator("details[open][data-achievement-disclosure]"),
    ).toHaveCount(1);
    await badges.nth(1).click();
    await expect(
      identity.locator("details[open][data-achievement-disclosure]"),
    ).toHaveCount(1);
    await expect(
      identity.locator(".profile-achievement-badge").nth(0),
    ).not.toHaveAttribute("open");
    await page.keyboard.press("Escape");
    await expect(
      page.locator("details[open][data-achievement-disclosure]"),
    ).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Ver prévia", exact: true }).click();
    await page.getByRole("button", { name: "Perfil", exact: true }).click();
    await badges.nth(0).click();
    await badges.nth(1).click();
    await expect(
      identity.locator("details[open][data-achievement-disclosure]"),
    ).toHaveCount(1);
    await expect(
      identity.locator(".profile-achievement-badge").nth(0),
    ).not.toHaveAttribute("open");
    await page.screenshot({ path: join(tmpdir(), "enturma-badge-mobile.png") });
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Editar", exact: true }).click();
    for (const theme of ["dark", "light"] as const) {
      await page.emulateMedia({ colorScheme: theme });
      await page.getByRole("button", { name: /^Widgets do mural/ }).click();
      const dialog = page.getByRole("dialog", {
        name: "Widgets do mural",
        exact: true,
      });
      if (!(await dialog.locator(".widget-editor-row").count()))
        await dialog.getByLabel("Adicionar widget").selectOption("SUBJECTS");
      const remove = dialog
        .getByRole("button", { name: "Remover", exact: true })
        .first();
      await expect(remove).toBeVisible();
      const colors = await remove.evaluate((node) => {
        const style = getComputedStyle(node);
        const luminance = (value: string) => {
          const rgb = value
            .match(/[\d.]+/g)!
            .slice(0, 3)
            .map(Number)
            .map((v) => {
              const n = v / 255;
              return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
            });
          return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
        };
        const a = luminance(style.color),
          b = luminance(style.backgroundColor);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      });
      expect(colors).toBeGreaterThan(4.5);
      expect(
        await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth),
      ).toBe(true);
      await page.screenshot({
        path: join(tmpdir(), `enturma-widget-remove-${theme}.png`),
      });
      const before = await dialog.locator(".widget-editor-row").count();
      await remove.click();
      await expect(dialog.locator(".widget-editor-row")).toHaveCount(
        before - 1,
      );
      await dialog
        .getByRole("button", { name: "Cancelar", exact: true })
        .click();
    }
    expect(errors).toEqual([]);
  } finally {
    await db.end();
  }
});
