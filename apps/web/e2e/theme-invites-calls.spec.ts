import { test } from "./student-fixture";
import { expect } from "@playwright/test";
import { authenticate } from "./session";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const backend = process.env.E2E_API_URL ?? "http://localhost:8080";

test("access pages fit desktop windows and retain mobile fields", async ({
  page,
}, info) => {
  for (const path of [
    "login",
    "register",
    "forgot-password",
    "reset-password",
  ]) {
    await page.goto(`/${path}`);
    for (const width of [1100, 1440, 390]) {
      await page.setViewportSize({ width, height: width === 1100 ? 740 : 900 });
      for (const theme of ["Claro", "Escuro", "Enturma"]) {
        await page
          .locator(".auth-theme-control")
          .getByRole("button", { name: theme, exact: true })
          .click();
        await expect(page.locator("html")).not.toHaveClass(
          /enturma-theme-transition/,
        );
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        if (width > 1000)
          expect(
            await page.evaluate(
              () => document.documentElement.scrollHeight <= innerHeight + 1,
            ),
          ).toBe(true);
        if (path !== "login") {
          const link = page.getByRole("link", {
            name: "Entrar na minha conta",
          });
          expect(
            await link.evaluate(
              (el) => getComputedStyle(el).textDecorationLine,
            ),
          ).toContain("underline");
        }
        if (width !== 1440)
          await page.screenshot({
            path: info.outputPath(`${path}-${width}-${theme}.png`),
            fullPage: true,
          });
      }
    }
  }
  await page.setViewportSize({ width: 1000, height: 420 });
  await page.goto("/register");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight > innerHeight,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Criar conta", exact: true })
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("button", { name: "Criar conta", exact: true }),
  ).toBeVisible();
});

test("call control states remain legible on every palette and mobile hides sharing", async ({
  page,
}, info) => {
  for (const mobile of [false, true]) {
    const markup = execFileSync(
      process.execPath,
      [
        resolve("e2e/render-call-controls.mjs"),
        ...(mobile ? ["--mobile"] : []),
      ],
      { encoding: "utf8" },
    );
    await page.setViewportSize({ width: mobile ? 390 : 1200, height: 800 });
    await page.goto("/login");
    // Render the real controls with production CSS; device capture is covered separately.
    await page.evaluate((markup) => {
      const dialog = document.createElement("dialog");
      dialog.id = "call-controls-fixture";
      dialog.style.cssText =
        "width: min(900px, calc(100vw - 24px)); padding: 24px 8px; background: var(--surface); color:var(--ink)";
      dialog.innerHTML = `<div class="discord-call">${markup}</div>`;
      document.body.append(dialog);
      dialog.showModal();
    }, markup);
    for (const theme of ["light", "dark", "enturma"]) {
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme =
          theme === "light" ? "light" : "dark";
        document.documentElement.dataset.palette =
          theme === "enturma" ? "enturma" : "default";
      }, theme);
      const controls = page.locator("#call-controls-fixture");
      const muted = controls.getByRole("button", {
        name: "Ativar som da chamada",
      });
      const colors = await muted.evaluate((el) => [
        getComputedStyle(el).backgroundColor,
        getComputedStyle(el).color,
      ]);
      expect(colors).toEqual(["rgb(158, 48, 66)", "rgb(255, 255, 255)"]);
      expect(
        await controls.evaluate((el) => el.scrollWidth <= el.clientWidth),
      ).toBe(true);
      await expect(
        controls.getByRole("button", { name: "Qualidade" }),
      ).toHaveCount(mobile ? 0 : 1);
      await page.screenshot({
        path: info.outputPath(
          `call-controls-${theme}-${mobile ? "mobile" : "desktop"}.png`,
        ),
      });
    }
  }
});

test("saved Enturma contrast and theme cycle survive navigation without reload", async ({
  page,
  request,
}, info) => {
  const username = `themes_${randomUUID().slice(0, 8)}`;
  const registration = await request.post(`${backend}/api/v1/auth/register`, {
    data: {
      name: username,
      username,
      email: `${username}@example.test`,
      password: "abc123",
      device: "E2E",
    },
  });
  expect(registration.ok()).toBe(true);
  await authenticate(page.context(), await registration.json());
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/home");
  await page
    .getByRole("button", { name: "Acessibilidade", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Aparência e acessibilidade",
  });
  await dialog.getByLabel("Tema", { exact: true }).selectOption("ENTURMA");
  await dialog.getByLabel("Alto contraste").check();
  await expect(page.locator("html")).toHaveAttribute("data-palette", "enturma");
  await expect(page.locator("html")).toHaveAttribute(
    "data-high-contrast",
    "true",
  );
  await dialog.getByRole("button", { name: "Fechar configurações" }).click();
  await page
    .locator("html")
    .evaluate((el) => (el.dataset.navigationProbe = "kept"));
  for (const label of ["Fórum", "Salas", "Início"]) {
    await page
      .locator(".sidebar")
      .getByRole("link", { name: label, exact: true })
      .click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-palette",
      "enturma",
    );
    await expect(page.locator("html")).toHaveAttribute(
      "data-high-contrast",
      "true",
    );
    expect(
      await page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue("--bg")
          .trim(),
      ),
    ).toBe("#061c13");
    await expect(page.locator(".enturma-launch-overlay")).toHaveCount(0);
    await expect(page.locator("html")).toHaveAttribute(
      "data-navigation-probe",
      "kept",
    );
  }
  const picker = page.locator(".topbar .theme-picker");
  await picker.hover();
  await expect(picker.getByRole("menuitemradio")).toHaveText([
    "Claro",
    "Escuro",
    "Enturma",
    "Sistema",
  ]);
  await picker
    .getByRole("menuitemradio", { name: "Claro", exact: true })
    .click();
  for (const selected of ["Escuro", "Enturma", "Sistema", "Claro"]) {
    await picker.getByRole("button", { name: /Alternar tema/ }).click();
    await expect(
      picker.getByRole("button", { name: /Alternar tema/ }),
    ).toHaveAttribute(
      "aria-label",
      new RegExp(`Tema ${selected.toLowerCase()}`),
    );
  }
  await page
    .getByRole("button", { name: "Acessibilidade", exact: true })
    .click();
  await dialog.getByLabel("Tema", { exact: true }).selectOption("ENTURMA");
  await dialog.getByRole("button", { name: "Fechar configurações" }).click();
  await page.screenshot({ path: info.outputPath("enturma-high-contrast.png") });
});

test("private invitation fits all themes, requires consent and keeps navigation internal", async ({
  page,
  browser,
  request,
}, info) => {
  test.setTimeout(150000);
  const db = new pg.Client({ connectionString: process.env.E2E_DATABASE_URL });
  await db.connect();
  expect((await db.query("SELECT current_database() name")).rows[0].name).toBe(
    "enturma_e2e",
  );
  const recipientContext = await browser.newContext();
  const recipient = await recipientContext.newPage();
  try {
    async function register() {
      const username = `invite_${randomUUID().slice(0, 8)}`;
      const result = await request.post(`${backend}/api/v1/auth/register`, {
        data: {
          name: username,
          username,
          email: `${username}@example.test`,
          password: "abc123",
          device: "E2E",
        },
      });
      expect(result.ok()).toBe(true);
      const credentials = await result.json();
      await db.query("UPDATE app_user SET email_verified=true WHERE id=$1", [
        credentials.userId,
      ]);
      return {
        ...credentials,
        username,
        headers: { Authorization: `Bearer ${credentials.accessToken}` },
      };
    }
    const a = await register(),
      b = await register();
    const friend = await request.post(`${backend}/api/v1/friends`, {
      headers: a.headers,
      data: { username: b.username },
    });
    expect(friend.ok()).toBe(true);
    const friendship = (await friend.json()).id;
    expect(
      (
        await request.post(`${backend}/api/v1/friends/${friendship}/accept`, {
          headers: b.headers,
        })
      ).ok(),
    ).toBe(true);
    const subject = (
      await db.query(
        "SELECT s.id,s.parent_id FROM academic_entry s JOIN academic_entry p ON p.id=s.parent_id WHERE s.kind='SUBJECT' AND s.status='VERIFIED' AND p.status='VERIFIED' LIMIT 1",
      )
    ).rows[0];
    for (const account of [a, b])
      expect(
        (
          await request.put(`${backend}/api/v1/users/me/enrollment`, {
            headers: account.headers,
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
      headers: a.headers,
      data: {
        subjectId: subject.id,
        title: "Uma turma para estudar e construir ideias em companhia",
        days: 1,
        minutes: 50,
        maxParticipants: 10,
      },
    });
    expect(created.ok()).toBe(true);
    const room = await created.json();
    const shared = await request.post(
      `${backend}/api/v1/study-rooms/${room.id}/share-code`,
      { headers: a.headers },
    );
    expect(shared.ok()).toBe(true);
    const { code } = await shared.json();
    // Production-origin invitations must stay inside preview/native clients, too.
    const invitation = `https://enturma-flax.vercel.app/join/${code}`;
    await authenticate(page.context(), a);
    await authenticate(recipientContext, b);
    await page.goto("/friends");
    await recipient.goto("/friends");
    await page.getByRole("button", { name: "Conversar", exact: true }).click();
    await recipient
      .getByRole("button", { name: "Conversar", exact: true })
      .click();
    await page.getByLabel("Mensagem privada", { exact: true }).fill(invitation);
    await page
      .getByRole("button", { name: "Enviar mensagem", exact: true })
      .click();
    const card = recipient.locator(".room-invitation-card");
    await expect(card.getByRole("heading", { name: room.title })).toBeVisible();
    for (const width of [360, 1440]) {
      await recipient.setViewportSize({ width, height: 860 });
      for (const theme of ["LIGHT", "DARK", "ENTURMA"]) {
        await recipient.evaluate((theme) => {
          const preference = {
            theme,
            fontScale: 1,
            highContrast: false,
            reducedMotion: true,
            enhancedFocus: true,
          };
          localStorage.setItem(
            "enturma-experience",
            JSON.stringify(preference),
          );
          window.dispatchEvent(
            new StorageEvent("storage", { key: "enturma-experience" }),
          );
        }, theme);
        await expect(card).toBeVisible();
        await recipient.screenshot({
          path: info.outputPath(`invitation-${theme}-${width}.png`),
        });
        expect(
          await card.evaluate(
            (node) => node.scrollWidth <= node.clientWidth + 1,
          ),
        ).toBe(true);
        const box = (await card.boundingBox())!;
        expect(box.width).toBeGreaterThan(180);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
        await recipient
          .getByRole("link", { name: invitation, exact: true })
          .click();
        const confirmation = recipient.getByRole("dialog", {
          name: "Entrar nesta turma?",
        });
        await expect(
          confirmation.getByRole("button", { name: "Aceitar e entrar" }),
        ).toBeEnabled();
        await expect(
          recipient.getByRole("dialog", {
            name: "Você está saindo do Enturma",
          }),
        ).toHaveCount(0);
        expect(
          await confirmation.evaluate(
            (node) => node.scrollWidth <= node.clientWidth + 1,
          ),
        ).toBe(true);
        await recipient.screenshot({
          path: info.outputPath(`consent-${theme}-${width}.png`),
        });
        await confirmation.getByRole("button", { name: "Agora não" }).click();
        await expect(confirmation).toHaveCount(0);
        expect(
          (
            await db.query(
              "SELECT count(*) n FROM room_participant WHERE room_id=$1 AND user_id=$2",
              [room.id, b.userId],
            )
          ).rows[0].n,
        ).toBe("0");
      }
    }
    // History is rendered from persisted outcomes, not fabricated UI state.
    await db.query(
      "INSERT INTO private_call(id,friendship_id,caller_id,callee_id,video,caller_device,state,expires_at) VALUES ($1,$2,$3,$4,false,$5,'DECLINED',now())",
      [randomUUID(), friendship, a.userId, b.userId, randomUUID()],
    );
    await recipient.evaluate(() =>
      window.dispatchEvent(new Event("enturma-private_call_changed")),
    );
    await expect(recipient.locator(".private-call-history")).toContainText(
      "Recebida · Recusada",
    );
    await recipient.screenshot({ path: info.outputPath("call-history.png") });
    await card.getByRole("button", { name: "Entrar na sala" }).click();
    await recipient
      .getByRole("dialog", { name: "Entrar nesta turma?" })
      .getByRole("button", { name: "Aceitar e entrar" })
      .click();
    await expect(recipient).toHaveURL(new RegExp(`/rooms/${room.id}$`));
    expect(recipientContext.pages()).toHaveLength(1);
  } finally {
    await recipientContext.close();
    await db.end();
  }
});
