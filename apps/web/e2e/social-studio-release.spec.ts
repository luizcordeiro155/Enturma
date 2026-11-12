import { test } from "./student-fixture";
import { authenticate } from "./session";
import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
const backend = process.env.E2E_API_URL ?? "http://localhost:8080";
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=",
  "base64",
);
type User = {
  userId: string;
  accessToken: string;
  refreshToken: string;
  username: string;
};
async function student(
  request: APIRequestContext,
  name: string,
): Promise<User> {
  const tag = randomUUID().slice(0, 8),
    username = `studio_${tag}`;
  const response = await request.post(`${backend}/api/v1/auth/register`, {
    data: {
      name,
      username,
      email: `studio-${tag}@example.test`,
      password: "social-test-123",
      device: "Studio E2E",
    },
  });
  expect(response.ok()).toBe(true);
  const user = await response.json();
  await request.put(`${backend}/api/v1/users/me/experience`, {
    headers: { Authorization: `Bearer ${user.accessToken}` },
    data: {
      theme: "DARK",
      fontScale: 1,
      highContrast: false,
      reducedMotion: true,
      enhancedFocus: true,
    },
  });
  return { ...user, username };
}
async function enter(page: Page, user: User) {
  await authenticate(page.context(), user);
  await page.goto("/social");
  await expect(
    page.getByRole("navigation", { name: "Ambientes do Social" }),
  ).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "Bem-vindo ao Enturma Social" }),
  ).not.toBeVisible({ timeout: 10000 });
}
async function publish(request: APIRequestContext, user: User, body: string) {
  const id = randomUUID(),
    headers = { Authorization: `Bearer ${user.accessToken}` };
  const draft = await request.put(`${backend}/api/v1/social/drafts`, {
    headers,
    data: {
      id,
      kind: "POST",
      body,
      visibility: "PUBLIC",
      version: 0,
      mediaIds: [],
    },
  });
  expect(draft.ok()).toBe(true);
  expect(
    (
      await request.post(`${backend}/api/v1/social/posts/${id}/publish`, {
        headers,
        data: { version: (await draft.json()).version },
      })
    ).ok(),
  ).toBe(true);
  return id;
}

test("Studio visual: long video, drag trimming, timed text, cover and theme snapshots", async ({
  page,
  request,
}, info) => {
  test.setTimeout(120000);
  const me = await student(request, "Estudante do Studio");
  // Only the local editor is exercised here; server-side storage/render permissions
  // and exact exported dimensions are covered by the Java/FFmpeg integration suite.
  await page.route("**/api/backend/social/capabilities", async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      json: { ...(await response.json()), media: true },
    });
  });
  await enter(page, me);
  await page
    .getByRole("navigation", { name: "Ambientes do Social" })
    .getByRole("button", { name: "Criar", exact: true })
    .click();
  await page.getByRole("button", { name: "Clip \u00b7 at\u00e9 90s" }).click();
  const file = info.outputPath("studio-long.mp4");
  execFileSync(
    "ffmpeg",
    [
      "-nostdin",
      "-y",
      "-loglevel",
      "error",
      "-f",
      "lavfi",
      "-i",
      "testsrc2=size=320x180:rate=2",
      "-t",
      "120",
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-pix_fmt",
      "yuv420p",
      file,
    ],
    { timeout: 30000 },
  );
  await page.getByLabel("Escolher m\u00eddia").setInputFiles(file);
  const editor = page.getByRole("region", { name: "Editor de v\u00eddeo" });
  await expect(editor).toBeVisible();
  await expect(
    editor.locator(".studio-filmstrip-images img").first(),
  ).toBeVisible({ timeout: 20000 });
  await expect(editor.getByLabel("Fim (s)", { exact: true })).toHaveValue("90");
  const handle = editor.getByRole("slider", {
    name: "Fim do corte",
    exact: true,
  });
  await handle.scrollIntoViewIfNeeded();
  const box = (await handle.boundingBox())!,
    strip = (await editor
      .getByTestId("media-filmstrip")
      .first()
      .boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    strip.x + strip.width * 0.5,
    strip.y + strip.height / 2,
    { steps: 12 },
  );
  await page.mouse.up();
  await expect
    .poll(async () =>
      Number(await editor.getByLabel("Fim (s)", { exact: true }).inputValue()),
    )
    .toBeLessThan(70);
  await editor.getByText("Textos e legendas", { exact: true }).click();
  await editor.getByLabel("Nova legenda").fill("Meu projeto no Enturma");
  await editor
    .getByRole("button", { name: "Adicionar texto", exact: true })
    .click();
  const caption = editor.getByRole("button", {
    name: "Mover texto 1: Meu projeto no Enturma",
  });
  // Movable text retains a keyboard alternative as well as pointer dragging.
  await caption.focus();
  const before = await caption.getAttribute("style");
  await page.keyboard.press("ArrowUp");
  await expect(caption).not.toHaveAttribute("style", before!);
  await editor
    .getByRole("button", { name: "Escolher capa", exact: true })
    .click();
  const cover = editor.getByRole("slider", { name: "Escolher quadro da capa" });
  await cover.focus();
  await page.keyboard.press("ArrowRight");
  expect(Number(await cover.getAttribute("aria-valuenow"))).toBeGreaterThan(0);
  await editor
    .getByLabel("Capa da galeria")
    .setInputFiles({ name: "capa.png", mimeType: "image/png", buffer: png });
  await expect(
    editor.getByText("Capa selecionada: capa.png", { exact: false }),
  ).toBeVisible();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await editor.scrollIntoViewIfNeeded();
    for (const theme of ["light", "dark"]) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
        delete document.documentElement.dataset.palette;
      }, theme);
      await page.screenshot({
        path: info.outputPath(`studio-${width}-${theme}.png`),
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
    }
  }
  // A page switch must preserve edits, text and the imported cover.
  const nav = page.getByRole("navigation", { name: "Ambientes do Social" });
  await nav.getByRole("button", { name: "Feed", exact: true }).click();
  await nav.getByRole("button", { name: "Criar", exact: true }).click();
  await expect(editor.getByLabel("Texto 1", { exact: true })).toHaveValue(
    "Meu projeto no Enturma",
  );
});

test("Social profile avatar, plain actions, comment media and keyboard overlay", async ({
  page,
  request,
}, info) => {
  const me = await student(request, "Perfil e conversa"),
    headers = { Authorization: `Bearer ${me.accessToken}` };
  expect(
    (
      await request.post(`${backend}/api/v1/users/me/avatar`, {
        headers,
        multipart: {
          file: { name: "avatar.png", mimeType: "image/png", buffer: png },
        },
      })
    ).ok(),
  ).toBe(true);
  const id = await publish(request, me, "Conversa do Studio com privacidade");
  const upload = await request.post(
    `${backend}/api/v1/social/posts/${id}/comment-media`,
    {
      headers,
      multipart: {
        file: { name: "figurinha.png", mimeType: "image/png", buffer: png },
      },
    },
  );
  expect(upload.ok()).toBe(true);
  expect(
    (
      await request.post(`${backend}/api/v1/social/posts/${id}/comments`, {
        headers,
        data: {
          id: randomUUID(),
          body: "Uma figurinha no comentario",
          parentId: null,
          mediaId: (await upload.json()).id,
        },
      })
    ).ok(),
  ).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await enter(page, me);
  await page.getByRole("button", { name: "Meu perfil social" }).click();
  const profile = page.getByRole("dialog", { name: "Perfil social" });
  const avatar = profile
    .locator(".social-profile-intro .identity-avatar")
    .first();
  await expect(avatar).toBeVisible();
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const size = (await avatar.boundingBox())!;
    expect(Math.abs(size.width - size.height)).toBeLessThan(1);
    expect(size.width).toBeGreaterThanOrEqual(70);
    await page.screenshot({
      path: info.outputPath(`studio-profile-${width}.png`),
    });
  }
  await profile.getByRole("button", { name: "Fechar", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  const card = page.locator(`[data-post="${id}"]`).first();
  await expect(card).toBeVisible();
  const like = card.getByRole("button", { name: /^Curtir/ });
  await expect(like).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await card.getByRole("button", { name: /^Coment\u00e1rios/ }).click();
  const comments = page.getByRole("dialog", {
    name: "Conversa da publica\u00e7\u00e3o",
  });
  await expect(comments.locator(".social-comment-media")).toBeVisible();
  await comments
    .getByRole("button", { name: /^Curtir coment\u00e1rio/ })
    .first()
    .click();
  await expect(
    comments.getByRole("button", { name: "Curtir coment\u00e1rio \u00b7 1" }),
  ).toHaveAttribute("aria-pressed", "true");
  await comments
    .getByRole("textbox", { name: "Seu coment\u00e1rio" })
    .fill("Texto com emoji ");
  await comments
    .getByRole("button", { name: /^Inserir emoji/ })
    .first()
    .click();
  await comments
    .getByRole("button", { name: "Enviar coment\u00e1rio" })
    .click();
  await expect(
    comments
      .locator(".social-comment-copy")
      .filter({ hasText: "Texto com emoji" }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("studio-comments-mobile.png"),
  });
  const shellHeight = (await page
    .locator(".social-active-shell")
    .boundingBox())!.height;
  await comments.getByRole("textbox").focus();
  await page.evaluate(() =>
    document.documentElement.style.setProperty(
      "--native-keyboard-bottom",
      "300px",
    ),
  );
  await expect
    .poll(async () => {
      const rect = (await comments.boundingBox())!;
      return Math.round(rect.y + rect.height);
    })
    .toBeLessThanOrEqual(545);
  expect(
    Math.abs(
      (await page.locator(".social-active-shell").boundingBox())!.height -
        shellHeight,
    ),
  ).toBeLessThan(2);
  await page.evaluate(() =>
    document.documentElement.style.removeProperty("--native-keyboard-bottom"),
  );
});

test("LiveKit: host publishes, viewer receives real video/chat and both see the ending", async ({
  page,
  request,
  browser,
}, info) => {
  test.skip(
    process.env.E2E_LIVEKIT !== "true",
    "Requires isolated LiveKit fixture, never production credentials",
  );
  test.setTimeout(120000);
  const author = await student(request, "Anfitriao ao vivo"),
    viewer = await student(request, "Estudante assistindo");
  await page.context().grantPermissions(["camera", "microphone"]);
  await enter(page, author);
  await page.getByRole("button", { name: "Iniciar live", exact: true }).click();
  const setup = page.getByRole("dialog", { name: "Iniciar live", exact: true });
  await setup.getByLabel("T\u00edtulo").fill("Aula de programacao ao vivo");
  await setup.getByRole("button", { name: "Iniciar transmiss\u00e3o" }).click();
  const host = page.getByRole("dialog", { name: "Live no Enturma" });
  await expect(
    host.getByRole("button", { name: "Silenciar microfone" }),
  ).toBeEnabled({ timeout: 30000 });
  await expect(host.locator(".social-live-tracks video")).toHaveJSProperty(
    "readyState",
    4,
  );
  const list = await request.get(`${backend}/api/v1/social/live`, {
    headers: { Authorization: `Bearer ${author.accessToken}` },
  });
  const live = (await list.json()).find(
    (item: { authorId: string }) => item.authorId === author.userId,
  );
  expect(live?.state).toBe("LIVE");
  const grant = await request.post(
    `${backend}/api/v1/social/live/${live.id}/token`,
    { headers: { Authorization: `Bearer ${viewer.accessToken}` } },
  );
  expect(grant.ok()).toBe(true);
  const jwt = JSON.parse(
    Buffer.from(
      (await grant.json()).token.split(".")[1],
      "base64url",
    ).toString(),
  );
  expect(jwt.video.canPublish).toBe(false);
  expect(jwt.video.canPublishData).toBe(true);
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  try {
    const audience = await context.newPage();
    await enter(audience, viewer);
    await audience
      .getByRole("button", { name: "Assistir live de Anfitriao ao vivo" })
      .click();
    const player = audience.getByRole("dialog", { name: "Live no Enturma" });
    await expect(player.locator(".social-live-tracks video")).toHaveJSProperty(
      "readyState",
      4,
      { timeout: 30000 },
    );
    await expect(
      player.getByRole("button", { name: "Desligar c\u00e2mera" }),
    ).toHaveCount(0);
    await player
      .getByRole("textbox", { name: "Mensagem na live" })
      .fill("Recebendo o video e o chat");
    await player
      .getByRole("button", { name: "Enviar mensagem na live" })
      .click();
    await expect(host.getByRole("log")).toContainText(
      "Recebendo o video e o chat",
    );
    await audience.screenshot({
      path: info.outputPath("studio-live-viewer-mobile.png"),
    });
    await page.screenshot({
      path: info.outputPath("studio-live-host-desktop.png"),
    });
    await host
      .getByRole("button", { name: "Encerrar live", exact: true })
      .click();
    await page
      .getByRole("dialog", { name: "Encerrar sua live?" })
      .getByRole("button", { name: "Encerrar live", exact: true })
      .click();
    await expect(
      host.getByRole("heading", { name: "Esta live terminou" }),
    ).toBeVisible();
    await expect(
      player.getByRole("heading", { name: "Esta live terminou" }),
    ).toBeVisible({ timeout: 20000 });
  } finally {
    await context.close();
    await request.post(`${backend}/api/v1/social/live/${live.id}/end`, {
      headers: { Authorization: `Bearer ${author.accessToken}` },
    });
  }
});
