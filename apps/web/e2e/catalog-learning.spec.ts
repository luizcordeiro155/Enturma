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
  const daily = await (
    await page.request.get("/api/backend/learning/missions")
  ).json();
  expect(daily.missions).toHaveLength(20);
  for (const mission of daily.missions) {
    expect(mission.definition).not.toHaveProperty("word");
    expect(mission.definition).not.toHaveProperty("answer");
  }
  await expect(page.locator(".mission-stage")).toHaveCount(1);
  await expect(
    page.getByText("Qual é o conceito?", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Consultar vocabulário/)).toHaveCount(0);
  const input = page.getByLabel("Palavra tentativa", { exact: true });
  const length = Number(await input.getAttribute("maxlength"));
  const word =
    ({ 4: "LOOP", 5: "ARRAY", 6: "STRING" } as Record<number, string>)[
      length
    ] ?? "A".repeat(length);
  await input.fill(word.toLowerCase());
  await expect(input).toHaveValue(word);
  const sent = page.waitForResponse(
    (r) =>
      r.url().endsWith("/learning/missions") && r.request().method() === "POST",
  );
  await input.press("Enter");
  expect((await sent).ok()).toBe(true);
  await expect(input).toHaveValue("");
  await expect(page.locator(".mission-word-row").first()).toHaveText(word);
  await page.reload();
  await expect(page.locator(".mission-word-row").first()).toHaveText(word);
  await page.getByRole("button", { name: /^Laboratório Binário/ }).click();
  await expect(page.locator(".mission-stage")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Rota do Algoritmo" }),
  ).toHaveCount(0);
  const binary = daily.missions.find(
    (m: { game: string; slot: number }) => m.game === "binary" && m.slot === 1,
  );
  await page
    .getByLabel("Resposta em binário")
    .fill(
      Number(binary.definition.expression.replace("decimal ", "")).toString(2),
    );
  await page
    .getByRole("button", { name: "Testar resposta", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Missão concluída" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Detetive de código/ }).click();
  await expect(page.locator(".mission-stage")).toHaveCount(1);
  const trace = daily.missions.find(
    (m: { game: string; slot: number }) => m.game === "trace" && m.slot === 1,
  );
  const initial = Number(trace.definition.code.match(/total = (\d+)/)[1]);
  const n = Number(trace.definition.code.match(/i <= (\d+)/)[1]);
  await page
    .getByLabel("Resultado de console.log")
    .fill(String(initial + (n * (n + 1)) / 2));
  await page
    .getByRole("button", { name: "Testar resposta", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Missão concluída" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Rota do Algoritmo/ }).click();
  await expect(page.locator(".mission-stage")).toHaveCount(1);
  const { walls } = daily.missions.find(
    (m: { game: string; slot: number }) =>
      m.game === "algorithm" && m.slot === 1,
  ).definition;
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
    page.getByRole("status").filter({ hasText: "Missão concluída" }),
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
  await page.getByRole("button", { name: /^Termo Dev/ }).click();
  await expect(page.locator(".mission-word-board")).toHaveCount(1);
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
