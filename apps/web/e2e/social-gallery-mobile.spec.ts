import { test } from "./student-fixture";
import { authenticate } from "./session";
import { expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const backend = process.env.E2E_API_URL ?? "http://localhost:8080";
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=",
  "base64",
);

test("mobile dock hides the desktop brand and the gallery opens an editable photo", async ({
  page,
  request,
}, info) => {
  const id = randomUUID().slice(0, 8);
  const registration = await request.post(`${backend}/api/v1/auth/register`, {
    data: {
      name: "Galeria mobile",
      username: `gallery_${id}`,
      email: `gallery-${id}@example.test`,
      password: "social-test-123",
      device: "Gallery E2E",
    },
  });
  expect(registration.ok()).toBe(true);
  const user = await registration.json();
  const experience = await request.put(
    `${backend}/api/v1/users/me/experience`,
    {
      headers: { Authorization: `Bearer ${user.accessToken}` },
      data: {
        theme: "DARK",
        fontScale: 1,
        highContrast: false,
        reducedMotion: true,
        enhancedFocus: true,
      },
    },
  );
  expect(experience.ok()).toBe(true);
  // Exercise real browser selection/layout. Rendering/storage/publication are
  // independently exercised by SocialMediaIntegrationTest with actual PNG bytes.
  await page.route("**/api/backend/social/capabilities", async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      json: { ...(await response.json()), media: true },
    });
  });
  await authenticate(page.context(), user);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/social");
  const nav = page.getByRole("navigation", { name: "Ambientes do Social" });
  await expect(nav).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "Bem-vindo ao Enturma Social" }),
  ).not.toBeVisible({ timeout: 10000 });

  for (const width of [390, 760, 761, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ["light", "dark", "enturma"]) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme =
          value === "enturma" ? "dark" : value;
        document.documentElement.dataset.palette =
          value === "enturma" ? "enturma" : "default";
      }, theme);
      if (width <= 760)
        await expect(page.locator(".social-navigation-brand")).toBeHidden();
      else await expect(page.locator(".social-navigation-brand")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.dataset.palette = "default";
  });
  await nav.getByRole("button", { name: "Criar", exact: true }).click();
  await page.getByRole("button", { name: "Post", exact: true }).click();
  const gallery = page.getByLabel("Fotos da galeria", { exact: true });
  await expect(gallery).toHaveAttribute("accept", "image/*");
  await expect(gallery).not.toHaveAttribute("capture");
  // On a computer the file window also lists HEIC and RAW by extension; the phone keeps the
  // plain pair, which is what opens its gallery.
  await expect(
    page.getByLabel("Escolher mídia", { exact: true }),
  ).toHaveAttribute("accept", /^image\/\*,video\/\*(,\.[a-z0-9]+)*$/);
  await gallery.setInputFiles({
    name: "foto.png",
    mimeType: "image/png",
    buffer: png,
  });
  const editor = page.getByRole("region", {
    name: "Editor de imagem",
    exact: true,
  });
  await expect(editor).toBeVisible();
  const preview = editor.getByRole("img", {
    name: "Prévia da imagem escolhida",
    exact: true,
  });
  await expect
    .poll(() =>
      preview.evaluate(
        (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
      ),
    )
    .toBe(true);
  await editor.getByRole("button", { name: "3:4", exact: true }).click();
  await expect(
    editor.getByRole("button", { name: "3:4", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".social-navigation-brand")).toBeHidden();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ["light", "dark", "enturma"]) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme =
          value === "enturma" ? "dark" : value;
        document.documentElement.dataset.palette =
          value === "enturma" ? "enturma" : "default";
      }, theme);
      const selected = editor.getByRole("button", { name: "3:4", exact: true });
      const inactive = editor.getByRole("button", { name: "4:5", exact: true });
      await expect
        .poll(async () =>
          selected.evaluate(
            (button) => getComputedStyle(button).backgroundColor,
          ),
        )
        .not.toBe(
          await inactive.evaluate(
            (button) => getComputedStyle(button).backgroundColor,
          ),
        );
      expect((await selected.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      await editor.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: info.outputPath(`gallery-photo-${width}-${theme}.png`),
      });
    }
  }
  await page.getByRole("button", { name: "Avançar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Enviar e publicar", exact: true }),
  ).toBeEnabled();
});

/** The colour in the middle of each half of the preview: proof the photo was really decoded. */
const halves = (preview: import("@playwright/test").Locator) =>
  preview.evaluate((node) => {
    const image = node as HTMLImageElement,
      canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    const at = (x: number) =>
      [
        ...context.getImageData(
          Math.round(canvas.width * x),
          Math.round(canvas.height / 2),
          1,
          1,
        ).data,
      ].slice(0, 3);
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      left: at(0.25),
      right: at(0.75),
    };
  });

test("fotos HEIC do celular e RAW de câmera abrem no editor como fotos comuns", async ({
  page,
  request,
}) => {
  const id = randomUUID().slice(0, 8);
  const registration = await request.post(`${backend}/api/v1/auth/register`, {
    data: {
      name: "Fotos do celular",
      username: `heic_${id}`,
      email: `heic-${id}@example.test`,
      password: "social-test-123",
      device: "Gallery E2E",
    },
  });
  expect(registration.ok()).toBe(true);
  await page.route("**/api/backend/social/capabilities", async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      json: { ...(await response.json()), media: true },
    });
  });
  await authenticate(page.context(), await registration.json());
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/social");
  const nav = page.getByRole("navigation", { name: "Ambientes do Social" });
  await expect(
    page.getByRole("dialog", { name: "Bem-vindo ao Enturma Social" }),
  ).not.toBeVisible({ timeout: 10000 });
  await nav.getByRole("button", { name: "Criar", exact: true }).click();
  await page.getByRole("button", { name: "Post", exact: true }).click();

  // Both pictures are red on the left and blue on the right.
  for (const [file, mimeType, width] of [
    // a phone camera's "high efficiency" photo, as the gallery hands it over
    ["foto-celular.heic", "image/heic", 320],
    // a RAW file: developed at half size, which is what the sensor measured per colour
    ["foto-camera.dng", "image/x-adobe-dng", 80],
  ] as const) {
    await page.getByLabel("Fotos da galeria", { exact: true }).setInputFiles({
      name: file,
      mimeType,
      buffer: readFileSync(join(__dirname, "fixtures", file)),
    });
    const editor = page.getByRole("region", {
      name: "Editor de imagem",
      exact: true,
    });
    await expect(editor).toBeVisible({ timeout: 30000 });
    await expect(page.locator(".social-error")).toHaveCount(0);
    const preview = editor
      .getByRole("img", { name: "Prévia da imagem escolhida", exact: true })
      .last();
    await expect
      .poll(() =>
        preview.evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth,
        ),
      )
      .toBe(width);
    const seen = await halves(preview);
    expect(seen.left[0], `${file} à esquerda`).toBeGreaterThan(seen.left[2] + 60);
    expect(seen.right[2], `${file} à direita`).toBeGreaterThan(seen.right[0] + 60);
    // back to the first step for the next photo
    await page.goto("/social");
    await nav.getByRole("button", { name: "Criar", exact: true }).click();
    await page.getByRole("button", { name: "Post", exact: true }).click();
  }
});
