import { test } from "./student-fixture";
import { expect } from "@playwright/test";
import { randomUUID } from "node:crypto";

test("visitor reads the real community and settings, but account actions stay gated", async ({
  page,
  request,
}, info) => {
  const backend = process.env.E2E_API_URL ?? "http://localhost:8080";
  const tag = randomUUID().slice(0, 8);
  const registration = await request.post(`${backend}/api/v1/auth/register`, {
    data: {
      name: "Autor visitante",
      username: `guest_${tag}`,
      email: `guest_${tag}@example.test`,
      password: "test-password-long",
      device: "E2E",
    },
  });
  expect(registration.ok()).toBe(true);
  const credentials = await registration.json();
  const headers = { Authorization: `Bearer ${credentials.accessToken}` };
  const avatar = await request.post(`${backend}/api/v1/users/me/avatar`, {
    headers,
    multipart: {
      file: {
        name: "avatar.png",
        mimeType: "image/png",
        buffer: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS3sAAAAASUVORK5CYII=",
          "base64",
        ),
      },
    },
  });
  expect(avatar.ok()).toBe(true);
  const title = `Aprender em comunidade ${tag}`;
  const created = await request.post(`${backend}/api/v1/forum`, {
    headers,
    data: {
      title,
      body: "Uma publicação real da comunidade para leitura pública.",
      category: "ACADEMIC",
    },
  });
  expect(created.ok()).toBe(true);
  const entry = await created.json();
  const comment = await request.post(
    `${backend}/api/v1/forum/${entry.id}/comments`,
    { headers, data: { body: "Uma resposta real para esta dúvida." } },
  );
  expect(comment.ok()).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/visitante?path=%2Fforum");
    await page.getByLabel("Buscar publicações").fill(title);
    await page.getByRole("button", { name: "Buscar no fórum" }).click();
    await page.getByRole("link", { name: title, exact: true }).click();
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(
      page.getByText("Uma resposta real para esta dúvida.", { exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: info.outputPath(`visitor-forum-${width}.png`),
      fullPage: true,
    });
    const author = page
      .getByRole("button", { name: "Ver perfil de Autor visitante" })
      .first();
    await expect
      .poll(() =>
        author
          .locator("img")
          .evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
          ),
      )
      .toBe(true);
    await author.click();
    const profile = page.getByRole("dialog", {
      name: "Perfil de Autor visitante",
      exact: true,
    });
    await expect(profile).toBeVisible();
    await expect(profile.locator(".identity-avatar img")).toBeVisible();
    await page.screenshot({
      path: info.outputPath(`visitor-profile-${width}.png`),
    });
    await profile
      .getByRole("button", { name: "Adicionar amizade", exact: true })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Faça parte da turma." }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await page.goto(
      `/visitante?path=${encodeURIComponent(`/forum/${entry.id}`)}`,
    );
    await page
      .getByRole("button", { name: "Votar a favor", exact: true })
      .first()
      .click();
    const gate = page.getByRole("dialog", { name: "Faça parte da turma." });
    await expect(gate).toBeVisible();
    await expect(
      gate.getByRole("link", { name: /Já tenho uma conta/ }),
    ).toHaveAttribute("href", new RegExp(entry.id));
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/\/visitante$/);
    await page.goto("/visitante?path=%2Fcaronas");
    await expect(
      page.getByRole("heading", { name: "Qual é o seu campus?" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Entrar para solicitar ou oferecer carona" })
      .click();
    await expect(gate).toBeVisible();
    await page.keyboard.press("Escape");
    await page.goto("/visitante?path=%2Fsettings");
    await expect(
      page.getByRole("heading", { name: "Configurações", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`visitor-settings-${width}.png`),
      fullPage: true,
    });
  }
  // The UI prompt is not the authorization boundary.
  const denied = await page.request.put(`/api/backend/forum/${entry.id}/vote`, {
    headers: { Origin: new URL(page.url()).origin },
    data: { value: 1 },
  });
  expect(denied.status()).toBe(401);
  expect((await denied.json()).code).toBe("UNAUTHORIZED");
  const unchanged = await request.get(
    `${backend}/api/v1/public/explore/forum/${entry.id}`,
  );
  expect(unchanged.ok()).toBe(true);
  expect(Number((await unchanged.json()).score)).toBe(0);
});
