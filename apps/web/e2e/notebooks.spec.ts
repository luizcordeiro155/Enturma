import { authenticate } from "./session";
import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
test("caderno privado: cadastro acentuado, fontes, aula, citações e persistência", async ({
  page,
  browser,
}) => {
  const tag = randomUUID().slice(0, 8);
  await page.goto("/register");
  await page.getByLabel("Seu nome").fill("Cleitão");
  await page.getByLabel("Nome de usuário").fill(`Cleitão_${tag}`);
  await page.getByLabel("E-mail").fill(`notebook_${tag}@example.test`);
  await page
    .getByLabel("Senha", { exact: true })
    .fill("Test-password-long-123");
  await page.getByLabel("Confirmar senha").fill("Test-password-long-123");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/onboarding/);
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
    .getByRole("button", { name: "Adicionar fonte", exact: true })
    .click();
  await expect(page.getByLabel("Usar Anotações da aula")).toBeChecked();
  await expect(
    page.getByRole("button", { name: "Baixar material de estudo" }),
  ).toBeVisible({ timeout: 30000 });
  await page.locator(".citation").first().click();
  await expect(page.getByRole("dialog")).toContainText("sequência finita");
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Baixar material de estudo" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Arquivo", exact: true }).click();
  await page
    .getByLabel("Arquivo de estudo")
    .setInputFiles({
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
  await page
    .getByLabel("Arquivo de estudo")
    .setInputFiles({
      name: "aula.png",
      mimeType: "image/png",
      buffer: Buffer.from(png, "base64"),
    });
  await expect(page.getByLabel("Usar aula.png")).toBeEnabled({
    timeout: 20000,
  });
  await page
    .getByLabel("Pergunte sobre suas fontes")
    .fill("Como aplicar algoritmos na matemática?");
  await page.getByRole("button", { name: "Perguntar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Baixar material de estudo" }),
  ).toBeVisible({ timeout: 30000 });
  await page.getByRole("button", { name: "Link", exact: true }).click();
  await page.getByLabel("Link público HTTPS").fill("https://127.0.0.1/");
  await page.getByLabel("Título da fonte").fill("Endereço bloqueado");
  await page
    .getByRole("button", { name: "Adicionar fonte", exact: true })
    .click();
  await expect(page.locator(".source-list")).toContainText(
    /Não foi possível|privado/,
    { timeout: 20000 },
  );
  await page.screenshot({
    path: "../../.local/notebook-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "../../.local/notebook-mobile.png",
    fullPage: true,
  });
  const visitor = await browser.newContext();
  const other = await visitor.newPage();
  const registered = await page.request.post(
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
