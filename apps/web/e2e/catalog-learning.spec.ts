import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
test("UNA Aimorés ADS: catálogo, jogos e acessibilidade", async ({
  page,
  request,
}) => {
  test.setTimeout(120000);
  const tag = randomUUID().slice(0, 8);
  await expect
    .poll(
      async () => {
        const r = await request.get(
          `${process.env.E2E_API_URL ?? "http://localhost:8080"}/api/v1/catalog/subjects?search=Matem%C3%A1tica%20computacional%20aplicada`,
        );
        return r.ok() ? (await r.json()).items.length : 0;
      },
      { timeout: 60000 },
    )
    .toBeGreaterThanOrEqual(3);
  await page.goto("/register");
  await page.getByLabel("Seu nome").fill("Teste catálogo UNA");
  await page.getByLabel("Nome de usuário").fill(`una_${tag}`);
  await page.getByLabel("E-mail").fill(`una_${tag}@example.test`);
  await page.getByLabel("Senha", { exact: true }).fill("E2E-test-password-123");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/onboarding/);
  await page.getByRole("button", { name: /Centro Universitário UNA/ }).click();
  await page.getByRole("button", { name: /Campus Sede Aimorés/ }).click();
  await page.getByLabel("Buscar no catálogo").fill("ADS");
  await page
    .getByRole("button", {
      name: /Análise e Desenvolvimento de Sistemas\s+Presencial/,
    })
    .click();
  await page.getByRole("button", { name: /E2A Radial · Presencial/ }).click();
  await page
    .getByRole("button", { name: /Fundamental · semestres 1–2/ })
    .click();
  await expect(
    page.getByText("Interação humano computador e UX", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Algoritmos e programação", { exact: false }),
  ).toBeVisible();
  await page
    .getByLabel(/Exploração digital e fundamentos tecnológicos/)
    .check();
  await page.getByLabel(/Matemática computacional aplicada/).check();
  await page.screenshot({
    path: "../../.local/una-onboarding.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Concluir perfil" }).click();
  await expect(page).toHaveURL(/home/);
  await page.getByRole("link", { name: "Praticar programação" }).click();
  await expect(
    page.getByRole("heading", { name: "Termo Dev", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Modo", exact: true })
    .selectOption("QUARTET");
  await page
    .getByRole("combobox", { name: "Dificuldade", exact: true })
    .selectOption("5");
  await page.getByRole("button", { name: "Iniciar nova rodada" }).click();
  await expect(page.locator(".word-board")).toHaveCount(4);
  const input = page.getByLabel("Palavra tentativa", { exact: true });
  const length = Number(await input.getAttribute("maxlength"));
  const vocabulary = (await (
    await page.request.get("/api/backend/learning/advanced/words/vocabulary")
  ).json()) as string[];
  const word = vocabulary.find((w) => w.length === length)!;
  await input.fill(word.toLowerCase());
  await expect(input).toHaveValue(word);
  await expect(
    page.locator(".word-board").first().locator(".word-row").first(),
  ).toHaveText(word);
  const responsePromise = page.waitForResponse(
    (r) =>
      r.url().endsWith("/words/attempt") && r.request().method() === "POST",
  );
  await input.press("Enter");
  expect((await responsePromise).ok()).toBe(true);
  await expect(input).toHaveValue("");
  await expect(
    page
      .locator(".word-board")
      .first()
      .locator(".word-row")
      .first()
      .locator(".correct, .present, .absent"),
  ).toHaveCount(length);
  await page
    .getByRole("button", { name: "Laboratório Binário", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Validar circuito" }),
  ).toBeVisible();
  const binary = await (
    await page.request.get("/api/backend/learning/advanced/binary/challenge")
  ).json();
  const bits = Number(binary.operands[0].decimal)
    .toString(2)
    .padStart(binary.bitWidth, "0");
  for (let i = 0; i < bits.length; i++)
    if (bits[i] === "1")
      await page
        .getByRole("button", {
          name: `Bit ${bits.length - i - 1}`,
          exact: true,
        })
        .click();
  await page.getByRole("button", { name: "Validar circuito" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Circuito resolvido" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Detetive de código", exact: true })
    .click();
  await page.getByLabel("Resultado de console.log").fill("6");
  await page.getByRole("button", { name: "Testar hipótese" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Desafio concluído" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Rota do Algoritmo", exact: true })
    .click();
  const challenge = await page.request.get(
    "/api/backend/learning/advanced/algorithm/challenge?level=1",
  );
  expect(challenge.ok()).toBe(true);
  const { walls } = await challenge.json();
  const queue: [number, string[]][] = [[0, []]];
  const seen = new Set([0]);
  let program: string[] = [];
  while (queue.length) {
    const [at, steps] = queue.shift()!;
    if (at === 35) {
      program = steps;
      break;
    }
    for (const [dx, dy, move] of [
      [1, 0, "moveRight"],
      [-1, 0, "moveLeft"],
      [0, 1, "moveDown"],
      [0, -1, "moveUp"],
    ] as const) {
      const x = (at % 6) + dx,
        y = Math.floor(at / 6) + dy,
        n = y * 6 + x;
      if (
        x >= 0 &&
        x < 6 &&
        y >= 0 &&
        y < 6 &&
        !walls.includes(n) &&
        !seen.has(n)
      ) {
        seen.add(n);
        queue.push([n, [...steps, move + "();"]]);
      }
    }
  }
  await page
    .getByLabel("Seu programa")
    .fill("function solve(){" + program.join("\n") + "} solve();");
  await page.getByRole("button", { name: "Executar", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Algoritmo concluído." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Acessibilidade", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("combobox", { name: "Tema", exact: true })
    .selectOption("DARK");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await dialog.getByLabel("Alto contraste").check();
  await dialog.getByLabel("Tamanho do texto").fill("1.35");
  await dialog.getByLabel("Reduzir animações").check();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await page.screenshot({
    path: "../../.local/learning-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Termo Dev", exact: true }).click();
  await expect(page.locator(".word-board")).toHaveCount(4);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "../../.local/learning-mobile.png",
    fullPage: true,
  });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
