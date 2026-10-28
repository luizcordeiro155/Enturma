import { test } from "./student-fixture";
import { authenticate } from "./session";
import { expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFile } from "node:fs/promises";

test("pesquisa Web: contrato visual e payload, sem chamadas pagas", async ({
  page,
  request,
}, testInfo) => {
  const tag = randomUUID().slice(0, 8);
  const response = await request.post(
    `${process.env.E2E_API_URL ?? "http://localhost:8080"}/api/v1/auth/register`,
    {
      data: {
        name: "Pesquisa Fixture",
        username: `search_${tag}`,
        email: `search_${tag}@example.test`,
        password: "Test-password-long-123",
        device: "E2E",
      },
    },
  );
  expect(response.ok()).toBe(true);
  await authenticate(page.context(), await response.json());
  await page.goto("/notebooks");
  await page.getByLabel("Nome do caderno").fill("Contrato da pesquisa");
  await page.getByRole("button", { name: "Criar caderno" }).click();
  await expect(page).toHaveURL(/notebooks\/[a-f0-9-]+/);
  const id = page.url().split("/").at(-1)!;
  let available = true;
  const submitted: boolean[] = [];
  // Only the UI capability fixture is substituted. No generated answer is fabricated.
  await page.route(`**/api/backend/notebooks/${id}`, async (route) => {
    const original = await route.fetch();
    const data = await original.json();
    await route.fulfill({
      json: {
        ...data,
        aiEnabled: true,
        webSearchEnabled: available,
        sources: [
          {
            id: randomUUID(),
            title: "Fonte sintética",
            kind: "TEXT",
            status: "READY",
          },
        ],
      },
    });
  });
  await page.route(
    `**/api/backend/notebooks/${id}/generations`,
    async (route) => {
      submitted.push(route.request().postDataJSON().webSearch);
      await route.fulfill({
        status: 503,
        json: { message: "Provedor desativado nesta prova de interface" },
      });
    },
  );
  await page.reload();
  const search = page.locator(".notebook-web-toggle");
  for (const width of [390, 1487]) {
    await page.setViewportSize({ width, height: 844 });
    for (const theme of ["light", "dark"]) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      await expect(search).toHaveAttribute("aria-pressed", "false");
      const before = await search.boundingBox();
      await search.click();
      await expect(search).toHaveAttribute("aria-pressed", "true");
      await expect(search).toHaveAttribute("title", "Pesquisa na Web ativada");
      const after = await search.boundingBox();
      expect(after?.width).toBe(before?.width);
      expect(after?.height).toBe(before?.height);
      await page.screenshot({
        path: testInfo.outputPath(`search-${width}-${theme}.png`),
      });
      await search.click();
    }
  }
  await page.getByLabel("Mensagem para o Enturma APP").fill("Explique a fonte");
  await search.click();
  await page
    .getByRole("button", { name: "Enviar mensagem", exact: true })
    .click();
  await expect.poll(() => submitted.length).toBe(1);
  expect(submitted[0]).toBe(true);
  available = false;
  await expect(search).toBeDisabled({ timeout: 10000 });
  await expect(search).toHaveAttribute("aria-pressed", "false");
  await expect(search).toHaveAttribute("title", "Pesquisa na Web indisponível");
  await page
    .getByRole("button", { name: "Enviar mensagem", exact: true })
    .click();
  await expect.poll(() => submitted.length).toBe(2);
  expect(submitted[1]).toBe(false);

  // Bounded synthetic BFF-read timing. This is not a load/capacity benchmark.
  const samples = [];
  for (let i = 0; i < 12; i++) {
    const start = performance.now();
    const result = await page.request.get("/api/backend/notifications/inbox");
    expect(result.ok()).toBe(true);
    samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  await writeFile(
    testInfo.outputPath("bff-read-latency.json"),
    JSON.stringify(
      {
        scope:
          "isolated CI; one synthetic user; sequential authenticated BFF inbox reads",
        requests: 12,
        concurrency: 1,
        p50Ms: samples[5],
        p95Ms: samples[11],
        samplesMs: samples,
      },
      null,
      2,
    ),
  );
});
test("caderno privado: cadastro acentuado, fontes, aula, citações e persistência", async ({
  page,
  browser,
  request,
}) => {
  const tag = randomUUID().slice(0, 8);
  const owner = await request.post(
    `${process.env.E2E_API_URL ?? "http://localhost:8080"}/api/v1/auth/register`,
    {
      data: {
        name: "Cleitão",
        username: `Cleitão_${tag}`,
        email: `notebook_${tag}@example.test`,
        password: "Test-password-long-123",
        device: "E2E",
      },
    },
  );
  expect(owner.ok()).toBe(true);
  await authenticate(page.context(), await owner.json());
  await page.goto("/notebooks");
  await page.getByLabel("Nome do caderno").fill("Algoritmos e matemática");
  await page.getByRole("button", { name: "Criar caderno" }).click();
  await expect(page).toHaveURL(/notebooks\/[a-f0-9-]+/);
  const url = page.url();
  await page.getByRole("button", { name: "Texto", exact: true }).click();
  await page.getByLabel("Título da fonte").fill("Anotações da aula");
  await page
    .getByLabel("Conteúdo para estudar")
    .fill(
      "Um algoritmo é uma sequência finita de passos para resolver um problema. As etapas são entrada, processamento e saída. A soma recebe dois números, calcula o total e apresenta o resultado.",
    );
  await page
    .getByRole("complementary", { name: "Fontes do caderno" })
    .getByRole("button", { name: "Adicionar fonte", exact: true })
    .click();
  await expect(page.getByLabel("Usar Anotações da aula")).toBeChecked();
  const notebookState = await (
    await page.request.get(`/api/backend/notebooks/${url.split("/").at(-1)}`)
  ).json();
  if (notebookState.aiEnabled) {
    await page
      .getByLabel("Mensagem para o Enturma APP")
      .fill("Explique algoritmos e suas etapas");
    await page
      .getByRole("button", { name: "Enviar mensagem", exact: true })
      .click();
    await expect(
      page.locator(".notebook-assistant-message .study-answer").last(),
    ).toBeVisible({ timeout: 30000 });
    await page.locator(".citation").first().click();
    await expect(page.getByRole("dialog")).toContainText("sequência finita");
    await page.keyboard.press("Escape");
  } else {
    await expect(
      page.getByRole("button", { name: "Enviar mensagem", exact: true }),
    ).toBeDisabled();
  }
  await page.locator(".notebook-add-source > summary").click();
  await page.getByRole("button", { name: "Arquivo", exact: true }).click();
  await page.getByLabel("Arquivo de estudo").setInputFiles({
    name: "revisao.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(
      "Variáveis guardam valores durante a execução de um programa. Elas podem representar números, textos e outras estruturas.",
    ),
  });
  await expect(page.getByLabel("Usar revisao.txt")).toBeEnabled({
    timeout: 20000,
  });
  const png = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 100;
    c.height = 100;
    const x = c.getContext("2d")!;
    x.fillStyle = "white";
    x.fillRect(0, 0, 100, 100);
    x.fillStyle = "black";
    x.fillText("Algoritmo", 10, 40);
    return c.toDataURL("image/png").split(",")[1];
  });
  if (
    !(await page.locator(".notebook-add-source").getAttribute("open")) &&
    !(await page.getByLabel("Arquivo de estudo").isVisible())
  )
    await page.locator(".notebook-add-source > summary").click();
  await page.getByLabel("Arquivo de estudo").setInputFiles({
    name: "aula.png",
    mimeType: "image/png",
    buffer: Buffer.from(png, "base64"),
  });
  if (notebookState.aiEnabled) {
    await expect(page.getByLabel("Usar aula.png")).toBeEnabled({
      timeout: 20000,
    });
  } else {
    await expect(
      page.getByRole("alert").filter({
        hasText: "A leitura de imagens precisa da IA configurada.",
      }),
    ).toBeVisible();
  }
  await page
    .getByLabel("Mensagem para o Enturma APP")
    .fill("Como aplicar algoritmos na matemática?");
  if (notebookState.aiEnabled) {
    await page
      .getByRole("button", { name: "Enviar mensagem", exact: true })
      .click();
    await expect(
      page.locator(".notebook-assistant-message .study-answer").last(),
    ).toBeVisible({ timeout: 30000 });
  } else {
    await expect(
      page.getByRole("button", { name: "Enviar mensagem", exact: true }),
    ).toBeDisabled();
  }
  if (
    !(await page.getByRole("button", { name: "Link", exact: true }).isVisible())
  )
    await page.locator(".notebook-add-source > summary").click();
  await page.getByRole("button", { name: "Link", exact: true }).click();
  await page.getByLabel("Link público HTTPS").fill("https://127.0.0.1/");
  await page.getByLabel("Título da fonte").fill("Endereço bloqueado");
  await page
    .getByRole("complementary", { name: "Fontes do caderno" })
    .getByRole("button", { name: "Adicionar fonte", exact: true })
    .click();
  await expect(page.locator(".source-list")).toContainText(
    /Não foi possível|privado/,
    { timeout: 20000 },
  );
  await page.screenshot({
    path: join(tmpdir(), "enturma-notebook-sources-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: join(tmpdir(), "enturma-notebook-sources-mobile.png"),
    fullPage: true,
  });
  const visitor = await browser.newContext();
  const other = await visitor.newPage();
  const registered = await request.post(
    `${process.env.E2E_API_URL ?? "http://localhost:8080"}/api/v1/auth/register`,
    {
      data: {
        name: "Outro",
        username: `other_${tag}`,
        email: `othernotebook_${tag}@example.test`,
        password: "Test-password-long-123",
        device: "E2E",
      },
    },
  );
  expect(registered.ok()).toBe(true);
  await authenticate(visitor, await registered.json());
  const id = url.split("/").at(-1);
  expect(
    (await other.request.get(`/api/backend/notebooks/${id}`)).status(),
  ).toBe(404);
  await visitor.close();
});
