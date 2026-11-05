import { expect, test } from "@playwright/test";

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
