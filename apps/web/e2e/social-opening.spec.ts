import { test } from "./student-fixture";
import { authenticate } from "./session";
import { expect } from "@playwright/test";
import { randomUUID } from "node:crypto";

const backend = process.env.E2E_API_URL ?? "http://localhost:8080";

for (const width of [390, 1440]) {
  test(`Social opening is continuous and does not replay at ${width}px`, async ({
    page,
    request,
  }, info) => {
    const tag = randomUUID().slice(0, 8);
    const registration = await request.post(`${backend}/api/v1/auth/register`, {
      data: {
        name: "Abertura Social",
        username: `opening_${tag}`,
        email: `opening-${tag}@example.test`,
        password: "social-test-123",
        device: "Opening E2E",
      },
    });
    expect(registration.ok()).toBe(true);
    const user = await registration.json();
    const preferences = await request.put(
      `${backend}/api/v1/users/me/experience`,
      {
        headers: { Authorization: `Bearer ${user.accessToken}` },
        data: {
          theme: "DARK",
          fontScale: 1,
          highContrast: false,
          reducedMotion: false,
          enhancedFocus: true,
        },
      },
    );
    expect(preferences.ok()).toBe(true);
    await authenticate(page.context(), user);
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => {
      if (!location.origin.startsWith("http")) return;
      localStorage.setItem("enturma-intro:v0.3", "seen");
      const openings: number[] = [];
      Object.assign(window, { socialOpeningEvents: openings });
      new MutationObserver((records) => {
        for (const record of records) {
          const element = record.target;
          if (
            element instanceof HTMLDialogElement &&
            element.classList.contains("social-opening") &&
            element.open
          )
            openings.push(performance.now());
        }
      }).observe(document, {
        subtree: true,
        attributes: true,
        attributeFilter: ["open"],
      });
    });
    await page.goto("/social");
    const opening = page.getByRole("dialog", {
      name: "Bem-vindo ao Enturma Social",
    });
    await expect(opening).toBeVisible();
    await expect(page.locator(".social-workspace")).toHaveCount(0);
    await expect(page.locator(".social-navigation")).toHaveCount(0);
    // No provisional aperture is shown before the real Remotion composition.
    await expect(
      opening.locator(".social-opening-art .lucide-aperture"),
    ).toHaveCount(0);
    await expect(
      opening.locator(".social-opening-art svg").first(),
    ).toBeVisible();
    const bounds = await opening.boundingBox();
    expect(bounds?.width).toBe(width);
    expect(bounds?.height).toBe(900);
    await page.screenshot({
      path: info.outputPath(`social-opening-${width}.png`),
    });
    await opening.getByRole("button", { name: "Explorar o Social" }).click();
    await expect(opening).toHaveCount(0);
    await page
      .getByRole("navigation", { name: "Ambientes do Social" })
      .getByRole("button", { name: "Clips", exact: true })
      .click();
    await page
      .getByRole("navigation", { name: "Ambientes do Social" })
      .getByRole("button", { name: "Feed", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Enturma Social.", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          (window as Window & { socialOpeningEvents?: number[] })
            .socialOpeningEvents?.length,
      ),
    ).toBe(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  });
}
