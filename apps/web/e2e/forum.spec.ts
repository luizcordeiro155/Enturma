import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";

test("fórum: publicar, buscar, responder, votar, reagir e editar em mobile", async ({
  page,
  browser,
  request,
}) => {
  const tag = randomUUID().slice(0, 8),
    password = "E2E-test-password-123",
    backend = process.env.E2E_API_URL ?? "http://localhost:8080";
  const users = [];
  for (const name of ["Autor", "Colega"]) {
    const email = `forum-${name}-${tag}@example.test`;
    const response = await request.post(`${backend}/api/v1/auth/register`, {
      data: {
        name,
        username: `${name}_${tag}`,
        email,
        password,
        device: "E2E",
      },
    });
    expect(response.ok()).toBe(true);
    users.push({ email, ...(await response.json()) });
  }
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(users[0].email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/home|onboarding/);
  await page.goto("/forum");
  await page.getByRole("button", { name: "Nova publicação" }).click();
  const editor = page.getByRole("dialog", { name: "Nova publicação" });
  const title = `Recursão e algoritmos ${tag}`;
  await editor.getByLabel("Título", { exact: true }).fill(title);
  await editor.getByLabel("Assunto da publicação").selectOption("PROGRAMMING");
  await editor
    .getByLabel("Conteúdo da publicação")
    .fill(
      "Fonte: https://example.org/estudo?tema=recursao\nComo funciona o caso base?\n```js\nif (n === 0) return 1;\n```\n<script>alert('não executar')</script>",
    );
  await editor.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(page).toHaveURL(/forum\/[0-9a-f-]+/);
  const url = page.url();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await expect(page.locator(".forum-body code")).toContainText("return 1");
  await expect(page.locator(".forum-body")).toContainText("<script>");
  await page
    .getByRole("link", {
      name: "https://example.org/estudo?tema=recursao",
      exact: true,
    })
    .click();
  const warning = page.getByRole("dialog", {
    name: "Você está saindo do Enturma",
  });
  await expect(warning).toBeVisible();
  await expect
    .poll(() =>
      warning.evaluate((el) =>
        el.getAnimations().every((a) => a.playState !== "running"),
      ),
    )
    .toBe(true);
  await warning.screenshot({
    path: "../../.local/external-link-confirmation.png",
  });
  await expect(
    warning.getByRole("button", { name: "Abrir link" }),
  ).toBeDisabled();
  await warning
    .getByLabel("Entendo que vou acessar um site externo e aceito continuar.")
    .check();
  await page.context().route("https://example.org/**", (route) =>
    route.fulfill({
      body: "Página externa de teste",
      contentType: "text/html",
    }),
  );
  const popupPromise = page.context().waitForEvent("page");
  await warning.getByRole("button", { name: "Abrir link" }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  expect(popup.url()).toBe("https://example.org/estudo?tema=recursao");
  await popup.close();
  await page.getByRole("link", { name: "Voltar ao fórum" }).click();
  await page.getByLabel("Buscar publicações").fill(tag);
  await page.getByRole("button", { name: "Buscar no fórum" }).click();
  await expect(page.locator(".forum-card")).toHaveCount(1);
  const newPost = await request.post(`${backend}/api/v1/forum`, {
    headers: { Authorization: `Bearer ${users[1].accessToken}` },
    data: {
      title: `Nova conversa ${tag}`,
      body: "Atualização sem reload",
      category: "GENERAL",
    },
  });
  expect(newPost.ok()).toBe(true);
  const newId = (await newPost.json()).id;
  await expect(
    page.getByRole("link", { name: `Nova conversa ${tag}`, exact: true }),
  ).toBeVisible({ timeout: 5000 });
  await request.delete(`${backend}/api/v1/forum/${newId}`, {
    headers: { Authorization: `Bearer ${users[1].accessToken}` },
  });
  await expect(page.locator(".forum-card")).toHaveCount(1);

  await page.getByRole("link", { name: title, exact: true }).click();
  const peer = await browser.newContext();
  const peerPage = await peer.newPage();
  await peerPage.goto("/login");
  await peerPage.getByLabel("E-mail").fill(users[1].email);
  await peerPage.getByLabel("Senha", { exact: true }).fill(password);
  await peerPage.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(peerPage).toHaveURL(/home|onboarding/);
  await peerPage.goto(url);
  await peerPage
    .getByLabel("Seu comentário")
    .fill(`O caso base interrompe as chamadas recursivas. @Autor_${tag}`);
  await peerPage.getByRole("button", { name: "Comentar", exact: true }).click();
  await expect(peerPage.locator(".forum-comment")).toContainText("interrompe");
  const post = peerPage.locator(".forum-card").first();
  await post.getByRole("button", { name: "Votar a favor" }).click();
  await expect(
    post.getByRole("button", { name: "Votar a favor" }),
  ).toHaveAttribute("aria-pressed", "true");
  await post.getByRole("button", { name: "Reagir com 💡" }).click();
  await expect(
    post.getByRole("button", { name: "Reagir com 💡" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    post.getByRole("button", { name: "Editar publicação ou comentário" }),
  ).toHaveCount(0);
  await expect(page.locator(".forum-comment")).toContainText("interrompe", {
    timeout: 5000,
  });
  await page.getByRole("button", { name: /Notificações,.*não lidas/ }).click();
  const inbox = page.getByRole("dialog", { name: "Sua caixa de entrada" });
  await expect(inbox).toContainText("Sua publicação recebeu uma curtida.");
  await expect(inbox).toContainText(
    "Você foi mencionado em uma conversa do fórum.",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      inbox.evaluate((el) =>
        el
          .getAnimations({ subtree: true })
          .every((a) => a.playState !== "running"),
      ),
    )
    .toBe(true);
  await page.screenshot({ path: "../../.local/notification-inbox-mobile.png" });
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
  });
  await page.screenshot({ path: "../../.local/notification-inbox-dark.png" });
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "light";
  });
  await inbox.getByRole("button", { name: "Marcar todas como lidas" }).click();
  await expect(inbox.getByText("0 não lidas", { exact: true })).toBeVisible();
  await inbox.getByRole("button", { name: "Fechar notificações" }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/home");
  const highlights = page.getByRole("region", { name: "Em destaque no fórum" });
  const featured = highlights.locator("article").filter({ hasText: title });
  await expect(featured).toBeVisible();
  await expect(featured).toContainText("1 curtida");
  await expect(featured).toContainText("1 reação");
  await expect(featured).toContainText("1 comentário");
  const roomsHeading = await page
    .getByRole("heading", { name: "Salas acontecendo agora" })
    .boundingBox();
  expect((await highlights.boundingBox())!.y).toBeGreaterThan(roomsHeading!.y);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await highlights.screenshot({ path: "../../.local/home-forum-mobile.png" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "light";
  });
  await highlights.screenshot({ path: "../../.local/home-forum-desktop.png" });
  await featured.getByRole("heading", { name: title, exact: true }).click();
  await expect(page).toHaveURL(url);
  await page
    .locator(".forum-comment")
    .getByRole("button", { name: "Responder", exact: true })
    .click();
  await page.getByLabel("Seu comentário").fill("Agora entendi, obrigado!");
  await page.getByRole("button", { name: "Comentar", exact: true }).click();
  await expect(page.locator(".forum-replies")).toContainText("Agora entendi");
  await page
    .locator(".forum-card")
    .first()
    .getByRole("button", { name: "Editar publicação ou comentário" })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Título", { exact: true })
    .fill(title + " resolvido");
  await page
    .getByRole("button", { name: "Salvar alterações", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: title + " resolvido", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "../../.local/forum-mobile-dark.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "light";
  });
  await page.screenshot({
    path: "../../.local/forum-desktop.png",
    fullPage: true,
  });
  peerPage.once("dialog", (d) => d.accept());
  await peerPage
    .locator(".forum-comment")
    .getByRole("button", { name: "Excluir publicação ou comentário" })
    .click();
  await expect(peerPage.locator(".forum-comment").first()).toContainText(
    "excluído",
  );
  await expect(peerPage.locator(".forum-replies")).toContainText(
    "Agora entendi",
  );
  page.once("dialog", (d) => d.accept());
  await page
    .locator(".forum-card")
    .first()
    .getByRole("button", { name: "Excluir publicação ou comentário" })
    .click();
  await expect(page).toHaveURL(/\/forum$/);
  await peer.close();
});
