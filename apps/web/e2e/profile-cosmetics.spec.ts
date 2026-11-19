import { test } from "./student-fixture";
import { authenticate } from "./session";
import { expect, type Locator, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

const backend = process.env.E2E_API_URL ?? "http://localhost:8080";

/** How much of a layer is actually painted: proof the art is on screen, not just a canvas. */
const painted = (canvas: Locator) =>
  canvas.evaluate((node) => {
    const element = node as HTMLCanvasElement,
      data = element
        .getContext("2d")!
        .getImageData(0, 0, element.width, element.height).data;
    let count = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 24) count++;
    return count / (data.length / 4);
  });
const layer = (page: Page, name: string) =>
  page.locator(`.public-profile-card canvas[data-layer="${name}"]`).last();

test("Cosméticos: usar um pacote liberado, experimentar um bloqueado e ver no perfil", async ({
  page,
  request,
}) => {
  const username = `cosmetic_${randomUUID().slice(0, 8)}`;
  const response = await request.post(`${backend}/api/v1/auth/register`, {
    data: {
      name: "Aluna das Molduras",
      username,
      email: `${username}@example.test`,
      password: "Profile-cosmetic-test-123",
      device: "E2E",
    },
  });
  expect(response.ok()).toBe(true);
  const credentials = await response.json();
  await authenticate(page.context(), credentials);
  await page.addInitScript(() =>
    localStorage.setItem("enturma-intro:v0.3", "seen"),
  );
  await page.goto("/profile");
  await page.getByRole("button", { name: /^Molduras e efeitos/ }).click();
  const dialog = page.getByRole("dialog", {
    name: "Molduras e efeitos",
    exact: true,
  });
  await expect(dialog.getByText("Você está no nível 1")).toBeVisible();

  // A locked pack says when it opens; it can be tried on, never put on.
  const dragon = dialog.getByRole("group", { name: "Dragão Imperial" });
  await expect(dragon).toContainText("Libera no nível 5");
  await expect(
    dragon.getByRole("button", { name: "Moldura", exact: true }),
  ).toBeDisabled();
  await dragon.getByRole("button", { name: "Experimentar" }).click();
  await expect(layer(page, "frame")).toBeVisible();
  await expect.poll(() => painted(layer(page, "frame"))).toBeGreaterThan(0.01);

  const sakura = dialog.getByRole("group", { name: "Sakura" });
  await sakura.getByRole("button", { name: "Usar o pacote completo" }).click();
  await expect(
    sakura.getByRole("button", { name: "Moldura", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  // The pack brings two colours that go with it; they become the profile's own theme.
  await expect(
    sakura.getByRole("button", { name: "Cores do pacote" }),
  ).toHaveAttribute("aria-pressed", "true");
  await dialog.getByRole("button", { name: "Aplicar", exact: true }).click();
  await expect(dialog).toBeHidden();
  await page
    .getByRole("button", { name: "Salvar perfil", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Perfil salvo com sucesso." }),
  ).toBeVisible();

  // The server keeps the rule: a locked item is refused even when asked for directly.
  const forced = await page.evaluate(async () => {
    const reply = await fetch("/api/backend/users/me/profile-details", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cosmeticFrame: "dragao" }),
    });
    return { status: reply.status, message: (await reply.json()).message };
  });
  expect(forced.status).toBe(400);
  expect(forced.message).toContain("nível 5");

  // Opening the profile again brings the three pieces back, drawn.
  await page.reload();
  for (const name of ["frame", "avatar", "effect"])
    await expect(layer(page, name)).toBeVisible();
  await expect.poll(() => painted(layer(page, "frame"))).toBeGreaterThan(0.01);
  await expect.poll(() => painted(layer(page, "avatar"))).toBeGreaterThan(0.02);
  // The frame takes its own room, so the profile text stays clear of it.
  const card = page.locator(".public-profile-card").last();
  const room = await card.evaluate((node) => ({
    side: parseFloat(getComputedStyle(node).paddingLeft),
    left:
      node.querySelector("h2")!.getBoundingClientRect().left -
      node.getBoundingClientRect().left,
  }));
  expect(room.side).toBeGreaterThan(20);
  expect(room.left).toBeGreaterThan(room.side);

  // In the profile that opens over the page the frame goes around the card,
  // past its edges, instead of boxing the card in.
  await page.goto(`/social?person=${credentials.userId}`);
  const spilled = page.locator(".social-dialog > canvas[data-layer='frame']");
  await expect(spilled).toBeVisible();
  await expect.poll(() => painted(spilled)).toBeGreaterThan(0.02);
  const floating = page.locator(".social-dialog .public-profile-card");
  await expect
    .poll(async () => {
      const art = (await spilled.boundingBox())!,
        box = (await floating.boundingBox())!;
      return [
        Math.round(box.x - art.x) > 40,
        Math.round(box.y - art.y) > 40,
        art.width > box.width + 80,
      ];
    })
    .toEqual([true, true, true]);
  expect(
    await floating.evaluate((node) => getComputedStyle(node).paddingLeft),
  ).toBe("0px");
  // No bar across the top: the title is kept for screen readers and the close button
  // floats inside the room.
  const bar = page.locator(".social-dialog > header");
  await expect(bar).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(bar).toHaveCSS("position", "absolute");
  expect((await bar.locator("h2").boundingBox())!.width).toBeLessThanOrEqual(1);
  await expect(page.getByRole("button", { name: "Fechar" })).toBeVisible();
  // The profile is its own dark room and the card wears the pack's two colours, deepened.
  const night = await page
    .locator(".social-dialog .profile-shared-surface")
    .evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(night).toBe("rgb(11, 12, 18)");
  expect(
    await floating
      .locator(".public-profile-body")
      .evaluate((node) => getComputedStyle(node).backgroundImage),
  ).toContain("linear-gradient");
  await expect(
    page.locator(".social-dialog .profile-preview-combined"),
  ).toHaveCSS("--profile-realce", "#6d4bc4");

  // With motion turned off the art is still there, as a still picture.
  await page.goto("/profile");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect.poll(() => painted(layer(page, "frame"))).toBeGreaterThan(0.01);
});
