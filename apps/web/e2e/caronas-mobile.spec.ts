import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { authenticate } from "./session";
import { test } from "./student-fixture";

const backend = process.env.E2E_API_URL ?? "http://localhost:8080";

async function student(
  page: Page,
  request: Parameters<Parameters<typeof test>[2]>[0]["request"],
) {
  const tag = randomUUID().slice(0, 8);
  const registered = await request.post(`${backend}/api/v1/auth/register`, {
    data: {
      name: "Carona Celular",
      username: `ride_m_${tag}`,
      email: `ride-m-${tag}@example.test`,
      password: "E2E-password-long-123",
      device: "E2E",
    },
  });
  expect(registered.ok()).toBe(true);
  const credentials = await registered.json();
  await authenticate(page.context(), credentials);
  return credentials as { accessToken: string };
}

test("no celular o ponto centralizado aparece acima do painel de pedir carona", async ({
  page,
  request,
}) => {
  test.setTimeout(90000);
  await student(page, request);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.context().setGeolocation({
    // Synthetic E2E position, never saved as a real user's location.
    latitude: -19.925,
    longitude: -43.938,
    accuracy: 20,
  });
  await page.goto("/caronas");
  const sheet = page.locator(".ride-bottom-sheet");
  await expect(sheet).toBeVisible({ timeout: 20000 });
  await page
    .context()
    .grantPermissions(["geolocation"], { origin: new URL(page.url()).origin });
  await page.getByRole("button", { name: "Recentralizar mapa" }).click();
  const me = page.locator(".ride-map-marker.marker-me");
  await expect(me).toBeVisible();

  const visibleBand = async () => {
    const top = (await page.locator(".ride-map-top").boundingBox())!;
    const panel = (await sheet.boundingBox())!;
    return { from: top.y + top.height, to: panel.y };
  };
  const centreOf = async () => {
    const box = (await me.boundingBox())!;
    return box.y + box.height / 2;
  };
  const centred = () =>
    expect
      .poll(async () => {
        const band = await visibleBand();
        return Math.abs((await centreOf()) - (band.from + band.to) / 2);
      })
      .toBeLessThan(24);
  // The camera eases to the point and rests in the middle of the part of the
  // map that is not under the top bar or the sheet.
  await centred();

  // Pulling the handle down folds the sheet: more map, and the point moves to
  // the middle of the larger visible part.
  const handle = sheet.locator(".ride-sheet-handle");
  const grip = (await handle.boundingBox())!;
  await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
  await page.mouse.down();
  await page.mouse.move(grip.x + grip.width / 2, grip.y + 90, { steps: 4 });
  await page.mouse.up();
  await expect(sheet).toHaveAttribute("data-snap", "peek");
  await centred();

  // A tap opens it again, a second one takes the whole height, a third gives
  // the map back, and the point is centred above the sheet once more.
  await sheet.getByRole("button", { name: "Expandir painel" }).click();
  await expect(sheet).toHaveAttribute("data-snap", "half");
  await sheet.getByRole("button", { name: "Expandir painel" }).click();
  await expect(sheet).toHaveAttribute("data-snap", "full");
  await sheet.getByRole("button", { name: "Recolher painel" }).click();
  await expect(sheet).toHaveAttribute("data-snap", "half");
  await centred();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: test.info().outputPath("caronas-mobile.png") });
});

const campusPoint = { lat: -19.9321, lng: -43.9387 };

/** Two verified students of one synthetic campus, with a ride already matched. */
async function matchedRide(request: APIRequestContext) {
  const tag = randomUUID().slice(0, 8);
  const password = "E2E-password-long-123";
  const register = async (name: string, slug: string) => {
    const email = `${slug}-${tag}@example.test`;
    const response = await request.post(`${backend}/api/v1/auth/register`, {
      data: {
        name,
        username: `${slug}_${tag}`,
        email,
        password,
        device: "E2E",
      },
    });
    expect(response.ok(), await response.text()).toBe(true);
    return {
      email,
      ...((await response.json()) as {
        accessToken: string;
        refreshToken: string;
      }),
    };
  };
  let driver = await register("Motorista Teste", "ride_d");
  const passenger = await register("Passageira Teste", "ride_p");

  const db = new pg.Client({ connectionString: process.env.E2E_DATABASE_URL });
  await db.connect();
  const ids: Record<string, string> = {};
  try {
    await db.query("UPDATE app_user SET role='ADMIN' WHERE email=$1", [
      driver.email,
    ]);
    const login = await request.post(`${backend}/api/v1/auth/login`, {
      data: { email: driver.email, password, device: "E2E setup" },
    });
    expect(login.ok(), await login.text()).toBe(true);
    driver = { email: driver.email, ...(await login.json()) };
    let parentId: string | null = null;
    const entries = [
      "INSTITUTION",
      "CAMPUS",
      "COURSE",
      "CURRICULUM",
      "PERIOD",
      "SUBJECT",
    ].map((kind) => {
      const id = randomUUID();
      ids[kind] = id;
      const entry = {
        id,
        kind,
        parentId,
        name: `TESTE E2E ${kind} ${tag}`,
        code: null,
        curriculumVersion: kind === "CURRICULUM" ? "fixture-v1" : null,
        periodNumber: kind === "PERIOD" ? 1 : null,
        sourceUrl: "https://example.test/e2e",
        sourceName: "Fixture sintética exclusiva de testes",
        verifiedAt: new Date(Date.now() - 60000).toISOString(),
        validFrom: "2020-01-01",
        validUntil: null,
        status: "VERIFIED",
      };
      parentId = id;
      return entry;
    });
    const imported = await request.post(
      `${backend}/api/v1/admin/academics/import`,
      {
        headers: { Authorization: `Bearer ${driver.accessToken}` },
        data: { entries },
      },
    );
    expect(imported.ok(), await imported.text()).toBe(true);
    // Synthetic coordinates for the fixture campus; no real place is stored.
    await db.query(
      "UPDATE academic_campus SET address_label='Campus Teste',latitude=$2,longitude=$3 WHERE id=$1",
      [ids.CAMPUS, campusPoint.lat, campusPoint.lng],
    );
  } finally {
    await db.end();
  }

  const as = (user: { accessToken: string }) => ({
    Authorization: `Bearer ${user.accessToken}`,
  });
  const call = async (
    method: "put" | "post" | "get",
    user: { accessToken: string },
    path: string,
    data?: unknown,
  ) => {
    const response = await request[method](`${backend}/api/v1${path}`, {
      headers: as(user),
      data,
    });
    expect(response.ok(), `${path}: ${await response.text()}`).toBe(true);
    return response.status() === 204
      ? undefined
      : response.json().catch(() => undefined);
  };
  const home = { lat: -19.918, lng: -43.963 };
  for (const user of [driver, passenger]) {
    await call("put", user, "/users/me/enrollment", {
      periodId: ids.PERIOD,
      subjectIds: [ids.SUBJECT],
      shift: "EVENING",
      preferences: "",
    });
    await call("put", user, "/rides/mobility/preferences", {
      campusId: ids.CAMPUS,
      campusLabel: "Campus Teste",
      campusLat: campusPoint.lat,
      campusLng: campusPoint.lng,
      homeLabel: "Casa de teste",
      homeLat: home.lat,
      homeLng: home.lng,
      onboardingDone: true,
    });
  }
  await call("put", driver, "/rides/vehicle", {
    brand: "Honda",
    model: "Fit",
    color: "Prata",
    modelYear: 2020,
    seats: 3,
    plateHint: "••1A23",
  });
  const search = await call("post", passenger, "/rides/dispatch/search", {
    campusId: ids.CAMPUS,
    direction: "TO_CAMPUS",
    startLabel: "Caiçara",
    startLat: home.lat,
    startLng: home.lng,
    endLabel: "Campus Teste",
    endLat: campusPoint.lat,
    endLng: campusPoint.lng,
    routeDistanceMeters: 4200,
    routeDurationSeconds: 900,
  });
  await call("put", driver, "/rides/driver/availability", {
    campusId: ids.CAMPUS,
    direction: "TO_CAMPUS",
    seats: 3,
    startLabel: "Padre Eustáquio",
    startLat: -19.916,
    startLng: -43.957,
    endLabel: "Campus Teste",
    endLat: campusPoint.lat,
    endLng: campusPoint.lng,
    lat: -19.916,
    lng: -43.957,
    accuracyMeters: 20,
  });
  await call("post", driver, `/rides/driver/requests/${search.id}/accept`);
  const matches = (await call("get", passenger, "/matches")) as {
    id: string;
    rideId: string;
  }[];
  expect(matches.length).toBeGreaterThan(0);
  return { driver, passenger, match: matches[0], call };
}

test("a conversa da corrida é temporária: abre durante a corrida e encerra com ela", async ({
  browser,
  request,
}) => {
  test.setTimeout(150000);
  const { driver, passenger, match, call } = await matchedRide(request);
  const phone = async (
    user: { accessToken: string; refreshToken: string },
    at: { lat: number; lng: number },
  ) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      geolocation: { latitude: at.lat, longitude: at.lng, accuracy: 20 },
      permissions: ["geolocation"],
    });
    await authenticate(context, user as never);
    const page = await context.newPage();
    await page.goto("/caronas");
    return page;
  };
  const rider = await phone(passenger, { lat: -19.918, lng: -43.963 });
  const wheel = await phone(driver, { lat: -19.916, lng: -43.957 });

  // The match animation plays first; the chat lives in the ride sheet after it.
  const openChat = async (page: Page) => {
    const message = page.getByRole("button", { name: /^Mensagem/ });
    await expect(message).toBeVisible({ timeout: 30000 });
    const celebration = page.getByRole("dialog", {
      name: "Deu match na carona!",
    });
    await expect(celebration).toBeVisible({ timeout: 15000 });
    await celebration.getByRole("button", { name: "Continuar depois" }).click();
    await expect(celebration).toBeHidden();
    await message.click();
  };
  await openChat(rider);
  const riderChat = rider.getByRole("dialog", {
    name: "Conversa com Motorista Teste",
  });
  await expect(riderChat).toBeVisible();
  await expect(
    riderChat.getByText(/só existe durante a corrida/),
  ).toBeVisible();
  await riderChat
    .getByLabel("Mensagem", { exact: true })
    .fill("Estou na portaria azul");
  await riderChat.getByLabel("Mensagem", { exact: true }).press("Enter");
  await expect(
    riderChat.locator('.ride-chat-message[data-mine="true"]'),
  ).toHaveText(/Estou na portaria azul/);

  // The driver sees the unread count without opening anything, then answers.
  await expect(
    wheel
      .getByRole("button", { name: /^Mensagem/ })
      .locator(".ride-chat-badge"),
  ).toHaveText("1", { timeout: 20000 });
  await openChat(wheel);
  const wheelChat = wheel.getByRole("dialog", {
    name: "Conversa com Passageira Teste",
  });
  await expect(
    wheelChat.locator('.ride-chat-message[data-mine="false"]'),
  ).toHaveText(/Estou na portaria azul/);
  await wheelChat.getByRole("button", { name: "Estou a caminho" }).click();
  await expect(
    riderChat.locator('.ride-chat-message[data-mine="false"]'),
  ).toHaveText(/Estou a caminho/, { timeout: 20000 });

  // The chat fits the phone: nothing spills sideways and the field stays in view.
  for (const page of [rider, wheel]) {
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(page.getByLabel("Mensagem", { exact: true })).toBeInViewport();
  }
  await rider.screenshot({
    path: test.info().outputPath("chat-passageiro.png"),
  });
  await wheel.screenshot({
    path: test.info().outputPath("chat-motorista.png"),
  });

  // When the ride ends, so does the conversation, for both.
  await call("post", driver, `/rides/${match.rideId}/status`, {
    status: "CANCELLED",
  });
  await expect(riderChat).toHaveCount(0, { timeout: 20000 });
  await expect(wheelChat).toHaveCount(0, { timeout: 20000 });
  const late = await request.post(
    `${backend}/api/v1/matches/${match.id}/messages`,
    {
      headers: { Authorization: `Bearer ${passenger.accessToken}` },
      data: { body: "Ainda está aí?" },
    },
  );
  expect(late.ok()).toBe(false);
  await rider.context().close();
  await wheel.context().close();
});
