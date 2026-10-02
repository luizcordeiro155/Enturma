import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
test("mural preserva widgets após recarregar e respeita privacidade", async ({
  page,
  request,
}) => {
  const tag = randomUUID().slice(0, 8),
    email = `profilev3-${tag}@example.test`,
    password = "Profile-v3-password-123";
  const registered = await request.post(
    `${process.env.E2E_API_URL ?? "http://localhost:8080"}/api/v1/auth/register`,
    {
      data: {
        name: "Perfil de estudo",
        username: `profilev3_${tag}`,
        email,
        password,
        device: "E2E",
      },
    },
  );
  expect(registered.ok()).toBe(true);
  const user = await registered.json();
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/home|onboarding/);
  await page.goto("/profile");
  await page
    .getByRole("textbox", { name: "Objetivo da semana", exact: true })
    .fill("Revisar cálculo e compartilhar resumos");
  await page.getByLabel("Cor secundária", { exact: true }).fill("#336699");
  await page.getByLabel("Fundo decorativo").selectOption("GRADIENT");
  await page.getByLabel("Adicionar widget").selectOption("GOAL");
  await page.getByLabel("Widgets e textos do mural", { exact: true }).check();
  await page
    .getByRole("button", { name: "Salvar perfil", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Personalização salva" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Objetivo da semana", exact: true }),
  ).toBeVisible({ timeout: 20000 });
  await expect(
    page.getByRole("textbox", { name: "Objetivo da semana", exact: true }),
  ).toHaveValue("Revisar cálculo e compartilhar resumos");
  await expect(page.getByLabel("Cor secundária", { exact: true })).toHaveValue(
    "#336699",
  );
  // Re-saving the GET payload used to include read-only widget fields and fail validation.
  await page
    .getByRole("button", { name: "Salvar perfil", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Personalização salva" }),
  ).toBeVisible();
  const peer = await request.post(
    `${process.env.E2E_API_URL ?? "http://localhost:8080"}/api/v1/auth/register`,
    {
      data: {
        name: "Colega",
        username: `peer_${tag}`,
        email: `peer-${tag}@example.test`,
        password,
        device: "E2E",
      },
    },
  );
  const credentials = await peer.json();
  const me = await page.request.get("/api/backend/users/me");
  const id = (await me.json()).id;
  const endpoint = `${process.env.E2E_API_URL ?? "http://localhost:8080"}/api/v1/users/${id}/showcase`;
  const publicView = await request.get(endpoint, {
    headers: { Authorization: `Bearer ${credentials.accessToken}` },
  });
  expect(publicView.ok()).toBe(true);
  expect(
    (await publicView.json()).widgets.some(
      (w: { kind: string }) => w.kind === "GOAL",
    ),
  ).toBe(true);
  await page.getByLabel("Widgets e textos do mural", { exact: true }).uncheck();
  await page
    .getByRole("button", { name: "Salvar perfil", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Personalização salva" }),
  ).toBeVisible();
  const hidden = await request.get(endpoint, {
    headers: { Authorization: `Bearer ${credentials.accessToken}` },
  });
  const result = await hidden.json();
  expect(result.widgets).toEqual([]);
  expect(result.appearance.goal).toBeUndefined();
  await page.screenshot({
    path: "../../.local/profile-v3.png",
    fullPage: true,
  });
  expect(user.accessToken).toBeTruthy();
});
