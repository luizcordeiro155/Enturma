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
/** In the editor's own preview the frame goes around the card, in the card's column. */
const previewFrame = (page: Page) =>
  page.locator(
    ".profile-preview-stage .profile-preview-identity > canvas[data-layer='frame']",
  );

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
  // In this small preview the frame takes its own room inside the card, so the profile
  // text stays clear of it.
  const tried = await dialog
    .locator(".public-profile-card")
    .last()
    .evaluate((node) => ({
      side: parseFloat(getComputedStyle(node).paddingLeft),
      left:
        node.querySelector("h2")!.getBoundingClientRect().left -
        node.getBoundingClientRect().left,
    }));
  expect(tried.side).toBeGreaterThan(20);
  expect(tried.left).toBeGreaterThan(tried.side);

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

  // Back in the editor, the preview is the whole profile as people will see it: the
  // frame around the card, nothing cut by the preview and nothing to scroll inside it.
  const previewRoom = page.locator(
    ".profile-preview-stage .profile-shared-surface",
  );
  await expect(previewFrame(page)).toBeVisible();
  await expect
    .poll(() =>
      previewRoom.evaluate((room) => {
        const card = room
            .querySelector(".public-profile-card")!
            .getBoundingClientRect(),
          art = room.querySelector("canvas[data-layer='frame']")!,
          around = art.getBoundingClientRect(),
          box = room.getBoundingClientRect(),
          scrolls = [room, ...room.querySelectorAll("*")].filter(
            (node) =>
              /auto|scroll/.test(getComputedStyle(node).overflowY) &&
              node.scrollHeight > node.clientHeight + 1,
          ).length;
        return {
          scrolls,
          cardInside: card.top >= box.top && card.bottom <= box.bottom,
          frameAround: around.top < card.top - 20 && around.left < card.left,
          boxed: room
            .querySelector(".public-profile-card")!
            .classList.contains("has-cosmetic-frame"),
        };
      }),
    )
    .toEqual({ scrolls: 0, cardInside: true, frameAround: true, boxed: false });
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
  await expect(previewFrame(page)).toBeVisible();
  for (const name of ["avatar", "effect"])
    await expect(layer(page, name)).toBeVisible();
  await expect.poll(() => painted(previewFrame(page))).toBeGreaterThan(0.01);
  await expect.poll(() => painted(layer(page, "avatar"))).toBeGreaterThan(0.02);

  // In the profile that opens over the page the frame goes around the card,
  // past its edges, instead of boxing the card in.
  await page.goto(`/social?person=${credentials.userId}`);
  const spilled = page.locator(
    ".social-dialog .profile-preview-identity > canvas[data-layer='frame']",
  );
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

  // In a short window the card does not fit. Card and frame then scroll as one piece
  // inside a clear column the height of the room: the card is the box and the art adds
  // no scrolling of its own.
  const roomy = page.viewportSize()!;
  await page.setViewportSize({ width: 1365, height: 460 });
  const column = page.locator(".social-dialog .profile-preview-identity");
  await expect
    .poll(() =>
      column.evaluate((node) => {
        const style = getComputedStyle(node),
          card = node.querySelector(".public-profile-card")!;
        return Math.round(
          node.scrollHeight -
            card.getBoundingClientRect().height -
            parseFloat(style.paddingTop) -
            parseFloat(style.paddingBottom),
        );
      }),
    )
    .toBe(0);
  expect(
    await column.evaluate((node) => node.scrollHeight - node.clientHeight),
  ).toBeGreaterThan(80);
  const tops = async () => [
    Math.round((await floating.boundingBox())!.y),
    Math.round((await spilled.boundingBox())!.y),
  ];
  const rest = await tops();
  expect(rest[0] - rest[1]).toBeGreaterThan(40);
  await column.evaluate((node) => node.scrollTo(0, 80));
  await expect.poll(tops).toEqual([rest[0] - 80, rest[1] - 80]);
  await expect(column).toHaveCSS("border-top-width", "0px");
  expect(
    await floating.evaluate((node) => getComputedStyle(node).boxShadow),
  ).not.toBe("none");
  // The card's own window shows no bar at all: a bar there would float beside the
  // frame. The content beside it has a thin one that only shows under the pointer.
  expect(
    await column.evaluate(
      (node) => (node as HTMLElement).offsetWidth - node.clientWidth,
    ),
  ).toBe(0);
  await expect(column).toHaveCSS("scrollbar-width", "none");
  const beside = page.locator(".social-dialog .profile-preview-mural");
  await page.mouse.move(4, 4);
  await expect(beside).toHaveCSS("--profile-bar", "rgba(0, 0, 0, 0)");
  await beside.hover();
  await expect
    .poll(() =>
      beside.evaluate((node) =>
        getComputedStyle(node).getPropertyValue("--profile-bar"),
      ),
    )
    .toMatch(/^rgba\(255, 255, 255, 0\.\d+\)$/);
  await page.setViewportSize(roomy);

  // With motion turned off the art is still there, as a still picture.
  await page.goto("/profile");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect.poll(() => painted(previewFrame(page))).toBeGreaterThan(0.01);
});
