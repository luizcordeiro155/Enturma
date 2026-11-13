import { test } from "./student-fixture";
import { authenticate } from "./session";
import { expect } from "@playwright/test";
import { randomUUID } from "node:crypto";

const backend = process.env.E2E_API_URL ?? "http://localhost:8080";
test("Social reference matrix: feed, discovery, profile and creation at ten widths", async ({
  page,
  request,
}, info) => {
  test.setTimeout(240000);
  const tag = randomUUID().slice(0, 8);
  const registration = await request.post(`${backend}/api/v1/auth/register`, {
    data: {
      name: "Estudante da matriz visual",
      username: `matrix_${tag}`,
      email: `matrix-${tag}@example.test`,
      password: "social-test-123",
      device: "Synthetic reference matrix",
    },
  });
  expect(registration.ok()).toBe(true);
  const user = await registration.json();
  const headers = { Authorization: `Bearer ${user.accessToken}` };
  const ids: string[] = [];
  for (let index = 0; index < 8; index++) {
    const id = randomUUID();
    ids.push(id);
    const draft = await request.put(`${backend}/api/v1/social/drafts`, {
      headers,
      data: {
        id,
        kind: "POST",
        body: `Projeto ${index + 1}: compartilhar conhecimento. #matriz${tag}`,
        visibility: "PUBLIC",
        version: 0,
        mediaIds: [],
      },
    });
    expect(draft.ok()).toBe(true);
    expect(
      (
        await request.post(`${backend}/api/v1/social/posts/${id}/publish`, {
          headers,
          data: { version: (await draft.json()).version },
        })
      ).ok(),
    ).toBe(true);
  }
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
  // Only artwork is synthetic at the browser boundary. Accounts, search, feed,
  // permissions and interactions use the isolated API. No third-party assets.
  await page.route("**/api/backend/social/feed?**", async (route) => {
    const response = await route.fetch();
    if (!response.ok()) return route.fulfill({ response });
    const data = await response.json();
    for (const post of data.items)
      if (ids.includes(post.id)) {
        post.media = [
          {
            id: post.id,
            kind: "IMAGE",
            width: 900,
            height: 1200,
            state: "READY",
          },
        ];
      }
    await route.fulfill({ response, json: data });
  });
  await page.route("**/api/backend/social/media/*/content*", async (route) => {
    const id = route
      .request()
      .url()
      .match(/media\/([^/]+)/)?.[1];
    if (!id || !ids.includes(id)) return route.continue();
    const index = ids.indexOf(id);
    const colors = ["#174d42", "#23455e", "#69465a", "#775c32"];
    await route.fulfill({
      contentType: "image/svg+xml",
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200"><rect width="900" height="1200" fill="${colors[index % 4]}"/><circle cx="680" cy="390" r="320" fill="#ffffff" opacity=".12"/><path d="M0 900L500 420L900 780V1200H0" fill="#081c19"/><text x="60" y="160" font-family="sans-serif" font-size="35" fill="#d5f894">ENTURMA · TESTE VISUAL</text><text x="60" y="1030" font-family="sans-serif" font-size="72" fill="white">Projeto ${index + 1}</text></svg>`,
    });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await authenticate(page.context(), user);
  await page.goto("/social");
  await expect(
    page.getByRole("dialog", { name: "Bem-vindo ao Enturma Social" }),
  ).not.toBeVisible();
  const nav = page.getByRole("navigation", { name: "Ambientes do Social" });
  await expect(
    nav.getByRole("button", { name: "Explorar", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".social-post:visible").first()).toBeVisible();
  // Compare themes on the same mounted surface. Reopening each dialog for every
  // screenshot needlessly repeats authenticated reads and exhausts the real quota.
  async function captureThemes(surface: string, width: number) {
    for (const theme of ["light", "dark", "enturma", "system"]) {
      await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
      await page.evaluate((theme) => {
        // Use the shared preference owner, as a theme change from another tab
        // does. Mutating root attributes races ThemeSync's media change listener.
        const key = "enturma-experience";
        const preference = JSON.parse(localStorage.getItem(key) ?? "{}");
        const value = JSON.stringify({
          ...preference,
          theme: theme.toUpperCase(),
          reducedMotion: true,
        });
        localStorage.setItem(key, value);
        window.dispatchEvent(
          new StorageEvent("storage", { key, newValue: value }),
        );
      }, theme);
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        theme === "light" ? "light" : "dark",
      );
      await expect(page.locator("html")).toHaveAttribute(
        "data-palette",
        theme === "enturma" ? "enturma" : "default",
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      await page.screenshot({
        path: info.outputPath(`reference-${surface}-${width}-${theme}.png`),
      });
    }
  }
  for (const width of [320, 360, 390, 430, 768, 1024, 1280, 1366, 1440, 1920]) {
    await page.setViewportSize({
      width,
      height: width < 761 ? 844 : width === 1366 ? 768 : 1080,
    });
    await nav.getByRole("button", { name: "Feed", exact: true }).click();
    const scroller = page.locator(".social-feed-scroll:visible");
    await scroller.evaluate((el) => {
      el.scrollTop = 0;
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    const dock = await page.locator(".social-navigation").boundingBox();
    expect(dock!.width).toBeLessThanOrEqual(width);
    for (const item of await nav.locator("button:visible,a:visible").all()) {
      const box = await item.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
    }
    expect(await nav.locator("button:visible,a:visible").count()).toBe(
      width < 761 ? 5 : 6,
    );
    if (width >= 761) expect(dock!.width).toBe(76);
    if (width >= 1200) {
      expect(
        (await page.locator(".social-feed-aside").boundingBox())!.width,
      ).toBe(290);
      expect(
        (await page.locator(".social-post:visible").first().boundingBox())!
          .width,
      ).toBe(500);
    }
    await captureThemes("feed", width);
    await scroller.evaluate((el) => {
      el.scrollTop = 360;
    });
    const position = await scroller.evaluate((el) => el.scrollTop);
    expect(position).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Explorar", exact: true }).click();
    const explore = page.getByRole("dialog", {
      name: "Explorar",
      exact: true,
    });
    await expect(explore.locator(".social-profile-cell").first()).toBeVisible();
    expect(
      await explore.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
    if (width >= 1200)
      expect((await explore.boundingBox())!.width).toBeGreaterThan(1100);
    await captureThemes("explore", width);
    await explore.getByRole("button", { name: "Fechar", exact: true }).click();
    expect(await scroller.evaluate((el) => el.scrollTop)).toBe(position);
    await nav.getByRole("button", { name: "Meu perfil social" }).click();
    const profile = page.getByRole("dialog", {
      name: "Perfil social",
      exact: true,
    });
    await expect(profile.locator(".social-profile-cell").first()).toBeVisible();
    expect(
      await profile.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
    if (width >= 1200)
      expect((await profile.boundingBox())!.width).toBeGreaterThan(1100);
    expect(
      await profile
        .locator(".social-profile-grid")
        .evaluate(
          (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
        ),
    ).toBe(3);
    await captureThemes("profile", width);
    await profile.getByRole("button", { name: "Fechar", exact: true }).click();
    await nav.getByRole("button", { name: "Criar", exact: true }).click();
    await expect(
      page.getByRole("region", { name: "Central de criação" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await captureThemes("create", width);
  }
  await page.getByRole("button", { name: "Explorar", exact: true }).click();
  const explore = page.getByRole("dialog", { name: "Explorar", exact: true });
  await explore.getByRole("searchbox").fill(`#matriz${tag}`);
  await explore.getByRole("button", { name: "Pesquisar no Explorar" }).click();
  await expect(explore.locator(".social-profile-cell")).toHaveCount(8);
  await explore.locator(".social-profile-cell").first().click();
  const viewer = page.getByRole("dialog", { name: "Publicações", exact: true });
  await expect(viewer).toBeVisible();
  await viewer.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(explore).toBeVisible();
  await explore.getByRole("button", { name: "Fechar", exact: true }).click();
  await nav.getByRole("button", { name: "Feed", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  // Find our real publication through discovery, independent of feed ranking.
  await page.getByRole("button", { name: "Explorar", exact: true }).click();
  await explore.getByRole("searchbox").fill(`#matriz${tag}`);
  await explore.getByRole("button", { name: "Pesquisar no Explorar" }).click();
  await expect(explore.locator(".social-profile-cell")).toHaveCount(8);
  await explore.locator(".social-profile-cell").first().click();
  await viewer
    .getByRole("button", { name: "Opções da publicação" })
    .first()
    .click();
  await page.getByRole("button", { name: "Organizar em coleção" }).click();
  const collections = page.getByRole("dialog", { name: "Coleções privadas" });
  await collections.getByLabel("Nome da coleção").fill("Referências de estudo");
  await collections
    .getByRole("button", { name: "Criar coleção", exact: true })
    .click();
  const named = collections.getByRole("button", {
    name: "Referências de estudo",
    exact: true,
  });
  await named.click();
  await expect(named).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({
    path: info.outputPath("reference-private-collection-390.png"),
  });
  await collections
    .getByRole("button", { name: "Fechar", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Esta publicação" })
    .getByRole("button", { name: "Fechar", exact: true })
    .click();
  await viewer.getByRole("button", { name: "Fechar", exact: true }).click();
  await explore.getByRole("button", { name: "Fechar", exact: true }).click();
  await nav.getByRole("button", { name: "Meu perfil social" }).click();
  const profile = page.getByRole("dialog", {
    name: "Perfil social",
    exact: true,
  });
  await profile.getByRole("tab", { name: "Salvos", exact: true }).click();
  await profile.getByRole("button", { name: "Minhas coleções" }).click();
  await named.click();
  await expect(collections.locator(".social-profile-cell")).toHaveCount(1);
  await collections.getByLabel("Nome da coleção").fill("Pesquisa acadêmica");
  await collections.getByRole("button", { name: "Renomear coleção" }).click();
  await expect(
    collections.getByRole("button", {
      name: "Pesquisa acadêmica",
      exact: true,
    }),
  ).toBeVisible();
  await collections
    .getByRole("button", { name: "Excluir esta coleção" })
    .click();
  await collections
    .getByRole("button", { name: "Excluir coleção", exact: true })
    .click();
  await expect(
    collections.getByText("Nenhuma coleção ainda.", { exact: false }),
  ).toBeVisible();
  await collections
    .getByRole("button", { name: "Fechar", exact: true })
    .click();
  await expect(profile.locator(".social-profile-cell:visible")).toHaveCount(1);
  // Await in-flight artwork routes before Playwright disposes the request context.
  await page.unrouteAll({ behavior: "wait" });
  expect(errors).toEqual([]);
});
