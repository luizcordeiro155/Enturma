import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { authenticate } from "./session";
import { test as studentTest } from "./student-fixture";

const nativeInsets = { top: 34, right: 6, bottom: 24, left: 6 };

// Android injects the insets after WebView finishes loading, not only at
// document creation. Simulate that lifecycle after each navigation/hydration.
async function syncNativeInsets(page: import("@playwright/test").Page) {
  await page.evaluate((insets) => {
    const root = document.documentElement;
    root.dataset.enturmaMobile = "true";
    root.style.setProperty("--native-safe-top", insets.top + "px");
    root.style.setProperty("--native-safe-right", insets.right + "px");
    root.style.setProperty("--native-safe-bottom", insets.bottom + "px");
    root.style.setProperty("--native-safe-left", insets.left + "px");
  }, nativeInsets);
}

test("standalone mobile surfaces stay outside Android system bars", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const [route, selector] of [
    ["/termos", ".legal-page-brand"],
    ["/privacidade", ".legal-page-brand"],
    ["/login", ".auth-story .brand"],
    ["/offline", "main > section"],
  ] as const) {
    await page.goto(route);
    await syncNativeInsets(page);
    const element = page.locator(selector).first();
    await expect(element).toBeVisible();

    const box = await element.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y, route).toBeGreaterThanOrEqual(nativeInsets.top);
    expect(box!.x, route).toBeGreaterThanOrEqual(nativeInsets.left);

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});

test("Android protege login, cadastro e recuperação sob as barras do sistema", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of ["/login", "/register", "/forgot-password"]) {
    await page.goto(route);
    await syncNativeInsets(page);
    const story = page.locator(".auth-entry .auth-story");
    const content = page.locator(".auth-entry .auth-main");
    const brand = story.locator(".brand");
    await expect(brand).toBeVisible();

    const spacing = await story.evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        top: parseFloat(styles.paddingTop),
        left: parseFloat(styles.paddingLeft),
        right: parseFloat(styles.paddingRight),
      };
    });
    const formPaddingBottom = await content.evaluate((element) =>
      parseFloat(getComputedStyle(element).paddingBottom),
    );
    const brandBounds = await brand.boundingBox();

    expect(spacing.top, route).toBeGreaterThanOrEqual(nativeInsets.top + 20);
    expect(spacing.left, route).toBeGreaterThanOrEqual(nativeInsets.left + 20);
    expect(spacing.right, route).toBeGreaterThanOrEqual(nativeInsets.right + 20);
    expect(formPaddingBottom, route).toBeGreaterThanOrEqual(nativeInsets.bottom + 28);
    expect(brandBounds?.y ?? 0, route).toBeGreaterThanOrEqual(nativeInsets.top + 20);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});

studentTest("Android mantém os atalhos das configurações abaixo da barra de status", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const tag = randomUUID().slice(0, 8);
  const registered = await request.post(
    `${process.env.E2E_API_URL ?? "http://localhost:8080"}/api/v1/auth/register`,
    {
      data: {
        name: "Barra de status",
        username: `statusbar_${tag}`,
        email: `statusbar_${tag}@example.test`,
        password: "Status-bar-password-123",
        device: "E2E",
      },
    },
  );
  expect(registered.ok()).toBe(true);
  await authenticate(page.context(), await registered.json());
  await page.goto("/settings");
  await syncNativeInsets(page);
  const nav = page.locator(".settings-nav");
  await expect(nav).toBeVisible();
  const maskHeight = () =>
    nav.evaluate((element) => {
      const mask = getComputedStyle(element, "::before");
      return mask.content === "none" ? 0 : parseFloat(mask.height) || 0;
    });
  // No topo, a máscara da barra de status não pode cobrir o subtítulo logo acima dos atalhos.
  await expect(page.locator(".settings-lede")).toBeVisible();
  expect(await maskHeight()).toBe(0);
  await page.mouse.wheel(0, 1400);
  await expect
    .poll(async () => (await nav.boundingBox())?.y ?? -1)
    .toBeGreaterThanOrEqual(nativeInsets.top - 1);
  const top = (await nav.boundingBox())!.y;
  expect(top).toBeLessThan(nativeInsets.top + 4);
  // Presos no topo, a máscara volta e nada rola por baixo da barra de status.
  await expect.poll(maskHeight).toBeGreaterThanOrEqual(nativeInsets.top - 1);
  await page.mouse.wheel(0, -4000);
  await expect.poll(maskHeight).toBe(0);
});

studentTest("Android mantém as seções do portfólio abaixo da barra de status", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const tag = randomUUID().slice(0, 8);
  const registered = await request.post(
    `${process.env.E2E_API_URL ?? "http://localhost:8080"}/api/v1/auth/register`,
    {
      data: {
        name: "Portfólio no celular",
        username: `portbar_${tag}`,
        email: `portbar_${tag}@example.test`,
        password: "Status-bar-password-123",
        device: "E2E",
      },
    },
  );
  expect(registered.ok()).toBe(true);
  await authenticate(page.context(), await registered.json());
  await page.goto("/portfolio");
  await syncNativeInsets(page);
  const nav = page.getByRole("navigation", { name: "Seções do portfólio" });
  await expect(nav).toBeVisible();
  const maskHeight = () =>
    nav.evaluate((element) => {
      const mask = getComputedStyle(element, "::before");
      return mask.content === "none" ? 0 : parseFloat(mask.height) || 0;
    });
  expect(await maskHeight()).toBe(0);
  await expect(nav.getByRole("link", { name: "Apresentação" })).toHaveAttribute(
    "aria-current",
    "true",
  );

  // Os três números do resumo cabem lado a lado, sem empilhar a tela inteira.
  const metrics = await page
    .locator(".portfolio-metrics > div")
    .evaluateAll((items) => items.map((item) => Math.round(item.getBoundingClientRect().top)));
  expect(new Set(metrics).size).toBe(1);

  await page.locator("#projetos").scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 500);
  // Presa no topo, a fila fica abaixo da barra de status e nada rola por baixo dela.
  await expect
    .poll(async () => Math.round((await nav.boundingBox())?.y ?? -1))
    .toBe(nativeInsets.top);
  await expect.poll(maskHeight).toBeGreaterThanOrEqual(nativeInsets.top - 1);
  const edges = await nav.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return { left: Math.round(box.left), right: Math.round(box.right), width: innerWidth };
  });
  expect(edges.left).toBe(0);
  expect(edges.right).toBe(edges.width);
  await expect(nav.getByRole("link", { name: "Projetos" })).toHaveAttribute(
    "aria-current",
    "true",
  );
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
});
