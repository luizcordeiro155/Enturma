import { test } from "./student-fixture";
import { authenticate } from "./session";
import { expect, type APIRequestContext } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const backend = process.env.E2E_API_URL ?? "http://localhost:8080";

test("Social scroll owner uses the viewport without changing other page gutters", async ({ page }) => {
  const styles = ["src/app/responsive-shell.css", "src/components/social/social.css"]
    .map((file) => readFileSync(file, "utf8")).join("\n");
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.setContent(`<style>${styles}</style><div class="social-active-shell"></div>`);
  await expect(page.locator("html")).toHaveCSS("scrollbar-gutter", "auto");
  await page.locator(".social-active-shell").evaluate((el) => el.remove());
  await expect(page.locator("html")).toHaveCSS("scrollbar-gutter", "stable");
});

// Exercise the real stylesheet cascade without requiring an API or account.
// A lower-specificity contain rule must not leave feed videos using cover.
test("feed video CSS preserves the full frame at mobile and desktop sizes", async ({ page }) => {
  const styles = ["social.css", "social-3.css", "social-3-continuation.css", "social-studio.css"]
    .map((file) => readFileSync(`src/components/social/${file}`, "utf8"))
    .join("\n");
  // Browser zoom changes the CSS viewport. Include the effective viewports of
  // a 1348x596 window at 80%, 100%, 125%, 150% and 200%, plus phone/wide screens.
  for (const [width, height] of [
    [1685, 745], [1348, 596], [1078, 477], [899, 397], [674, 298],
    [390, 844], [1366, 768], [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    await page.setContent(`<style>${styles}</style>
      <main class="social-page"><article class="social-post" style="width:min(500px,100%)">
        <div class="social-post-media"><div class="social-carousel" data-single="true" data-has-video="true" style="--social-media-aspect:.75">
          <div class="social-carousel-track"><figure><video width="180" height="320"></video></figure></div>
        </div></div>
      </article></main>`);
    const video = page.locator("video");
    await expect(video).toHaveCSS("object-fit", "contain", { timeout: 1000 });
    const frame = (await page.locator(".social-carousel").boundingBox())!;
    const bounds = (await video.boundingBox())!;
    expect(bounds.height).toBeLessThanOrEqual(Math.min(640, Math.max(220, height - 180)) + 1);
    expect(bounds.width).toBeLessThanOrEqual(501);
    expect(bounds.x).toBeGreaterThanOrEqual(frame.x);
    expect(bounds.y).toBeGreaterThanOrEqual(frame.y);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(frame.x + frame.width + 1);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(frame.y + frame.height + 1);
  }
});

async function student(request: APIRequestContext, name: string) {
  const tag = randomUUID().slice(0, 8);
  const response = await request.post(`${backend}/api/v1/auth/register`, {
    data: {
      name,
      username: `social_${tag}`,
      email: `social-${tag}@example.test`,
      password: "social-test-123",
      device: "Social E2E",
    },
  });
  expect(response.ok()).toBe(true);
  return { ...(await response.json()), username: `social_${tag}` } as {
    userId: string;
    accessToken: string;
    refreshToken: string;
    username: string;
  };
}
function asUser(token: string) {
  return { Authorization: `Bearer ${token}` };
}

test("Social navigation: mobile dock, academic menu and opening once per app document", async ({
  page,
  request,
}, info) => {
  const me = await student(request, "Navegação Social");
  const preferences = await request.put(
    `${backend}/api/v1/users/me/experience`,
    {
      headers: asUser(me.accessToken),
      data: {
        theme: "ENTURMA",
        fontScale: 1,
        highContrast: false,
        reducedMotion: false,
        enhancedFocus: true,
      },
    },
  );
  expect(preferences.ok()).toBe(true);
  await authenticate(page.context(), me);
  let eligible = false;
  await page.route("**/api/backend/learning/access", (route) =>
    route.fulfill({ json: { eligible } }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() =>
    localStorage.setItem(
      "enturma-experience",
      JSON.stringify({ theme: "ENTURMA" }),
    ),
  );
  await page.goto("/social");
  const opening = page.getByRole("dialog", {
    name: "Bem-vindo ao Enturma Social",
  });
  await expect(opening).toBeVisible();
  await expect(opening.locator("[data-brand-book]")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-palette", "enturma");
  // Capture the arrived book, rather than the first, zero-scale entry frame.
  await page.waitForTimeout(600);
  await page.screenshot({
    path: info.outputPath("social-opening-enturma.png"),
  });
  // The player finishes automatically; no overlay can hold up navigation.
  await expect(opening).not.toBeVisible({ timeout: 8000 });
  const social = page.getByRole("navigation", { name: "Ambientes do Social" });
  await expect(social).toBeVisible();
  const dock = await page.locator(".social-navigation").boundingBox();
  expect(dock!.height).toBeLessThanOrEqual(68);
  await expect(
    social.getByRole("button", { name: "Feed", exact: true }),
  ).toHaveCSS("font-size", "10px");
  await expect(
    page.getByRole("navigation", { name: "Navegação mobile" }),
  ).toHaveCount(0);
  await expect(
    social.getByRole("button", { name: /^(Feed|Clips|Criar)$/ }),
  ).toHaveText(["Feed", "Clips", "Criar"]);
  await expect(
    social.getByRole("button", { name: "Meu perfil social" }),
  ).toBeVisible();
  await expect(social.getByRole("link", { name: "Mensagens" })).toHaveAttribute(
    "href",
    "/friends",
  );
  await expect(
    page
      .locator(".social-header")
      .getByRole("button", { name: "Explorar", exact: true }),
  ).toBeVisible();
  // The approved Figma layout uses a bottom dock and a 76px icon rail.
  for (const width of [390, 820, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    const nav = page.locator(".social-navigation");
    const box = await nav.boundingBox();
    if (width <= 760) expect(box!.y).toBeGreaterThan(400);
    else expect(box!.x).toBeLessThan(40);
    const label = await nav
      .getByRole("button", { name: "Feed", exact: true })
      .locator("span")
      .last()
      .boundingBox();
    // The compact rail keeps the label for assistive technology but clips it visually.
    expect(label!.width > 2).toBe(width <= 760);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .locator(".topbar")
    .getByRole("link", { name: "Início do Enturma" })
    .click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.locator(".enturma-launch-overlay")).toHaveCount(0, {
    timeout: 15000,
  });
  const main = page.getByRole("navigation", { name: "Navegação mobile" });
  expect(await main.getByRole("link").allTextContents()).toEqual([
    "Início",
    "Salas",
    "Social Entu",
    "Comunidade",
    "Amigos",
  ]);
  await main.getByRole("button", { name: "Mais opções" }).click();
  const more = page.getByRole("dialog", { name: "Mais opções do Enturma" });
  await expect(
    more.getByRole("link", { name: "Programação", exact: true }),
  ).toHaveCount(0);
  await expect(more.getByRole("link", { name: "Cadernos IA" })).toBeVisible();
  await more.getByRole("button", { name: "Fechar menu" }).click();
  eligible = true;
  await page.evaluate(() =>
    dispatchEvent(new Event("enturma-profile-updated")),
  );
  await main.getByRole("button", { name: "Mais opções" }).click();
  await expect(
    more.getByRole("link", { name: "Programação", exact: true }),
  ).toBeVisible();
  const menu = await more.getByRole("link").allTextContents();
  expect(menu.indexOf("Cadernos IA")).toBe(menu.indexOf("Programação") + 1);
  await page.screenshot({
    path: info.outputPath("mobile-more-academic-menu.png"),
  });
  await more.getByRole("button", { name: "Fechar menu" }).click();
  await main.getByRole("link", { name: "Social Entu" }).click();
  await expect(social).toBeVisible();
  await expect(opening).toHaveCount(0);
  await social.getByRole("button", { name: "Clips", exact: true }).click();
  await social.getByRole("button", { name: "Feed", exact: true }).click();
  await expect(opening).toHaveCount(0);
  for (const width of [390, 820, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const box = await social.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(900);
    await page.screenshot({
      path: info.outputPath(`social-navigation-${width}.png`),
    });
  }
  // Reload represents a new app document; ordinary route changes above do not.
  await page.reload();
  await expect(opening).toBeVisible();
  await opening.getByRole("button", { name: "Explorar o Social" }).click();
  await expect(opening).toHaveCount(0);
});
async function publish(
  request: APIRequestContext,
  token: string,
  body: string,
  kind = "POST",
) {
  const id = randomUUID(),
    headers = asUser(token);
  const draft = await request.put(`${backend}/api/v1/social/drafts`, {
    headers,
    data: { id, kind, body, visibility: "PUBLIC", version: 0, mediaIds: [] },
  });
  expect(draft.ok(), await draft.text()).toBe(true);
  const response = await request.post(
    `${backend}/api/v1/social/posts/${id}/publish`,
    { headers, data: { version: (await draft.json()).version } },
  );
  expect(response.ok(), await response.text()).toBe(true);
  return id;
}

test("Social real: publicar, comentar, seguir, preservar leitura e rascunho em todos os temas", async ({
  page,
  request,
}, info) => {
  test.setTimeout(180000);
  const ana = await student(request, "Ana · Engenharia"),
    bia = await student(request, "Bia · Computação");
  for (let i = 0; i < 6; i++)
    await publish(
      request,
      ana.accessToken,
      `Ideia de estudo ${i}: compartilhar o raciocínio ajuda a aprender. #engenharia`,
    );
  const postId = await publish(
    request,
    ana.accessToken,
    `Projeto de pontes: testamos estruturas com materiais reciclados. @${bia.username} #engenharia`,
  );
  await publish(
    request,
    ana.accessToken,
    "Um novo dia de descobertas na universidade.",
    "STORY",
  );
  await authenticate(page.context(), bia);
  await page.goto("/social");
  await expect(
    page.getByRole("heading", { name: "Enturma Social.", level: 1 }),
  ).toBeVisible();
  const feed = page.locator(".social-feed-view .social-stream:visible");
  const card = feed.locator(`[data-post="${postId}"]`);
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Curtir · 0", exact: true }).click();
  await expect(
    card.getByRole("button", { name: "Curtir · 1", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await card.getByRole("button", { name: "Salvar publicação" }).click();
  await expect(
    card.getByRole("button", { name: "Salvar publicação" }),
  ).toHaveAttribute("aria-pressed", "true");
  await card.getByRole("button", { name: "Comentários · 0" }).click();
  const comments = page.getByRole("dialog", { name: "Conversa da publicação" });
  await expect(comments).toBeVisible();
  await comments
    .getByLabel("Seu comentário")
    .fill("Vamos comparar as estruturas na próxima aula.");
  await comments.getByRole("button", { name: "Enviar comentário" }).click();
  await expect(
    comments.getByText("Vamos comparar as estruturas na próxima aula."),
  ).toBeVisible();
  await comments.getByRole("button", { name: "Fechar", exact: true }).click();
  await card.getByRole("button", { name: /Ana · Engenharia/ }).click();
  const profile = page.getByRole("dialog", { name: "Perfil social" });
  await profile.getByRole("button", { name: "Seguir", exact: true }).click();
  await expect(
    profile.getByRole("button", { name: "Seguindo", exact: true }).first(),
  ).toBeVisible();
  await expect(profile.locator(".social-profile-counts")).toContainText(
    "1 Seguidores",
  );
  await profile.getByRole("button", { name: "Fechar", exact: true }).click();
  const feedScroller = page.locator(".social-feed-scroll:visible");
  await feedScroller.evaluate((el) => {
    el.scrollTop = 500;
    el.setAttribute("data-reading-kept", "yes");
  });
  const position = await feedScroller.evaluate((el) => el.scrollTop);
  expect(position).toBeGreaterThan(0);
  const navigation = page.getByRole("navigation", {
    name: "Ambientes do Social",
  });
  await navigation.getByRole("button", { name: "Clips", exact: true }).click();
  await expect(page.locator(".social-clips-shell")).toBeVisible();
  await navigation.getByRole("button", { name: "Feed", exact: true }).click();
  expect(await feedScroller.evaluate((el) => el.scrollTop)).toBe(position);
  await expect(feedScroller).toHaveAttribute("data-reading-kept", "yes");
  await navigation.getByRole("button", { name: "Criar", exact: true }).click();
  const editor = page.getByRole("region", { name: "Central de criação" });
  const draftText = `Meu rascunho continua aqui. #computação ${bia.username}`;
  await editor.getByLabel("O que você quer compartilhar?").fill(draftText);
  await navigation.getByRole("button", { name: "Feed", exact: true }).click();
  await navigation.getByRole("button", { name: "Criar", exact: true }).click();
  await expect(editor.getByLabel("O que você quer compartilhar?")).toHaveValue(
    draftText,
  );
  await editor.getByRole("button", { name: "Publicar Post" }).click();
  await expect(feed.getByText(draftText, { exact: true })).toBeVisible();
  const detail = await request.get(`${backend}/api/v1/social/posts/${postId}`, {
    headers: asUser(bia.accessToken),
  });
  expect(await detail.json()).toMatchObject({
    likes: 1,
    comments: 1,
    mine: expect.arrayContaining(["LIKE", "SAVE"]),
  });
  await page
    .getByLabel("Pesquisar pessoas, hashtags e publicações")
    .fill("Meu rascunho continua");
  await page.getByRole("button", { name: "Pesquisar", exact: true }).click();
  await expect(feed.getByText(draftText, { exact: true })).toBeVisible();
  const filtered = page.waitForResponse(
    (r) =>
      r.url().includes("/social/feed?") &&
      r.url().includes("tab=following") &&
      r.url().includes("q="),
  );
  await page.getByRole("tab", { name: "Seguindo", exact: true }).click();
  expect((await filtered).ok()).toBe(true);
  await expect(feed.locator(".social-post")).toHaveCount(0);
  await page.getByRole("button", { name: "Voltar à leitura" }).click();
  await page.getByRole("tab", { name: "Para Você", exact: true }).click();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 960 });
    for (const theme of ["light", "dark", "enturma"]) {
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme =
          theme === "light" ? "light" : "dark";
        if (theme === "enturma")
          document.documentElement.dataset.palette = theme;
        else delete document.documentElement.dataset.palette;
      }, theme);
      await feed.evaluate((el) => {
        el.scrollTop = 0;
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      await expect(feed.locator(".social-post").first()).toBeVisible();
      const header = await page.locator(".social-header").boundingBox();
      expect(header!.y).toBeGreaterThanOrEqual(0);
      const contrast = await page
        .locator(
          ".social-navigation-items button, .social-navigation-items a, .social-feed-toolbar .social-tabs button",
        )
        .evaluateAll((buttons) =>
          buttons.map((button) => {
            const luminance = (value: string) =>
              (value.match(/[\d.]+/g) ?? [])
                .slice(0, 3)
                .map(Number)
                .map((v) => {
                  const n = v / 255;
                  return n <= 0.04045
                    ? n / 12.92
                    : ((n + 0.055) / 1.055) ** 2.4;
                })
                .reduce(
                  (sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i],
                  0,
                );
            let ancestor: Element | null = button;
            let background = "rgba(0, 0, 0, 0)";
            while (
              ancestor &&
              (background === "rgba(0, 0, 0, 0)" ||
                background === "transparent")
            ) {
              background = getComputedStyle(ancestor).backgroundColor;
              ancestor = ancestor.parentElement;
            }
            const foreground = luminance(getComputedStyle(button).color),
              back = luminance(background);
            return (
              (Math.max(foreground, back) + 0.05) /
              (Math.min(foreground, back) + 0.05)
            );
          }),
        );
      for (const ratio of contrast) expect(ratio).toBeGreaterThanOrEqual(4.5);
      await page.screenshot({
        path: info.outputPath(`social-feed-${width}-${theme}.png`),
      });
    }
  }
  await navigation.getByRole("button", { name: "Criar", exact: true }).click();
  await page.screenshot({ path: info.outputPath("social-editor-mobile.png") });
});

test("Social: conta privada, aprovação de marcação, expiração e bloqueio não cedem à chamada direta", async ({
  request,
}) => {
  const ana = await student(request, "Autora privada"),
    bia = await student(request, "Visitante estudante");
  const headers = asUser(ana.accessToken),
    other = asUser(bia.accessToken);
  expect(
    (
      await request.put(`${backend}/api/v1/social/preferences`, {
        headers,
        data: {
          privateAccount: true,
          recommendations: false,
          autoplay: false,
          interests: ["java"],
          automatic: false,
          order: ["feed", "clips", "create"],
        },
      })
    ).ok(),
  ).toBe(true);
  const id = await publish(
    request,
    ana.accessToken,
    `Projeto privado @${bia.username}`,
  );
  expect(
    (
      await request.get(`${backend}/api/v1/social/posts/${id}`, {
        headers: other,
      })
    ).status(),
  ).toBe(404);
  const followed = await request.put(
    `${backend}/api/v1/social/people/${ana.userId}/follow`,
    { headers: other, data: { active: true } },
  );
  expect(await followed.json()).toMatchObject({ status: "PENDING" });
  await request.put(`${backend}/api/v1/social/people/${bia.userId}/request`, {
    headers,
    data: { active: true },
  });
  expect(
    (
      await request.get(`${backend}/api/v1/social/posts/${id}`, {
        headers: other,
      })
    ).ok(),
  ).toBe(true);
  const mentioned = await publish(
    request,
    ana.accessToken,
    `Nova marcação autorizada @${bia.username}`,
  );
  expect(
    await (
      await request.get(`${backend}/api/v1/social/mentions`, { headers: other })
    ).json(),
  ).toEqual(
    expect.arrayContaining([expect.objectContaining({ id: mentioned })]),
  );
  await request.put(`${backend}/api/v1/social/posts/${mentioned}/mention`, {
    headers: other,
    data: { active: true },
  });
  const tagged = await request.get(
    `${backend}/api/v1/social/feed?kind=ALL&author=${bia.userId}&collection=tagged`,
    { headers: other },
  );
  expect((await tagged.json()).items).toEqual(
    expect.arrayContaining([expect.objectContaining({ id: mentioned })]),
  );
  expect(
    (
      await request.post(`${backend}/api/v1/blocks/${bia.userId}`, { headers })
    ).ok(),
  ).toBe(true);
  expect(
    (
      await request.get(`${backend}/api/v1/social/posts/${id}`, {
        headers: other,
      })
    ).status(),
  ).toBe(404);
  expect(
    (
      await request.get(`${backend}/api/v1/social/feed`, { headers: other })
    ).ok(),
  ).toBe(true);
});

test("editor de vídeo real: importar, cortar, dividir, capa e rascunho; controles sem overflow", async ({
  page,
  request,
}, info) => {
  const user = await student(request, "Estudante criador");
  await authenticate(page.context(), user);
  // UI-only capability override. Publication/processing stays disabled on the API;
  // a separate Spring integration test runs the real FFmpeg storage pipeline.
  await page.route("**/api/backend/social/capabilities", async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      json: { ...(await response.json()), media: true },
    });
  });
  await page.goto("/social");
  await page
    .getByRole("navigation", { name: "Ambientes do Social" })
    .getByRole("button", { name: "Criar", exact: true })
    .click();
  await page.getByRole("button", { name: "Clip · até 90s" }).click();
  const file = info.outputPath("source.mp4");
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
      "testsrc2=size=320x240:rate=30",
      "-t",
      "3",
      "-c:v",
      "libx264",
      file,
    ],
    { timeout: 30000 },
  );
  await page.getByLabel("Escolher mídia").setInputFiles(file);
  const editor = page.getByRole("region", { name: "Editor de vídeo" });
  await expect(editor).toBeVisible();
  await editor.getByLabel("Começo (s)").fill("0.5");
  await editor.getByLabel("Fim (s)", { exact: true }).fill("2.5");
  await editor.getByLabel("Posição de reprodução").fill("1");
  await editor.getByRole("button", { name: "Dividir aqui" }).click();
  await expect(editor.getByRole("button", { name: /Trecho 2/ })).toBeVisible();
  await editor.getByRole("button", { name: "Desfazer edição" }).click();
  await expect(editor.getByRole("button", { name: /Trecho 2/ })).toHaveCount(0);
  await editor.getByText("Textos e legendas", { exact: true }).click();
  await editor.getByLabel("Nova legenda").fill("Uma ideia puxa outra");
  await editor.getByRole("button", { name: "Adicionar texto" }).click();
  await expect(editor.locator(".social-edit-caption")).toHaveText(
    "Uma ideia puxa outra",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await editor.scrollIntoViewIfNeeded();
  const workspaceHeader = await page.locator(".social-header").boundingBox();
  expect(workspaceHeader!.y).toBeGreaterThanOrEqual(0);
  await page.screenshot({
    path: info.outputPath("social-video-editor-mobile.png"),
  });
  // Mídia ainda não enviada: a ação principal envia, processa e publica em um só
  // passo. A publicação direta só reaparece quando a mídia já está READY.
  await expect(
    page.getByRole("button", { name: "Enviar e publicar", exact: true }),
  ).toBeEnabled();
  await expect(page.getByRole("button", { name: "Publicar Clip" })).toHaveCount(
    0,
  );
});

test("câmera: gravação WebM real sem Duration abre o editor e preserva o rascunho", async ({
  page,
  request,
}, info) => {
  const user = await student(request, "Estudante da câmera");
  await authenticate(page.context(), user);
  await page.context().grantPermissions(["camera", "microphone"]);
  await page.route("**/api/backend/social/capabilities", async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      json: { ...(await response.json()), media: true },
    });
  });
  await page.goto("/social");
  const navigation = page.getByRole("navigation", {
    name: "Ambientes do Social",
  });
  await navigation.getByRole("button", { name: "Criar", exact: true }).click();
  await page.getByRole("button", { name: "Clip · até 90s" }).click();
  await page.getByRole("button", { name: "Gravar", exact: true }).click();
  const camera = page.getByRole("dialog", { name: "Gravar um Clip" });
  await camera.getByRole("button", { name: "Ativar câmera" }).click();
  await camera.getByRole("button", { name: "Gravar", exact: true }).click();
  await expect(camera.getByRole("status")).toHaveText("Gravando · 3s / 90s");
  await camera.getByRole("button", { name: "Finalizar" }).click();
  const editor = page.getByRole("region", { name: "Editor de vídeo" });
  await expect(editor).toBeVisible();
  const end = Number(
    await editor.getByLabel("Fim (s)", { exact: true }).inputValue(),
  );
  expect(end).toBeGreaterThan(2);
  expect(end).toBeLessThan(10);
  const original = info.outputPath("camera-recording.webm");
  const bytes = await editor
    .locator("video")
    .evaluate(async (video) =>
      Array.from(
        new Uint8Array(
          await (await fetch(video.getAttribute("src")!)).arrayBuffer(),
        ),
      ),
    );
  writeFileSync(original, Buffer.from(bytes));
  const metadata = JSON.parse(
    execFileSync(
      "ffprobe",
      ["-v", "error", "-show_format", "-of", "json", original],
      { timeout: 10000 },
    ).toString(),
  );
  expect(metadata.format.duration).toBeUndefined();
  await navigation.getByRole("button", { name: "Feed", exact: true }).click();
  await navigation.getByRole("button", { name: "Criar", exact: true }).click();
  await expect(editor).toBeVisible();
  await expect(editor.getByLabel("Fim (s)", { exact: true })).toHaveValue(
    String(end),
  );
});

test("player Clips: um vídeo ativo, navegação por teclado e pausa ao sair", async ({
  page,
  request,
}, info) => {
  const user = await student(request, "Criador de Clips");
  await authenticate(page.context(), user);
  const file = info.outputPath("player-fixture.mp4");
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
      "testsrc2=size=180x320:rate=30",
      "-t",
      "3",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      file,
    ],
    { timeout: 30000 },
  );
  const bytes = readFileSync(file);
  const posts = Array.from({ length: 4 }, (_, i) => ({
    id: randomUUID(),
    authorId: user.userId,
    name: "Criador de Clips",
    username: user.username,
    kind: "CLIP",
    body: `Descoberta ${i + 1} na universidade`,
    publishedAt: new Date().toISOString(),
    pinned: false,
    likes: 0,
    comments: 0,
    reposts: 0,
    mine: [],
    media: [
      {
        id: randomUUID(),
        kind: "VIDEO",
        durationMs: 3000,
        width: 180,
        height: 320,
      },
    ],
  }));
  // Isolated player contract fixture, not a publication bypass. Spring tests exercise
  // actual authorization, export, storage, duration and publication independently.
  await page.route("**/api/backend/social/feed?**", (route) => {
    const kind = new URL(route.request().url()).searchParams.get("kind");
    if (kind !== "CLIP" && kind !== "ALL") return route.fallback();
    return route.fulfill({
      json: {
        items:
          kind === "ALL"
            ? [
                {
                  ...posts[0],
                  id: "text-post",
                  kind: "POST",
                  body: "Uma descoberta no feed geral",
                  media: [],
                },
                posts[2],
              ]
            : posts,
        nextCursor: "",
        snapshot: new Date().toISOString(),
      },
    });
  });
  await page.route("**/api/backend/social/media/*/content*", (route) => {
    if (new URL(route.request().url()).searchParams.has("thumbnail"))
      return route.fulfill({ status: 204 });
    return route.fulfill({ contentType: "video/mp4", body: bytes });
  });
  await page.route("**/api/backend/social/posts/*", (route) => {
    const id = new URL(route.request().url()).pathname.split("/").at(-1);
    const item = posts.find((post) => post.id === id);
    return item ? route.fulfill({ json: item }) : route.fallback();
  });
  await page.goto("/social");
  const navigation = page.getByRole("navigation", {
    name: "Ambientes do Social",
  });
  const feed = page.locator(".social-feed-view .social-stream:visible");
  await expect(feed.locator('[data-kind="POST"]')).toBeVisible();
  await expect(feed.locator('[data-kind="CLIP"]')).toBeVisible();
  const logo = page.locator(".social-navigation-brand");
  await logo.hover();
  await expect(logo).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  for (const width of [390, 1366, 1920]) {
    const height = width === 1366 ? 768 : 844;
    await page.setViewportSize({ width, height });
    await expect
      .poll(async () => {
        const box = (await page.locator(".social-feed-scroll").boundingBox())!;
        return Math.abs(width - box.x - box.width);
      })
      .toBeLessThanOrEqual(1);
    const video = feed.locator("video");
    await expect(video).toHaveCSS("object-fit", "contain");
    expect((await video.boundingBox())!.height).toBeLessThanOrEqual(
      Math.min(640, height - 180) + 1,
    );
    expect(
      (await feed.locator('[data-kind="CLIP"]').boundingBox())!.width,
    ).toBeLessThanOrEqual(501);
    await page.screenshot({
      path: info.outputPath(`social-feed-video-${width}.png`),
    });
  }
  const scroll = page.locator(".social-feed-scroll");
  await scroll.evaluate((el) => {
    el.scrollTop = 180;
  });
  const clipLink = feed.getByRole("link", { name: "Assistir nos Clips" });
  // click() scrolls a partially visible video into view before navigating.
  // Record the reading position after that actionability scroll, not before it.
  await clipLink.scrollIntoViewIfNeeded();
  const before = await scroll.evaluate((el) => el.scrollTop);
  expect(before).toBeGreaterThan(0);
  await clipLink.click();
  await expect(page).toHaveURL(new RegExp(`post=${posts[2].id}`));
  await expect(
    navigation.getByRole("button", { name: "Clips", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  const clips = page.locator(".social-clips");
  await expect(clips.locator('[data-clip-index="0"]')).toHaveAttribute(
    "data-clip-id",
    posts[2].id,
  );
  await expect(clips.locator(`[data-clip-id="${posts[2].id}"]`)).toHaveCount(1);
  await page.goBack();
  await expect(
    navigation.getByRole("button", { name: "Feed", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  expect(await scroll.evaluate((el) => el.scrollTop)).toBe(before);
  // Opening the same Clip again starts there, rather than resuming another item.
  await feed.getByRole("link", { name: "Assistir nos Clips" }).click();
  await expect(
    navigation.getByRole("button", { name: "Clips", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  const playing = () =>
    clips
      .locator("video")
      .evaluateAll((videos) =>
        videos.map((video) => !(video as HTMLVideoElement).paused),
      );
  await expect.poll(playing).toEqual([true, false, false, false]);
  await clips.focus();
  await page.keyboard.press("ArrowDown");
  await expect.poll(playing).toEqual([false, true, false, false]);
  await expect(clips.locator("video").nth(3)).not.toHaveAttribute("src", /.+/);
  for (const width of [1366, 1920, 390]) {
    await page.setViewportSize({ width, height: width === 1366 ? 768 : 844 });
    // Crossing the mobile breakpoint starts the pager's transform transition.
    // Measure the media only after that movement, independently of playback.
    await page.locator(".social-pager-track").evaluate(async (track) => {
      await Promise.all(
        track.getAnimations().map((animation) => animation.finished),
      );
    });
    const selected = clips.locator('[data-clip-index="1"]');
    await expect.poll(playing).toEqual([false, true, false, false]);
    await expect
      .poll(async () => {
        const frame = await clips.boundingBox();
        const card = await selected.boundingBox();
        return (
          !!frame &&
          !!card &&
          Math.abs(frame.y - card.y) < 2 &&
          Math.abs(frame.height - card.height) < 2
        );
      })
      .toBe(true);
    await expect(selected.locator("video")).toHaveJSProperty("readyState", 4);
    // Full-height Clip: the whole width on a phone, a centred 9:16 column on desktop.
    const size = (await selected.boundingBox())!;
    if (width === 390) {
      expect(size.width).toBeGreaterThanOrEqual(389);
      expect(size.height).toBeGreaterThan(844 * 0.8);
    } else {
      const frame = (await selected
        .locator(".social-clip-video")
        .boundingBox())!;
      expect(frame.width / frame.height).toBeCloseTo(9 / 16, 1);
      const caption = (await selected
        .locator(".social-clip-caption")
        .boundingBox())!;
      const rail = (await selected.locator(".social-clip-rail").boundingBox())!;
      expect(caption.x + caption.width).toBeLessThanOrEqual(frame.x);
      expect(rail.x).toBeGreaterThanOrEqual(frame.x + frame.width);
    }
    const videoBox = (await selected.locator("video").boundingBox())!;
    await selected.locator("video").evaluate((video) => {
      (video as HTMLVideoElement).currentTime = 1;
    });
    await expect
      .poll(async () => {
        const next = (await selected.locator("video").boundingBox())!;
        return (
          Math.abs(next.x - videoBox.x) +
          Math.abs(next.width - videoBox.width) +
          Math.abs(next.y - videoBox.y)
        );
      })
      .toBeLessThan(1);
    expect(
      await clips.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
    await expect(
      selected.getByRole("progressbar", { name: "Progresso do Clip" }),
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: "Seguindo" })).toBeVisible();
    await expect(selected.locator("header")).toBeInViewport({ ratio: 0.99 });
    await expect(selected.locator(".social-post-actions")).toBeInViewport({
      ratio: 0.99,
    });
    await expect(
      page.getByRole("button", { name: "Ativar som dos Clips" }),
    ).toBeInViewport({ ratio: 0.99 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    for (const theme of ["light", "dark", "enturma"]) {
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme =
          theme === "light" ? "light" : "dark";
        if (theme === "enturma")
          document.documentElement.dataset.palette = theme;
        else delete document.documentElement.dataset.palette;
      }, theme);
      await page.screenshot({
        path: info.outputPath(`social-clips-${width}-${theme}.png`),
      });
    }
  }
  await navigation.getByRole("button", { name: "Feed", exact: true }).click();
  await expect.poll(playing).toEqual([false, false, false, false]);
});

test("Social: autor consegue excluir seu Story com confirmação", async ({
  page,
  request,
}) => {
  const author = await student(request, "Autora de Story");
  const id = await publish(
    request,
    author.accessToken,
    "Story temporário para remover.",
    "STORY",
  );
  await authenticate(page.context(), author);
  await page.goto("/social");
  const opening = page.getByRole("dialog", {
    name: "Bem-vindo ao Enturma Social",
  });
  if (await opening.isVisible()) {
    await opening.getByRole("button", { name: "Explorar o Social" }).click();
  }
  const story = page
    .locator(".social-stories .social-story")
    .filter({ hasText: author.username })
    .first();
  await expect(story).toBeVisible();
  await story.click();
  const viewer = page.getByRole("dialog", { name: "Stories da turma" });
  await expect(
    viewer.getByRole("button", { name: "Excluir meu Story" }),
  ).toBeVisible();
  await viewer.getByRole("button", { name: "Excluir meu Story" }).click();
  const confirm = page.getByRole("dialog", { name: "Excluir este Story?" });
  await expect(confirm).toBeVisible();
  await confirm
    .getByRole("button", { name: "Excluir Story", exact: true })
    .click();
  await expect(viewer).not.toBeVisible();
  await expect(story).toHaveCount(0);
  const deleted = await request.get(`${backend}/api/v1/social/posts/${id}`, {
    headers: asUser(author.accessToken),
  });
  expect(deleted.status()).toBe(404);
});
