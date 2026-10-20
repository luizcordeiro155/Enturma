import { test } from "./student-fixture";
import { chromium, expect } from "@playwright/test";
import { authenticate } from "./session";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

test("browser displays a system notification once across realtime deliveries", async ({
  baseURL,
}) => {
  // Headless Shell has no notification backend; use the full browser in headless mode.
  const browser = await chromium.launch({
    channel: process.platform === "win32" ? "msedge" : "chromium",
  });
  const context = await browser.newContext({
    baseURL,
    serviceWorkers: "allow",
    permissions: ["notifications"],
  });
  try {
    const page = await context.newPage();
    await page.goto("/login");
    const id = randomUUID();
    await page.evaluate(async (id) => {
      await navigator.serviceWorker.register("/sw.js");
      const registration = await navigator.serviceWorker.ready;
      for (let i = 0; i < 2; i++)
        registration.active!.postMessage({
          type: "ENTURMA_SHOW_NOTIFICATION",
          data: {
            id,
            title: "Enturma · conversa",
            body: "Uma nova mensagem",
            href: "/friends?chat=test",
          },
        });
    }, id);
    await expect
      .poll(async () =>
        page.evaluate(async (id) => {
          const registration = await navigator.serviceWorker.ready;
          const notices = await registration.getNotifications({
            tag: "enturma-" + id,
          });
          return notices.map((n) => ({
            title: n.title,
            body: n.body,
            href: n.data.href,
          }));
        }, id),
      )
      .toEqual([
        {
          title: "Enturma · conversa",
          body: "Uma nova mensagem",
          href: "/friends?chat=test",
        },
      ]);
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      (await registration.getNotifications()).forEach((n) => n.close());
    });
  } finally {
    await context.close();
    await browser.close();
  }
});

test("notebook chat history, private artwork, mobile layout and real QR decoding", async ({
  page,
  request,
}) => {
  const username = "polish_" + randomUUID().slice(0, 8);
  const response = await request.post(
    `${process.env.E2E_API_URL ?? "http://localhost:8080"}/api/v1/auth/register`,
    {
      data: {
        name: "Estudante visual",
        username,
        email: username + "@example.test",
        password: "Polish-test-12345",
        device: "E2E",
      },
    },
  );
  expect(response.ok()).toBeTruthy();
  await authenticate(page.context(), await response.json());
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/notebooks");
  await page
    .getByLabel("Nome do caderno")
    .fill("Uma conversa sobre algoritmos");
  await page
    .getByRole("button", { name: "Criar caderno", exact: true })
    .click();
  await expect(page).toHaveURL(/notebooks\/[a-f0-9-]+/);
  const id = new URL(page.url()).pathname.split("/").at(-1)!;
  const db = new pg.Client({ connectionString: process.env.E2E_DATABASE_URL });
  await db.connect();
  try {
    const database = await db.query("SELECT current_database() name");
    if (!database.rows[0].name.includes("e2e"))
      throw Error("Fixture requires isolated E2E database");
    for (const [question, answer] of [
      [
        "O que é um algoritmo?",
        "Um algoritmo é uma sequência finita de passos.",
      ],
      [
        "Dê um exemplo desse conceito",
        "A receita recebe ingredientes, executa passos e entrega um resultado.",
      ],
    ])
      await db.query(
        "INSERT INTO notebook_generation(id,notebook_id,question,mode,level,context,citations,answer,status) VALUES ($1,$2,$3,'QUESTION','BEGINNER','','[]',$4,'READY')",
        [randomUUID(), id, question, answer],
      );
    await page.reload();
    await expect(page.locator(".notebook-user-message")).toHaveCount(2);
    await expect(page.locator(".notebook-conversation")).toContainText(
      "sequência finita",
    );
    await expect(page.locator(".notebook-conversation")).toContainText(
      "recebe ingredientes",
    );
    await page.getByText("Gerenciar caderno", { exact: true }).click();
    const png = await page.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 640;
      c.height = 240;
      const x = c.getContext("2d")!;
      x.fillStyle = "#245b46";
      x.fillRect(0, 0, 640, 240);
      x.fillStyle = "#d5ed82";
      x.font = "bold 48px Arial";
      x.fillText("ALGORITMOS", 70, 135);
      return c.toDataURL().split(",")[1];
    });
    await page.getByLabel("Banner do caderno", { exact: true }).setInputFiles({
      name: "banner.png",
      mimeType: "image/png",
      buffer: Buffer.from(png, "base64"),
    });
    await expect(page.locator(".notebook-banner")).toBeVisible();
    await page.reload();
    await expect(page.locator(".notebook-banner")).toBeVisible();
    await expect(page.locator(".enturma-launch-overlay")).toHaveCount(0, {
      timeout: 20000,
    });
    await page.screenshot({
      path: join(tmpdir(), "enturma-notebook-desktop.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: join(tmpdir(), "enturma-notebook-mobile.png"),
      fullPage: true,
    });
    const subject = (
      await db.query(
        "SELECT id FROM academic_entry WHERE kind='SUBJECT' AND status='VERIFIED' LIMIT 1",
      )
    ).rows[0];
    expect(subject).toBeTruthy();
    await db.query(
      "INSERT INTO user_subject(user_id,subject_id) SELECT id,$1 FROM app_user WHERE username=$2 ON CONFLICT DO NOTHING",
      [subject.id, username],
    );
    const created = await page.request.post("/api/backend/study-rooms", {
      headers: { Origin: new URL(page.url()).origin },
      data: {
        subjectId: subject.id,
        title: "Teste de câmera QR",
        minutes: 50,
        maxParticipants: 10,
        days: 0,
      },
    });
    expect(created.ok(), await created.text()).toBeTruthy();
    const room = await created.json();
    const shared = await page.request.post(
      `/api/backend/study-rooms/${room.id}/share-code`,
      { headers: { Origin: new URL(page.url()).origin } },
    );
    expect(shared.ok()).toBeTruthy();
    const qr = await page.request.get(`/api/backend/study-rooms/${room.id}/qr`);
    expect(qr.ok()).toBeTruthy();
    await page.goto("/rooms");
    await page.addScriptTag({
      path: createRequire(__filename).resolve("jsqr"),
    });
    const decoded = await page.evaluate(
      async (image) => {
        const c = document.createElement("canvas");
        c.width = 640;
        c.height = 640;
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, 640, 640);
        const img = new Image();
        img.src = image;
        await img.decode();
        ctx.drawImage(img, 80, 80, 480, 480);
        const pixels = ctx.getImageData(0, 0, 640, 640);
        const read = (
          window as unknown as {
            jsQR: (
              data: Uint8ClampedArray,
              width: number,
              height: number,
            ) => { data: string } | null;
          }
        ).jsQR(pixels.data, 640, 640);
        const streams: MediaStream[] = [];
        Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
          configurable: true,
          value: async () => {
            const stream = c.captureStream(12);
            streams.push(stream);
            const repaint = setInterval(() => {
              if (
                stream
                  .getTracks()
                  .every((track) => track.readyState === "ended")
              ) {
                clearInterval(repaint);
                return;
              }
              ctx.drawImage(img, 80, 80, 480, 480);
            }, 80);
            return stream;
          },
        });
        (
          window as unknown as { testCameraStreams: MediaStream[] }
        ).testCameraStreams = streams;
        return read?.data;
      },
      "data:" +
        qr.headers()["content-type"].split(";")[0] +
        ";base64," +
        (await qr.body()).toString("base64"),
    );
    expect(decoded).toBe((await shared.json()).url);
    await page.getByRole("button", { name: "Escanear QR da sala" }).click();
    await expect(page).toHaveURL(/\/join\/[A-Z2-9]{8}$/);
    await page
      .getByRole("button", { name: "Entrar na sala", exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`/rooms/${room.id}`), {
      timeout: 30000,
    });
    expect(
      await page.evaluate(() =>
        (
          window as unknown as { testCameraStreams: MediaStream[] }
        ).testCameraStreams
          .flatMap((stream) => stream.getTracks())
          .every((t) => t.readyState === "ended"),
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  } finally {
    await db.end();
  }
});

test("completion opens rating automatically; stars have contrast and saving returns to map", async ({
  page,
  request,
}) => {
  const tag = randomUUID().slice(0, 8);
  const registered = await request.post(
    `${process.env.E2E_API_URL ?? "http://localhost:8080"}/api/v1/auth/register`,
    {
      data: {
        name: "Passageiro teste",
        username: "rating_" + tag,
        email: "rating_" + tag + "@example.test",
        password: "Rating-test-12345",
        device: "E2E",
      },
    },
  );
  await authenticate(page.context(), await registered.json());
  const me = (await (await page.request.get("/api/backend/users/me")).json())
    .id;
  let reviewed = false;
  await page.route("**/api/backend/rides/mobility/state", async (route) =>
    route.fulfill({
      json: {
        recentCompleted: reviewed
          ? null
          : {
              id: "test-completed-trip",
              driverId: randomUUID(),
              passengerId: me,
              driverName: "Motorista teste",
              passengerName: "Passageiro teste",
              reviewed: false,
            },
      },
    }),
  );
  await page.route(
    "**/api/backend/matches/test-completed-trip/review",
    async (route) => {
      expect(route.request().postDataJSON().rating).toBe(5);
      reviewed = true;
      await route.fulfill({ status: 204 });
    },
  );
  await page.goto("/home");
  const dialog = page.getByRole("dialog", { name: "Como foi a carona?" });
  await expect(dialog).toBeVisible();
  for (const theme of ["light", "dark"]) {
    await page.evaluate(
      (value) => (document.documentElement.dataset.theme = value),
      theme,
    );
    const empty = dialog.getByRole("radio", { name: "1 estrela", exact: true });
    await expect(empty.locator("svg")).not.toHaveCSS("stroke", "none");
    expect(
      await empty.evaluate(
        (el) =>
          getComputedStyle(el).color !== getComputedStyle(el).backgroundColor,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await dialog.getByRole("radio", { name: "5 estrelas" }).click();
  await expect(
    dialog.getByRole("radio", { name: "5 estrelas" }),
  ).toHaveAttribute("aria-checked", "true");
  await page.screenshot({ path: join(tmpdir(), "enturma-rating-mobile.png") });
  await dialog
    .getByRole("button", { name: "Enviar avaliação e voltar ao mapa" })
    .click();
  await expect(page).toHaveURL(/\/caronas$/);
  await expect(dialog).toHaveCount(0);
});
