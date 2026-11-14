import { test } from "./student-fixture";
import { authenticate } from "./session";
import { expect, type Locator } from "@playwright/test";
import { randomUUID } from "node:crypto";

const backend = process.env.E2E_API_URL ?? "http://localhost:8080";
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=",
  "base64",
);
async function swipe(target: Locator, from: number, to: number) {
  await target.evaluate(
    (element, { from, to }) => {
      const point = (x: number) =>
        new Touch({ identifier: 1, target: element, clientX: x, clientY: 350 });
      element.dispatchEvent(
        new TouchEvent("touchstart", { bubbles: true, touches: [point(from)] }),
      );
      element.dispatchEvent(
        new TouchEvent("touchmove", {
          bubbles: true,
          touches: [point((from + to) / 2)],
        }),
      );
      element.dispatchEvent(
        new TouchEvent("touchmove", { bubbles: true, touches: [point(to)] }),
      );
      element.dispatchEvent(
        new TouchEvent("touchend", {
          bubbles: true,
          changedTouches: [point(to)],
        }),
      );
    },
    { from, to },
  );
}

test("Social: mentions, keyboard, swipes and compact profile/inbox", async ({
  page,
  request,
}, info) => {
  const users = [];
  for (const name of [
    "Luiz teste",
    "Pessoa com nome longo para conferir o perfil",
  ]) {
    const tag = randomUUID().slice(0, 8),
      username = `mobile_${tag}`;
    const response = await request.post(`${backend}/api/v1/auth/register`, {
      data: {
        name,
        username,
        email: `${username}@example.test`,
        password: "social-test-123",
        device: "Mobile interactions E2E",
      },
    });
    expect(response.ok()).toBe(true);
    users.push({ ...(await response.json()), username });
  }
  const [me, friend] = users;
  const headers = { Authorization: `Bearer ${me.accessToken}` };
  const other = { Authorization: `Bearer ${friend.accessToken}` };
  expect(
    (
      await request.post(`${backend}/api/v1/users/me/avatar`, {
        headers: other,
        multipart: {
          file: { name: "avatar.png", mimeType: "image/png", buffer: png },
        },
      })
    ).ok(),
  ).toBe(true);
  expect(
    (
      await request.put(
        `${backend}/api/v1/social/people/${friend.userId}/follow`,
        { headers, data: { active: true } },
      )
    ).ok(),
  ).toBe(true);
  expect(
    (
      await request.put(`${backend}/api/v1/social/people/${me.userId}/follow`, {
        headers: other,
        data: { active: true },
      })
    ).ok(),
  ).toBe(true);
  await request.put(`${backend}/api/v1/users/me/experience`, {
    headers,
    data: {
      theme: "DARK",
      fontScale: 1,
      highContrast: false,
      reducedMotion: true,
      enhancedFocus: true,
    },
  });
  await authenticate(page.context(), me);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/social");
  const nav = page.getByRole("navigation", { name: "Ambientes do Social" });
  await expect(nav).toBeVisible();
  const pager = page.locator(".social-pager");
  await swipe(page.locator('[data-page="feed"]'), 300, 80);
  await expect(pager).toHaveAttribute("data-view", "clips");
  await expect(
    nav.getByRole("button", { name: "Clips", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await swipe(page.locator('[data-page="clips"]'), 80, 300);
  await expect(pager).toHaveAttribute("data-view", "feed");
  await swipe(page.locator('[data-page="feed"]'), 80, 300);
  await expect(pager).toHaveAttribute("data-view", "create");
  await expect(
    nav.getByRole("button", { name: "Criar", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  const caption = page.getByLabel("O que você quer compartilhar?");
  await caption.fill("Olá @");
  const suggestion = page.getByRole("option", {
    name: new RegExp(friend.username),
  });
  await expect(suggestion).toBeVisible();
  await suggestion.click();
  await expect(caption).toHaveValue(`Olá @${friend.username} `);
  await caption.focus();
  await page.evaluate(() =>
    document.documentElement.style.setProperty(
      "--native-keyboard-bottom",
      "320px",
    ),
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-social-keyboard",
    "true",
  );
  await expect(
    page.getByRole("button", { name: "Publicar Post", exact: true }),
  ).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Salvar rascunho", exact: true }),
  ).not.toBeVisible();
  await expect(caption).toBeInViewport();
  await page.screenshot({
    path: info.outputPath("social-keyboard-mobile.png"),
  });
  await page.evaluate(() =>
    document.documentElement.style.removeProperty("--native-keyboard-bottom"),
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-social-keyboard",
    "false",
  );
  await page
    .getByRole("button", { name: "Publicar Post", exact: true })
    .click();
  await expect(pager).toHaveAttribute("data-view", "feed");
  await expect(
    page.locator(".social-stream").getByText(`Olá @${friend.username}`),
  ).toBeVisible();

  await page.goto(`/social?person=${friend.userId}`);
  const profile = page.getByRole("dialog", {
    name: "Perfil social",
    exact: true,
  });
  await expect(profile).toBeVisible();
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const author = profile.locator(".social-profile-heading .social-author");
    const name = author.locator("strong");
    await expect(name).toBeVisible();
    const nameBox = (await name.boundingBox())!,
      buttons = (await profile
        .locator(".social-profile-buttons")
        .boundingBox())!;
    expect(nameBox.width).toBeGreaterThan(80);
    expect(
      nameBox.y + nameBox.height <= buttons.y + 1 ||
        nameBox.x + nameBox.width <= buttons.x + 1,
    ).toBe(true);
    const avatar = (await author.locator(".identity-avatar").boundingBox())!;
    expect(avatar.width).toBeLessThanOrEqual(width >= 1200 ? 140 : 88);
    expect(Math.abs(avatar.width - avatar.height)).toBeLessThan(1);
    await page.screenshot({
      path: info.outputPath(`social-profile-fixed-${width}.png`),
    });
  }
  await profile.getByRole("button", { name: "Fechar", exact: true }).click();
  await page.getByRole("button", { name: "Meu perfil social" }).click();
  await profile.getByRole("button", { name: /Seguidores/ }).click();
  const followers = page.getByRole("dialog", {
    name: "Seguidores",
    exact: true,
  });
  const row = followers.locator(".social-person-row").first();
  await expect(row.locator("strong")).toHaveText(
    "Pessoa com nome longo para conferir o perfil",
  );
  await expect(
    row.getByRole("button", { name: "Remover seguidor" }),
  ).toBeVisible();
  for (const width of [360, 390, 1366]) {
    await page.setViewportSize({ width, height: 768 });
    const name = (await row.locator("strong").boundingBox())!;
    const actions = (await row
      .locator(".social-person-actions")
      .boundingBox())!;
    expect(name.width).toBeGreaterThan(150);
    expect(actions.y).toBeGreaterThanOrEqual(name.y + name.height);
    expect(
      await row.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`social-followers-${width}.png`),
    });
  }
  await followers.getByRole("button", { name: "Fechar", exact: true }).click();
  await profile.getByRole("button", { name: "Fechar", exact: true }).click();
  await page.getByRole("button", { name: /^Notificações/ }).click();
  const inbox = page.getByRole("dialog", { name: "Sua caixa de entrada" });
  await expect(inbox.locator(".notification-item").first()).toBeVisible();
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const avatar = inbox.locator(".identity-avatar").first();
    await expect(avatar.locator("img")).toBeVisible();
    const box = (await avatar.boundingBox())!;
    expect(box.width).toBe(40);
    expect(box.height).toBe(40);
    const item = (await inbox
      .locator(".notification-item")
      .first()
      .boundingBox())!;
    expect(item.height).toBeLessThan(160);
    const toolbar = (await inbox
      .locator(".notification-toolbar")
      .boundingBox())!;
    expect(toolbar.height).toBeLessThan(110);
    expect(
      await inbox.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`social-inbox-fixed-${width}.png`),
    });
  }
});
