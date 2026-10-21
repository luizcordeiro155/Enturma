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
