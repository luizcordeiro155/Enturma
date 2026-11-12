import { test } from "./student-fixture";
import { authenticate } from "./session";
import { expect } from "@playwright/test";
import { randomUUID } from "node:crypto";

const backend = process.env.E2E_API_URL ?? "http://localhost:8080";
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=", "base64");

test("mobile dock hides the desktop brand and the gallery opens an editable photo", async ({ page, request }, info) => {
  const id = randomUUID().slice(0, 8);
  const registration = await request.post(`${backend}/api/v1/auth/register`, {
    data: { name: "Galeria mobile", username: `gallery_${id}`, email: `gallery-${id}@example.test`, password: "social-test-123", device: "Gallery E2E" },
  });
  expect(registration.ok()).toBe(true);
  const user = await registration.json();
  const experience = await request.put(`${backend}/api/v1/users/me/experience`, {
    headers: { Authorization: `Bearer ${user.accessToken}` },
    data: { theme: "DARK", fontScale: 1, highContrast: false, reducedMotion: true, enhancedFocus: true },
  });
  expect(experience.ok()).toBe(true);
  // Exercise real browser selection/layout. Rendering/storage/publication are
  // independently exercised by SocialMediaIntegrationTest with actual PNG bytes.
  await page.route("**/api/backend/social/capabilities", async route => {
    const response = await route.fetch();
    await route.fulfill({ response, json: { ...(await response.json()), media: true } });
  });
  await authenticate(page.context(), user);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/social");
  const nav = page.getByRole("navigation", { name: "Ambientes do Social" });
  await expect(nav).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Bem-vindo ao Enturma Social" })).not.toBeVisible({ timeout: 10000 });

  for (const width of [390, 760, 761, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ["light", "dark", "enturma"]) {
      await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
      if (width <= 760) await expect(page.locator(".social-navigation-brand")).toBeHidden();
      else await expect(page.locator(".social-navigation-brand")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { document.documentElement.dataset.theme = "dark"; });
  await nav.getByRole("button", { name: "Criar", exact: true }).click();
  await page.getByRole("button", { name: "Post", exact: true }).click();
  const gallery = page.getByLabel("Fotos da galeria", { exact: true });
  await expect(gallery).toHaveAttribute("accept", "image/*");
  await expect(gallery).not.toHaveAttribute("capture");
  await expect(page.getByLabel("Escolher mídia", { exact: true })).toHaveAttribute("accept", "image/*,video/*");
  await gallery.setInputFiles({ name: "foto.png", mimeType: "image/png", buffer: png });
  const editor = page.getByRole("region", { name: "Editor de imagem", exact: true });
  await expect(editor).toBeVisible();
  const preview = editor.getByRole("img", { name: "Prévia da imagem escolhida", exact: true });
  await expect.poll(() => preview.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await editor.getByRole("button", { name: "3:4", exact: true }).click();
  await expect(editor.getByRole("button", { name: "3:4", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".social-navigation-brand")).toBeHidden();
  await page.screenshot({ path: info.outputPath("gallery-photo-mobile.png") });
  await page.getByRole("button", { name: "Avançar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Enviar e publicar", exact: true })).toBeEnabled();
});
