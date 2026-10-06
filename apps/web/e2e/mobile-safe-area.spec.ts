import { expect, test } from "@playwright/test";

const nativeInsets = { top: 34, right: 6, bottom: 24, left: 6 };

async function installNativeInsets(page: import("@playwright/test").Page) {
  await page.addInitScript((insets) => {
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
  await installNativeInsets(page);

  for (const [route, selector] of [
    ["/termos", ".legal-page-brand"],
    ["/privacidade", ".legal-page-brand"],
    ["/login", ".auth-story .brand"],
    ["/offline", "main > section"],
  ] as const) {
    await page.goto(route);
    const element = page.locator(selector).first();
    await expect(element).toBeVisible();

    const box = await element.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(nativeInsets.top);
    expect(box!.x).toBeGreaterThanOrEqual(nativeInsets.left);

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});
