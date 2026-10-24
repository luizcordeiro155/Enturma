import { test } from "./student-fixture";
import { expect } from "@playwright/test";
import { authenticate } from "./session";
import { randomUUID } from "node:crypto";

test("abertura do app e entrada em caronas exibem a animação inteira", async ({
  page,
  request,
}) => {
  test.setTimeout(90000);
  const tag = randomUUID().slice(0, 8);
  const username = "motion_" + tag;
  const backend = process.env.E2E_API_URL ?? "http://localhost:8080";
  const response = await request.post(backend + "/api/v1/auth/register", {
    data: {
      name: "Animação Enturma",
      username,
      email: username + "@example.test",
      password: "Motion-splash-test-123",
      device: "E2E",
    },
  });
  expect(response.ok()).toBe(true);
  await authenticate(page.context(), await response.json());
  await page.goto("/home");

  const overlay = page.locator(".enturma-launch-overlay");
  await expect(overlay).toBeVisible({ timeout: 12000 });
  await expect(overlay).toHaveAttribute("data-launch-scene", "app");
  await expect(overlay.locator('[data-launch-player="ready"]')).toBeVisible({
    timeout: 12000,
  });
  await page.waitForTimeout(1300);
  await expect(overlay).toBeVisible();
  await expect(overlay).toHaveCount(0, { timeout: 12000 });

  // Navigate via Next.js (not a full reload) to exercise the ride transition.
  await page.locator('a[href="/caronas"]').first().click();
  await expect(page).toHaveURL(/\/caronas(?:\/|$)/);
  await expect(overlay).toHaveAttribute("data-launch-scene", "ride", {
    timeout: 12000,
  });
  await expect(overlay.locator('[data-launch-player="ready"]')).toBeVisible({
    timeout: 12000,
  });
  await page.waitForTimeout(1450);
  await expect(overlay).toBeVisible();
  await expect(overlay).toHaveCount(0, { timeout: 12000 });

  // The ride transition is not replayed on every in-app visit.
  await page.locator('a[href="/home"]').first().click();
  await page.locator('a[href="/caronas"]').first().click();
  await expect(overlay).toHaveCount(0);
});
