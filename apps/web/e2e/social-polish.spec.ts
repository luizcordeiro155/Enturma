import { test } from "./student-fixture";
import { authenticate } from "./session";
import { expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import pg from "pg";

test("feed, volume, comment picker and profile detail remain usable across themes and sizes", async ({
  page,
  request,
}, info) => {
  test.setTimeout(180000);
  const backend = process.env.E2E_API_URL ?? "http://localhost:8080";
  const tag = randomUUID().slice(0, 8);
  const email = `polish-${tag}@example.test`;
  const response = await request.post(`${backend}/api/v1/auth/register`, {
    data: {
      name: "Ana · Design e tecnologia",
      username: `polish_${tag}`,
      email,
      password: "social-test-123",
      device: "Social visual regression",
    },
  });
  expect(response.ok()).toBe(true);
  const user = await response.json();
  const headers = { Authorization: `Bearer ${user.accessToken}` };
  const db = new pg.Client({ connectionString: process.env.E2E_DATABASE_URL });
  await db.connect();
  await db.query(
    "UPDATE app_user SET bio=$1,profile_details=$2::jsonb,banner_bytes=$3,banner_mime='image/gif',media_version=media_version+1 WHERE email=$4",
    [
      "Projetos, ideias e aprendizados com a turma.",
      JSON.stringify({
        statusText: "Criando com a turma",
        interests: "Design · Programação",
      }),
      Buffer.from(
        "R0lGODlhAQABAIAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==",
        "base64",
      ),
      email,
    ],
  );
  await db.end();
  const ids: string[] = [];
  for (let index = 0; index < 6; index++) {
    const id = randomUUID();
    ids.push(id);
    const draft = await request.put(`${backend}/api/v1/social/drafts`, {
      headers,
      data: {
        id,
        kind: "POST",
        body: `Aprendizados da semana ${index + 1}`,
        visibility: "PUBLIC",
        version: 0,
        mediaIds: [],
      },
    });
    expect(draft.ok()).toBe(true);
    const published = await request.post(
      `${backend}/api/v1/social/posts/${id}/publish`,
      { headers, data: { version: (await draft.json()).version } },
    );
    expect(published.ok()).toBe(true);
  }
  // Synthetic artwork only: identity, publication, comments and likes use the local API.
  await page.route("**/api/backend/social/feed?**", async (route) => {
    const result = await route.fetch();
    const data = await result.json();
    for (const post of data.items ?? [])
      if (ids.includes(post.id))
        post.media = [
          {
            id: post.id,
            kind: "VIDEO",
            width: 720,
            height: 1280,
            state: "READY",
          },
        ];
    await route.fulfill({ response: result, json: data });
  });
  await page.route("**/api/backend/social/media/*/content*", async (route) => {
    const id = route
      .request()
      .url()
      .match(/media\/([^/]+)/)?.[1];
    if (!id || !ids.includes(id)) return route.continue();
    const index = ids.indexOf(id);
    await route.fulfill({
      contentType: "image/svg+xml",
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280"><rect width="720" height="1280" fill="${["#194e47", "#385b71", "#984e46"][index % 3]}"/><circle cx="500" cy="350" r="300" fill="#ffffff" opacity=".15"/><path d="M0 1150L350 580L720 940V1280H0" fill="#122d29"/><text x="55" y="400" font-family="sans-serif" font-size="32" fill="white">ENTURMA / IDEIAS</text><text x="55" y="650" font-family="sans-serif" font-size="78" fill="white">Crie junto.</text></svg>`,
    });
  });
  await authenticate(page.context(), user);
  await page.goto("/social");
  const skip = page.getByRole("button", { name: /Pular/ });
  if (await skip.isVisible()) await skip.click();
  const post = page.locator(".social-post:visible").first();
  await expect(post).toBeVisible();
  const video = post.locator("video");
  await expect(video).toHaveCSS("object-fit", "cover");
  expect((await video.boundingBox())!.width).toBeCloseTo(
    (await post.boundingBox())!.width,
    0,
  );
  const volume = post.locator(".social-video-volume");
  await volume.hover();
  const slider = volume.getByRole("slider");
  await expect(slider).toBeVisible();
  await slider.fill("0.4");
  expect(await video.evaluate((el) => (el as HTMLVideoElement).volume)).toBe(
    0.4,
  );
  await expect(volume.getByRole("button")).toHaveCSS(
    "color",
    "rgb(255, 255, 255)",
  );
  await page.screenshot({ path: info.outputPath("feed-volume-desktop.png") });
  await post.getByRole("button", { name: /Comentários ·/ }).click();
  const comments = page.getByRole("dialog", {
    name: "Conversa da publicação",
    exact: true,
  });
  await comments.getByRole("button", { name: "Adicionar emoji" }).click();
  const picker = page.getByRole("dialog", {
    name: "Emojis, figurinhas e GIFs",
    exact: true,
  });
  await expect(picker).toBeVisible();
  expect(await picker.evaluate((el) => !!el.closest("dialog[open]"))).toBe(
    true,
  );
  const box = (await picker.boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(1487);
  const emoji = picker.locator(".emoji-grid button").first();
  await expect(emoji).toBeVisible();
  await emoji.click();
  await expect(comments.locator("textarea")).not.toHaveValue("");
  await comments.getByRole("button", { name: "Adicionar emoji" }).click();
  await picker.getByRole("tab", { name: "GIFs", exact: true }).click();
  await expect(picker.locator(".media-library-grid")).toBeVisible();
  await picker.getByRole("tab", { name: "Figurinhas", exact: true }).click();
  await expect(
    picker.getByRole("button", { name: "Criar figurinha" }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("comment-picker-desktop.png"),
  });
  await page.keyboard.press("Escape");
  await expect(picker).not.toBeVisible();
  await expect(comments).toBeVisible();
  await comments.getByRole("button", { name: "Fechar", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Ambientes do Social" })
    .getByRole("button", { name: "Meu perfil social" })
    .click();
  const profile = page.getByRole("dialog", {
    name: "Perfil social",
    exact: true,
  });
  await expect(profile.getByText("Criando com a turma")).toBeVisible();
  await expect(
    profile.getByText("Projetos, ideias e aprendizados com a turma."),
  ).toBeVisible();
  await expect(profile.locator(".social-profile-banner img")).toBeVisible();
  const grid = profile.locator(".social-profile-grid:visible");
  await profile.evaluate(el => Promise.all(el.getAnimations().map(animation => animation.finished)));
  const gridBox = (await grid.boundingBox())!,
    profileBox = (await profile.boundingBox())!;
  expect(gridBox.x - profileBox.x).toBeLessThan(4);
  expect(gridBox.width / profileBox.width).toBeGreaterThan(0.97);
  const cell = grid.locator("button").first();
  await cell.hover();
  await expect(cell.locator(".social-grid-metrics")).toHaveCSS("opacity", "1");
  await page.screenshot({ path: info.outputPath("profile-desktop.png") });
  await cell.click();
  const viewer = page.getByRole("dialog", { name: "Publicações", exact: true });
  await expect(viewer.locator(".social-comment-form")).toBeVisible();
  const mediaBox = (await viewer.locator(".social-post-media").boundingBox())!;
  const composerBox = (await viewer
    .locator(".social-comment-form")
    .boundingBox())!;
  expect(composerBox.x).toBeGreaterThanOrEqual(mediaBox.x + mediaBox.width - 1);
  await viewer.getByRole("button", { name: /Curtir ·/ }).click();
  await expect(
    viewer.getByRole("button", { name: /Curtir ·/ }),
  ).toHaveAttribute("aria-pressed", "true");
  for (const theme of ["light", "dark"]) {
    await page.evaluate((theme) => {
      document.documentElement.dataset.theme = theme;
    }, theme);
    const color = await viewer
      .getByRole("button", { name: /Curtir ·/ })
      .evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe(
      theme === "light" ? "rgb(191, 37, 66)" : "rgb(255, 82, 107)",
    );
    await page.screenshot({ path: info.outputPath(`viewer-${theme}.png`) });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await viewer.locator(".social-comment-form").scrollIntoViewIfNeeded();
  await viewer.getByRole("button", { name: "Adicionar emoji" }).click();
  await expect(picker).toBeVisible();
  const mobileBox = (await picker.boundingBox())!;
  expect(mobileBox.x).toBeGreaterThanOrEqual(0);
  expect(mobileBox.x + mobileBox.width).toBeLessThanOrEqual(390);
  expect(mobileBox.y).toBeGreaterThanOrEqual(0);
  await page.screenshot({ path: info.outputPath("comment-picker-mobile.png") });
});
