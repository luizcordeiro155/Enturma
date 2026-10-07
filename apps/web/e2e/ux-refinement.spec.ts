import { test, expect, type APIRequestContext } from "@playwright/test";
import { authenticate } from "./session";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";
import {
  INTRO_FRAMES,
  INTRO_SCENE_FRAMES,
  INTRO_BOOK_PAGES,
} from "../src/components/intro/intro-model";
const backend = process.env.E2E_API_URL || "http://localhost:8080";
const screenshots = join(tmpdir(), "enturma-ux-review");
mkdirSync(screenshots, { recursive: true });
async function user(request: APIRequestContext, name: string) {
  const username = `ux_${randomUUID().slice(0, 8)}`;
  const result = await request.post(`${backend}/api/v1/auth/register`, {
    data: {
      name,
      username,
      email: `${username}@example.test`,
      password: "E2E-password-long-123",
      device: "UX tests",
    },
  });
  expect(result.ok(), await result.text()).toBe(true);
  return { ...(await result.json()), username };
}
test("Remotion intro adapts, pauses, skips, replays and does not remount after navigation", async ({
  page,
  request,
}) => {
  const credentials = await user(request, "Marina Estudante");
  await authenticate(page.context(), credentials);
  await page.addInitScript(() => {
    localStorage.setItem(
      "enturma-experience",
      JSON.stringify({ theme: "DARK" }),
    );
  });
  await request.put(`${backend}/api/v1/users/me/experience`, {
    headers: { Authorization: `Bearer ${credentials.accessToken}` },
    data: {
      theme: "DARK",
      reducedMotion: false,
      fontScale: 1,
      highContrast: false,
      enhancedFocus: true,
    },
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/home");
  const intro = page.getByRole("region", { name: "Apresentação do Enturma" });
  await expect(intro).toBeVisible();
  await intro.scrollIntoViewIfNeeded();
  await expect
    .poll(async () =>
      Number(
        await intro
          .locator("[data-intro-frame]")
          .getAttribute("data-intro-frame"),
      ),
    )
    .toBeGreaterThan(20);
  await intro.getByRole("button", { name: "Pausar apresentação" }).click();
  const narration = intro.locator('audio[src*="enturma-pt-br-presenter"]');
  await expect(narration).toHaveCount(1);
  await expect
    .poll(() => narration.evaluate((audio: HTMLAudioElement) => audio.muted))
    .toBe(true);
  await intro.getByRole("button", { name: "Ouvir narração" }).click();
  await expect(
    intro.getByRole("button", { name: "Silenciar narração" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(() =>
      narration.evaluate((audio: HTMLAudioElement) => ({
        paused: audio.paused,
        muted: audio.muted,
        advancing: audio.currentTime > 0,
        ready: audio.readyState,
      })),
    )
    .toEqual({ paused: false, muted: false, advancing: true, ready: 4 });
  // Turning sound on for the first time starts with the introduction, never mid-sentence.
  expect(
    await narration.evaluate((audio: HTMLAudioElement) => audio.currentTime),
  ).toBeLessThan(2);
  await intro.getByRole("button", { name: "Pausar apresentação" }).click();
  await expect
    .poll(() => narration.evaluate((audio: HTMLAudioElement) => audio.paused))
    .toBe(true);
  await intro
    .getByRole("slider", { name: "Posição da apresentação" })
    .fill("1620");
  await expect
    .poll(() =>
      narration.evaluate((audio: HTMLAudioElement) =>
        Math.abs(audio.currentTime - 27),
      ),
    )
    .toBeLessThan(0.3);
  await expect(intro.getByLabel("Legenda da narração")).toHaveText(
    "Entre nas salas! Reúna seus materiais e estude com inteligência artificial.",
  );
  await intro.getByRole("button", { name: "Silenciar narração" }).click();
  await expect
    .poll(() => narration.evaluate((audio: HTMLAudioElement) => audio.muted))
    .toBe(true);
  await expect(intro).toHaveAttribute("data-layout", "portrait");
  await expect(intro.locator("canvas")).toHaveCount(1);
  await page.screenshot({ path: join(screenshots, "intro-mobile-dark.png") });
  await intro.getByRole("button", { name: "Pular" }).click();
  await expect(intro).toHaveAttribute("data-minimized", "true");
  await expect(intro.locator("canvas")).toHaveCount(0);
  await expect(intro.locator("audio")).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Minhas matérias" }),
  ).toBeAttached();
  await expect(intro).toHaveAttribute("data-minimized", "true");
  await page.getByRole("button", { name: "Assistir apresentação" }).click();
  await expect(intro).toBeVisible();
  await expect
    .poll(async () =>
      Number(
        await intro
          .locator("[data-intro-frame]")
          .getAttribute("data-intro-frame"),
      ),
    )
    .toBeGreaterThan(20);
  await intro.getByRole("button", { name: "Pausar apresentação" }).click();
  for (const frame of [
    ...INTRO_SCENE_FRAMES.slice(0, -1).map((start) => start + 160),
    ...INTRO_BOOK_PAGES.map((cue) => cue.fromFrame + 100),
  ]) {
    await intro
      .getByRole("slider", { name: "Posição da apresentação" })
      .fill(String(frame));
    await expect(intro.locator("[data-intro-frame]")).toHaveAttribute(
      "data-intro-frame",
      String(frame),
    );
    const safe = await intro
      .locator("[data-intro-safe]")
      .evaluateAll((elements) =>
        elements.map((el) => {
          const b = el.getBoundingClientRect();
          return { top: b.top, bottom: b.bottom, left: b.left, right: b.right };
        }),
      );
    expect(
      safe[0].bottom,
      `Text overlaps art at frame ${frame}`,
    ).toBeLessThanOrEqual(safe[1].top + 2);
    for (const bounds of safe) {
      expect(bounds.left).toBeGreaterThanOrEqual(0);
      expect(bounds.right).toBeLessThanOrEqual(390);
    }
  }
  for (const [index, cue] of INTRO_BOOK_PAGES.entries()) {
    await intro
      .getByRole("slider", { name: "Posição da apresentação" })
      .fill(String(cue.fromFrame + 100));
    await expect(intro.locator("[data-book-page]")).toHaveAttribute(
      "data-book-page",
      String(index),
    );
    await expect(intro.getByLabel("Legenda da narração")).toHaveText(cue.text);
    await intro.screenshot({
      path: join(screenshots, `intro-book-mobile-${index}.png`),
    });
  }
  await page.screenshot({
    path: join(screenshots, "intro-mobile-refined.png"),
  });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await expect(intro).toHaveAttribute("data-layout", "desktop");
  await intro
    .getByRole("slider", { name: "Posição da apresentação" })
    .fill(String(INTRO_BOOK_PAGES[0].fromFrame + 100));
  await intro.screenshot({ path: join(screenshots, "intro-book-desktop.png") });
  await intro
    .getByRole("slider", { name: "Posição da apresentação" })
    .fill(String(INTRO_SCENE_FRAMES[9] + 230));
  await intro.screenshot({
    path: join(screenshots, "intro-closing-desktop.png"),
  });
  await page.screenshot({ path: join(screenshots, "intro-desktop-dark.png") });
  await intro.getByRole("button", { name: "Pular" }).click();
  await expect(page.locator("#minhas-materias")).toBeFocused();
  await page
    .getByRole("button", { name: "Ver apresentação novamente" })
    .click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(intro.locator("canvas")).toHaveCount(0);
  await intro.getByRole("button", { name: "Ouvir narração" }).click();
  await expect
    .poll(() =>
      narration.evaluate(
        (audio: HTMLAudioElement) => !audio.muted && !audio.paused,
      ),
    )
    .toBe(true);
  for (const [index, cue] of INTRO_BOOK_PAGES.entries()) {
    await intro
      .getByRole("slider", { name: "Posição da apresentação" })
      .fill(String(cue.fromFrame + 60));
    await expect(intro.locator("[data-book-page]")).toHaveAttribute(
      "data-book-page",
      String(index),
    );
  }
  await intro
    .getByRole("slider", { name: "Posição da apresentação" })
    .fill("3700");
  await expect(intro.locator('[data-intro-scene="9"]')).toBeVisible();
  await expect(intro.getByLabel("Legenda da narração")).toHaveText(
    "Se enturme com o Enturma! Fique por dentro da sua faculdade conosco.",
  );
  await intro
    .getByRole("slider", { name: "Posição da apresentação" })
    .fill(String(INTRO_FRAMES - 10));
  await expect(intro).toHaveAttribute("data-minimized", "true", {
    timeout: 10000,
  });
});

test("private call rings in another route, connects real LiveKit peers and releases media", async ({
  browser,
  request,
}) => {
  test.setTimeout(120000);
  const alice = await user(request, "Alice Chamada"),
    bob = await user(request, "Bruno Chamada");
  const invite = await request.post(`${backend}/api/v1/friends`, {
    headers: { Authorization: `Bearer ${alice.accessToken}` },
    data: { username: bob.username },
  });
  expect(invite.ok()).toBe(true);
  const friendship = await invite.json();
  expect(
    (
      await request.post(`${backend}/api/v1/friends/${friendship.id}/accept`, {
        headers: { Authorization: `Bearer ${bob.accessToken}` },
      })
    ).ok(),
  ).toBe(true);
  const a = await browser.newContext({ permissions: ["microphone", "camera"] });
  const b = await browser.newContext({ permissions: ["microphone", "camera"] });
  for (const context of [a, b])
    await context.addInitScript(() =>
      localStorage.setItem("enturma-intro:v0.3", "seen"),
    );
  // Exercise real LiveKit publishing/subscriptions using a controlled screen track.
  // Native screen-picker permissions still require a manual device check.
  await a.addInitScript(() => {
    navigator.mediaDevices.getDisplayMedia = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 360;
      const context = canvas.getContext("2d")!;
      context.fillStyle = "#173f36";
      context.fillRect(0, 0, 640, 360);
      return canvas.captureStream(10);
    };
  });
  await authenticate(a, alice);
  await authenticate(b, bob);
  const caller = await a.newPage(),
    callee = await b.newPage();
  await callee.setViewportSize({ width: 390, height: 844 });
  try {
    await callee.goto("/forum");
    await caller.goto(`/friends?chat=${friendship.id}`);
    await expect(callee.locator("html")).toHaveAttribute(
      "data-realtime",
      "connected",
      { timeout: 15000 },
    );
    await expect(
      caller.getByRole("button", { name: "Ligar por voz" }),
    ).toBeEnabled({ timeout: 35000 });
    await caller.getByRole("button", { name: "Ligar por voz" }).click();
    await expect(
      callee.getByRole("dialog", { name: "Alice Chamada" }),
    ).toBeVisible({ timeout: 15000 });
    await callee.getByRole("button", { name: "Atender", exact: true }).click();
    for (const page of [caller, callee])
      await expect(page).toHaveURL(/\/calls\//);
    for (const page of [caller, callee])
      await expect(
        page.getByText("Voz conectada", { exact: true }),
      ).toBeVisible({ timeout: 25000 });
    await expect(caller.getByText("2 pessoas na chamada")).toBeVisible();
    await expect(callee.getByTitle("Sair da chamada")).toBeInViewport();
    await caller.getByTitle("Ligar câmera").click();
    await expect(
      callee.locator('.call-member[data-camera="true"] video'),
    ).toBeVisible({ timeout: 20000 });
    await caller.getByTitle("Compartilhar tela").click();
    await expect(
      callee.getByRole("button", { name: "Ver transmissão", exact: true }),
    ).toBeVisible();
    await expect(callee.locator(".call-video-stage video")).toHaveCount(0);
    await callee
      .getByRole("button", { name: "Ver transmissão", exact: true })
      .click();
    await expect(callee.locator(".call-video-stage video")).toBeVisible();
    await expect(
      callee.locator('.call-member[data-camera="true"] video'),
    ).toBeVisible();
    await caller.getByTitle("Parar compartilhamento").click();
    await expect(callee.locator(".call-video-stage video")).toHaveCount(0);
    await expect(
      callee.locator('.call-member[data-camera="true"] video'),
    ).toBeVisible();
    await caller.locator(".call-mount").evaluate((el) => (el.scrollTop = 0));
    await caller.screenshot({
      path: join(screenshots, "private-call-desktop.png"),
    });
    await callee.screenshot({
      path: join(screenshots, "private-call-mobile.png"),
    });
    await caller.getByTitle("Sair da chamada").click();
    for (const page of [caller, callee]) {
      await expect(page).toHaveURL(/\/friends\?chat=/, { timeout: 15000 });
      await expect(page.locator(".private-call-status")).toHaveCount(0);
    }
    await expect(caller.locator(".call-panel")).toHaveCount(0);
    await expect(callee.locator(".call-panel")).toHaveCount(0);
    await caller.goto("/home");
    await caller.reload();
    await expect(caller.locator(".private-call-status")).toHaveCount(0);
    await expect(caller.locator(".global-call-dock.has-call")).toHaveCount(0);
  } finally {
    await a.close();
    await b.close();
  }
});

test("theme surfaces stay readable across core routes and narrow screens", async ({
  page,
  request,
}) => {
  test.setTimeout(150000);
  await page.emulateMedia({ colorScheme: "dark" });
  const credentials = await user(request, "Joana UX");
  await authenticate(page.context(), credentials);
  await page.addInitScript(() => {
    localStorage.setItem("enturma-intro:v0.3", "seen");
    localStorage.setItem(
      "enturma-experience",
      JSON.stringify({ theme: "DARK", reducedMotion: true }),
    );
  });
  await request.put(`${backend}/api/v1/users/me/experience`, {
    headers: { Authorization: `Bearer ${credentials.accessToken}` },
    data: {
      theme: "DARK",
      reducedMotion: true,
      fontScale: 1,
      highContrast: false,
      enhancedFocus: true,
    },
  });
  for (const route of [
    "/home",
    "/friends",
    "/forum",
    "/notebooks",
    "/settings",
    "/profile",
    "/portfolio",
    "/challenges",
    "/caronas",
    "/login",
  ]) {
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("body")).toHaveCSS("color", "rgb(242, 246, 244)");
    if (route === "/home") {
      await expect(page.locator(".onboarding-banner .button")).toHaveCSS(
        "background-color",
        "rgb(21, 63, 53)",
      );
      await expect(page.locator(".onboarding-banner .button")).toHaveCSS(
        "color",
        "rgb(255, 255, 255)",
      );
    }
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 2,
    );
    expect(overflow, `horizontal overflow on ${route}`).toBe(false);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/caronas");
  await expect(
    page.getByRole("button", { name: "Motorista", exact: true }),
  ).toBeVisible();
  const db = new pg.Client({ connectionString: process.env.E2E_DATABASE_URL });
  await db.connect();
  let campus: string;
  try {
    expect(
      (await db.query("select current_database() name")).rows[0].name,
    ).toBe("enturma_e2e");
    campus = (
      await db.query(
        "select id from academic_entry where kind='CAMPUS' and status='VERIFIED' limit 1",
      )
    ).rows[0].id;
  } finally {
    await db.end();
  }
  const preference = await request.put(
    `${backend}/api/v1/rides/mobility/preferences`,
    {
      headers: { Authorization: `Bearer ${credentials.accessToken}` },
      data: {
        campusId: campus,
        campusLabel: "Campus do teste",
        campusLat: -19.919,
        campusLng: -43.938,
        homeLabel: "Casa do teste",
        homeLat: -19.91,
        homeLng: -43.94,
        onboardingDone: true,
      },
    },
  );
  expect(preference.ok(), await preference.text()).toBe(true);
  await page.route("**/api/backend/rides/map/route", (route) =>
    route.fulfill({
      json: {
        distanceMeters: 4800,
        durationSeconds: 420,
        geometry: [
          [-43.94, -19.91],
          [-43.938, -19.919],
        ],
      },
    }),
  );
  await page.reload();
  await page.getByRole("button", { name: "Motorista", exact: true }).click();
  await page.getByRole("button", { name: /Casa Casa do teste/ }).click();
  const summary = page.locator(".ride-driver-selected-location");
  await expect(
    summary.getByText("Casa do teste", { exact: true }),
  ).toBeVisible();
  const contrast = () =>
    summary.evaluate((el) => {
      const luminance = (color: string) => {
        const context = document.createElement("canvas").getContext("2d")!;
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        const [r, g, b] = Array.from(context.getImageData(0, 0, 1, 1).data)
          .slice(0, 3)
          .map((v) => {
            const c = v / 255;
            return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
          });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const a = luminance(getComputedStyle(el).backgroundColor),
        b = luminance(getComputedStyle(el.querySelector("strong")!).color);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
  expect(await contrast()).toBeGreaterThanOrEqual(4.5);
  await page.screenshot({ path: join(screenshots, "rides-mobile-dark.png") });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await request.put(`${backend}/api/v1/users/me/experience`, {
    headers: { Authorization: `Bearer ${credentials.accessToken}` },
    data: {
      theme: "SYSTEM",
      reducedMotion: true,
      fontScale: 1,
      highContrast: false,
      enhancedFocus: true,
    },
  });
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem("enturma-experience") || "{}");
    localStorage.setItem(
      "enturma-experience",
      JSON.stringify({ ...p, theme: "SYSTEM" }),
    );
  });
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await contrast()).toBeGreaterThanOrEqual(4.5);
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await contrast()).toBeGreaterThanOrEqual(4.5);
});

test.describe("touch chat", () => {
  test.use({ hasTouch: true, isMobile: true });
  test("room chat preserves reading position, keyboard space and anchored mobile actions", async ({
    page,
    request,
  }) => {
    test.setTimeout(120000);
    const db = new pg.Client({
      connectionString: process.env.E2E_DATABASE_URL,
    });
    await db.connect();
    expect(
      (await db.query("select current_database() name")).rows[0].name,
    ).toBe("enturma_e2e");
    const author = await user(request, "Lucas Sala"),
      other = await user(request, "Beatriz Sala");
    const subject = (
      await db.query(
        "SELECT id,parent_id FROM academic_entry WHERE kind='SUBJECT' AND status='VERIFIED' AND parent_id IS NOT NULL LIMIT 1",
      )
    ).rows[0];
    for (const person of [author, other])
      expect(
        (
          await request.put(`${backend}/api/v1/users/me/enrollment`, {
            headers: { Authorization: `Bearer ${person.accessToken}` },
            data: {
              periodId: subject.parent_id,
              subjectIds: [subject.id],
              shift: "EVENING",
              preferences: "",
            },
          })
        ).ok(),
      ).toBe(true);
    const created = await request.post(`${backend}/api/v1/study-rooms`, {
      headers: { Authorization: `Bearer ${author.accessToken}` },
      data: {
        subjectId: subject.id,
        title: "Leitura e teclado",
        minutes: 50,
        maxParticipants: 8,
      },
    });
    expect(created.ok(), await created.text()).toBe(true);
    const room = await created.json();
    expect(
      (
        await request.post(`${backend}/api/v1/study-rooms/${room.id}/join`, {
          headers: { Authorization: `Bearer ${other.accessToken}` },
        })
      ).ok(),
    ).toBe(true);
    try {
      await authenticate(page.context(), author);
      await page.addInitScript(() =>
        localStorage.setItem("enturma-intro:v0.3", "seen"),
      );
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/rooms/${room.id}`);
      const composer = page.getByRole("textbox", {
        name: "Mensagem",
        exact: true,
      });
      await expect(composer).toBeVisible();
      await expect(page.locator(".persistent-messages")).toBeVisible();
      await db.query(
        "UPDATE room_participant SET joined_at=now()-interval '2 hours' WHERE room_id=$1",
        [room.id],
      );
      const actor = (
        await db.query("SELECT id FROM app_user WHERE username=$1", [
          author.username,
        ])
      ).rows[0].id;
      await db.query(
        "INSERT INTO room_message(id,room_id,user_id,body,created_at) SELECT gen_random_uuid(),$1,$2,'Mensagem de estudo '||n||E'\\nExplicação da matéria para revisar com a turma.',now()-interval '90 seconds'+n*interval '1 second' FROM generate_series(1,60) n",
        [room.id, actor],
      );
      await page.reload();
      const viewport = page.locator(".persistent-messages");
      await expect(viewport.locator(".persistent-message")).not.toHaveCount(0);
      await expect
        .poll(() =>
          viewport.evaluate(
            (el) => el.scrollHeight - el.clientHeight - el.scrollTop,
          ),
        )
        .toBeLessThan(24);
      await composer.focus();
      await viewport.evaluate((el) => {
        el.scrollTop = 100;
        el.dispatchEvent(new Event("scroll", { bubbles: true }));
      });
      const before = await viewport.evaluate((el) => el.scrollTop);
      const sent = await request.post(
        `${backend}/api/v1/study-rooms/${room.id}/messages`,
        {
          headers: { Authorization: `Bearer ${other.accessToken}` },
          data: { body: "Nova dúvida que não deve puxar a leitura" },
        },
      );
      expect(sent.ok()).toBe(true);
      await expect(
        page.getByRole("button", { name: /nova\(s\) mensagem/ }),
      ).toBeVisible();
      expect(await viewport.evaluate((el) => el.scrollTop)).toBeCloseTo(
        before,
        0,
      );
      await page.getByRole("button", { name: /nova\(s\) mensagem/ }).click();
      await expect(
        page.getByRole("button", { name: /nova\(s\) mensagem/ }),
      ).toHaveCount(0);
      await page.setViewportSize({ width: 390, height: 480 });
      await expect(composer).toBeVisible();
      await expect(page.locator(".persistent-composer")).toHaveCSS(
        "position",
        "relative",
      );
      const box = await composer.boundingBox();
      expect(box!.y + box!.height).toBeLessThanOrEqual(480);
      await composer.fill("Minha resposta");
      await composer.press("Enter");
      await expect(composer).toHaveValue("Minha resposta\n");
      await page
        .getByRole("button", { name: "Enviar mensagem", exact: true })
        .click();
      await expect(composer).toBeFocused();
      const own = page
        .locator(".persistent-message.mine")
        .filter({ hasText: "Minha resposta" });
      await expect(own).toBeVisible();
      // Native touch long-press handler; no browser context menu is involved.
      await own.dispatchEvent("pointerdown", {
        pointerType: "touch",
        button: 0,
        clientX: 180,
        clientY: 160,
      });
      await expect(
        page.getByRole("dialog", { name: "Ações da mensagem" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Cancelar", exact: true }).click();
      await expect(
        page.getByRole("dialog", { name: "Ações da mensagem" }),
      ).toHaveCount(0);
      await page.screenshot({
        path: join(screenshots, "room-mobile-keyboard-height.png"),
      });
    } finally {
      await request.post(`${backend}/api/v1/study-rooms/${room.id}/end`, {
        headers: { Authorization: `Bearer ${author.accessToken}` },
      });
      await db.end();
    }
  });
});
