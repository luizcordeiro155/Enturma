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
    expect(seen.left[0], `${file} à esquerda`).toBeGreaterThan(
      seen.left[2] + 60,
    );
    expect(seen.right[2], `${file} à direita`).toBeGreaterThan(
      seen.right[0] + 60,
    );
    // back to the first step for the next photo
    await page.goto("/social");
    await nav.getByRole("button", { name: "Criar", exact: true }).click();
    await page.getByRole("button", { name: "Post", exact: true }).click();
  }
});

test("com várias mídias o editor abre uma por vez, com a fila de miniaturas", async ({
  page,
  request,
}) => {
  const id = randomUUID().slice(0, 8);
  const registration = await request.post(`${backend}/api/v1/auth/register`, {
    data: {
      name: "Carrossel no editor",
      username: `fila_${id}`,
      email: `fila-${id}@example.test`,
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
  // Two photos at once: an ordinary one and a phone's HEIC (320 px wide once converted).
  await page.getByLabel("Escolher mídia", { exact: true }).setInputFiles([
    { name: "primeira.png", mimeType: "image/png", buffer: png },
    {
      name: "segunda.heic",
      mimeType: "image/heic",
      buffer: readFileSync(join(__dirname, "fixtures", "foto-celular.heic")),
    },
  ]);
  const strip = page.getByRole("group", { name: "Mídias da publicação" });
  await expect(strip).toBeVisible({ timeout: 30000 });
  await expect(strip.getByRole("button", { name: /^Abrir mídia/ })).toHaveCount(
    2,
  );
  await expect(
    strip.getByRole("button", { name: "Adicionar mídia" }),
  ).toBeVisible();
  // one editor on screen, not one under the other
  const editors = page.getByRole("region", {
    name: "Editor de imagem",
    exact: true,
  });
  await expect(editors).toHaveCount(1);
  await expect(page.getByText(/^Mídia 1 de 2/)).toBeVisible();
  const width = () =>
    editors
      .getByRole("img", { name: "Prévia da imagem escolhida", exact: true })
      .evaluate(
        (image: HTMLImageElement) => image.complete && image.naturalWidth,
      );
  await expect.poll(width).toBeGreaterThan(0);
  const first = await width();
  expect(first).not.toBe(320);

  await strip.getByRole("button", { name: "Abrir mídia 2" }).click();
  await expect(page.getByText(/^Mídia 2 de 2/)).toBeVisible();
  await expect(editors).toHaveCount(1);
  await expect.poll(width).toBe(320);
  await expect(
    strip.getByRole("button", { name: "Próxima mídia" }),
  ).toBeDisabled();
  await strip.getByRole("button", { name: "Mídia anterior" }).click();
  await expect.poll(width).toBe(first);

  // The line of thumbnails scrolls inside itself; the page never grows sideways.
  for (const viewport of [390, 1440]) {
    await page.setViewportSize({ width: viewport, height: 900 });
    await expect(strip).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    expect(
      await strip.evaluate(
        (node) => node.getBoundingClientRect().right <= innerWidth + 1,
      ),
    ).toBe(true);
  }
});

test("a publicação com várias mídias é um carrossel no celular e no computador", async ({
  page,
  request,
}) => {
  const id = randomUUID().slice(0, 8);
  const registration = await request.post(`${backend}/api/v1/auth/register`, {
    data: {
      name: "Carrossel no feed",
      username: `feed_${id}`,
      email: `feed-${id}@example.test`,
      password: "social-test-123",
      device: "Gallery E2E",
    },
  });
  expect(registration.ok()).toBe(true);
  const user = await registration.json();
  const post = {
    id: randomUUID(),
    authorId: user.userId,
    name: "Carrossel no feed",
    username: `feed_${id}`,
    kind: "POST",
    body: "Três fotos de uma vez",
    publishedAt: new Date().toISOString(),
    pinned: false,
    likes: 0,
    comments: 0,
    reposts: 0,
    mine: [],
    media: Array.from({ length: 3 }, () => ({
      id: randomUUID(),
      kind: "IMAGE",
      width: 1080,
      height: 1350,
    })),
  };
  // A fixture for the player only: publication and storage are covered by the API's own tests.
  await page.route("**/api/backend/social/feed?**", (route) =>
    route.fulfill({
      json: {
        items: [post],
        nextCursor: "",
        snapshot: new Date().toISOString(),
      },
    }),
  );
  await page.route("**/api/backend/social/media/*/content*", (route) =>
    route.fulfill({ contentType: "image/png", body: png }),
  );
  await authenticate(page.context(), user);
  for (const [width, arrows] of [
    [390, false],
    [1366, true],
  ] as const) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/social");
    const carousel = page
      .locator(".social-feed-view .social-stream:visible .social-carousel")
      .first();
    await expect(carousel).toBeVisible({ timeout: 20000 });
    const count = carousel.locator(".social-carousel-count");
    await expect(count).toHaveText("1/3");
    const track = carousel.locator(".social-carousel-track");
    // every media is exactly one frame wide, whatever the screen
    expect(
      await track.evaluate((node) =>
        [...node.children].every(
          (figure) =>
            Math.abs(figure.getBoundingClientRect().width - node.clientWidth) <=
            1,
        ),
      ),
    ).toBe(true);
    // sliding the line sideways changes the media, the counter and the dots
    await track.evaluate((node) =>
      node.scrollTo({ left: node.clientWidth, behavior: "instant" }),
    );
    await expect(count).toHaveText("2/3");
    await expect(carousel.getByRole("tab").nth(1)).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const next = carousel.getByRole("button", { name: "Próxima mídia" });
    if (arrows) {
      // with a mouse there is nothing to drag, so the arrows are there
      await next.click();
      await expect(count).toHaveText("3/3");
      await expect(next).toBeHidden();
    } else await expect(next).toBeHidden();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  }
});
