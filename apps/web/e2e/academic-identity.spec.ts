import {
  test,
  expect,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { authenticate } from "./session";

const backend = process.env.E2E_API_URL ?? "http://localhost:8080";
const password = "Academic-test-password-2026";
const tag = randomUUID().slice(0, 8);
const institutionId = randomUUID(),
  campusId = randomUUID();
const institutionName = `TESTE VERIFICAÇÃO ${tag}`;
const domain = `alunos-${tag}.example.test`;
let db: pg.Client;
let admin: { accessToken: string; refreshToken: string };

async function register(
  request: APIRequestContext,
  name = "Estudante acadêmico",
) {
  const username = `acad_${randomUUID().slice(0, 8)}`;
  const response = await request.post(`${backend}/api/v1/auth/register`, {
    data: {
      name,
      username,
      email: `${username}@example.test`,
      password,
      device: "Academic E2E",
    },
  });
  expect(response.ok(), await response.text()).toBe(true);
  return { ...(await response.json()), email: `${username}@example.test` };
}
async function selectInstitution(page: Page) {
  await page.getByLabel("Buscar instituição").fill(institutionName);
  await page.getByRole("button", { name: new RegExp(institutionName) }).click();
  await page.getByLabel(/Campus/).selectOption(campusId);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Confirme seu e-mail acadêmico" }),
  ).toBeVisible();
}
function mailBody(raw: string) {
  const split = raw.indexOf("\r\n\r\n");
  const headers = raw.slice(0, split),
    body = raw.slice(split + 4);
  if (/Content-Transfer-Encoding: base64/i.test(headers))
    return Buffer.from(body.replace(/\s/g, ""), "base64").toString("utf8");
  if (/Content-Transfer-Encoding: quoted-printable/i.test(headers))
    return body
      .replace(/=\r\n/g, "")
      .replace(/=([a-f0-9]{2})/gi, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16)),
      );
  return body;
}
test.beforeAll(async ({ request }) => {
  const connection = new URL(process.env.E2E_DATABASE_URL!);
  if (
    !["127.0.0.1", "localhost"].includes(connection.hostname) ||
    connection.pathname !== "/enturma_e2e"
  )
    throw Error("Academic E2E requires local enturma_e2e");
  db = new pg.Client({ connectionString: connection.href });
  await db.connect();
  const account = await register(request, "Equipe de análise E2E");
  // Only the administrative fixture is approved directly; every subject remains pending.
  await db.query("UPDATE app_user SET role='ADMIN' WHERE email=$1", [
    account.email,
  ]);
  await db.query(
    "UPDATE academic_identity SET status='STUDENT_VERIFIED',method='TEST_FIXTURE',confidence='TEST_FIXTURE' WHERE user_id=(SELECT id FROM app_user WHERE email=$1)",
    [account.email],
  );
  admin = account;
  const entries = [
    {
      id: institutionId,
      kind: "INSTITUTION",
      parentId: null,
      name: institutionName,
    },
    {
      id: campusId,
      kind: "CAMPUS",
      parentId: institutionId,
      name: `Campus ${tag}`,
    },
  ].map((e) => ({
    ...e,
    code: null,
    curriculumVersion: null,
    periodNumber: null,
    sourceUrl: "https://example.test/e2e",
    sourceName: "Fixture isolada",
    verifiedAt: new Date(Date.now() - 60000).toISOString(),
    validFrom: "2020-01-01",
    validUntil: null,
    status: "VERIFIED",
  }));
  const imported = await request.post(
    `${backend}/api/v1/admin/academics/import`,
    {
      headers: { Authorization: `Bearer ${admin.accessToken}` },
      data: { entries },
    },
  );
  expect(imported.ok(), await imported.text()).toBe(true);
  const saved = await request.put(
    `${backend}/api/v1/admin/academic-verification/domains`,
    {
      headers: { Authorization: `Bearer ${admin.accessToken}` },
      data: {
        institutionId,
        domain,
        status: "APPROVED",
        shared: false,
        allowSubdomains: false,
        sourceUrl: "https://example.test/official-mail",
      },
    },
  );
  expect(saved.ok(), await saved.text()).toBe(true);
});
test.afterAll(async () => {
  await db?.end();
});

test("cadastro real, SMTP e confirmação em outro dispositivo liberam a tela sem atualizar", async ({
  page,
  browser,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const username = `web_${randomUUID().slice(0, 8)}`;
  await page.goto("/register");
  await page.getByLabel("Seu nome", { exact: true }).fill("Camila Acadêmica");
  await page.getByLabel("Nome de usuário", { exact: true }).fill(username);
  await page
    .getByLabel("E-mail", { exact: true })
    .fill(`${username}@example.test`);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByLabel("Confirmar senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page).toHaveURL(/academic-verification/);
  await selectInstitution(page);
  await page.evaluate(() => {
    const c = new BroadcastChannel("enturma-academic");
    c.postMessage({ type: "approved", accessAllowed: true });
    c.close();
  });
  await expect(page.getByText("Acesso liberado!", { exact: true })).toHaveCount(
    0,
  );
  const email = `${username}@${domain}`;
  await page.getByLabel("E-mail institucional").fill(email);
  await page
    .getByRole("button", { name: "Enviar link de confirmação" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: /Preparando seu e-mail|Confira seu e-mail/,
    }),
  ).toBeVisible();
  let link = "";
  await expect
    .poll(
      async () => {
        const response = await request.get(
          `http://127.0.0.1:1026/?recipient=${encodeURIComponent(email)}`,
        );
        const mails = (await response.json()) as { raw: string }[];
        link =
          mails
            .map((m) => mailBody(m.raw))
            .join("\n")
            .match(
              /http:\/\/localhost:3000\/verify-academic#token=[A-Za-z0-9_-]+/,
            )?.[0] ?? "";
        return Boolean(link);
      },
      { timeout: 20000 },
    )
    .toBe(true);
  // A separate context has no Enturma cookies, matching a link opened on another device.
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    const confirmation = await phone.newPage();
    await confirmation.goto(link);
    await expect(
      confirmation.getByRole("heading", {
        name: "E-mail acadêmico confirmado.",
      }),
    ).toBeVisible();
    await expect(page).toHaveURL(/onboarding/, { timeout: 20000 });
    await expect(page.getByText(/Etapa 3 de 6/)).toBeVisible();
    const state = await db.query(
      "SELECT a.status,a.confidence,u.email_verified FROM academic_identity a JOIN app_user u ON u.id=a.user_id WHERE u.username=$1",
      [username],
    );
    expect(state.rows[0]).toEqual({
      status: "STUDENT_VERIFIED",
      confidence: "AUTHORIZED_EMAIL_CONTROL",
      email_verified: false,
    });
    const reopened = await browser.newContext({
      storageState: await page.context().storageState(),
    });
    try {
      const resumed = await reopened.newPage();
      await resumed.goto("/home");
      await expect(resumed).toHaveURL(/home/);
      await expect(
        resumed.getByRole("heading", { name: /Seu próximo estudo/ }),
      ).toBeVisible();
    } finally {
      await reopened.close();
    }
    expect(errors).toEqual([]);
  } finally {
    await phone.close();
  }
});

test("pendente não entra em salas nem caronas; offline e broadcast não aprovam a conta", async ({
  page,
  request,
}) => {
  const account = await register(request);
  await authenticate(page.context(), account);
  for (const route of ["study-rooms", "rides", "friends"]) {
    const response = await request.get(`${backend}/api/v1/${route}`, {
      headers: { Authorization: `Bearer ${account.accessToken}` },
    });
    expect(response.status()).toBe(403);
    expect((await response.json()).code).toBe("ACADEMIC_VERIFICATION_REQUIRED");
  }
  await page.goto("/rides");
  await expect(page).toHaveURL(/academic-verification/);
  await expect(
    page.getByRole("heading", { name: "Onde você estuda?" }),
  ).toBeVisible();
  const sockets = await page.evaluate(
    async ({ endpoint, token }) => {
      const probe = (scope: string) =>
        new Promise<string | number>((resolve, reject) => {
          const socket = new WebSocket(endpoint);
          const timer = setTimeout(() => {
            socket.close();
            reject(Error("WebSocket response timeout"));
          }, 5000);
          const finish = (result: string | number) => {
            clearTimeout(timer);
            socket.close();
            resolve(result);
          };
          socket.onopen = () => socket.send(JSON.stringify({ token, scope }));
          socket.onmessage = (e) => finish(JSON.parse(e.data).type);
          socket.onclose = (e) => finish(e.code);
          socket.onerror = () => {
            clearTimeout(timer);
            reject(Error("WebSocket connection failed"));
          };
        });
      return Promise.all([
        probe("activity"),
        probe("rides"),
        probe("academic"),
      ]);
    },
    {
      endpoint: backend.replace(/^http/, "ws") + "/ws",
      token: account.accessToken,
    },
  );
  expect(sockets).toEqual([1008, 1008, "academic_ready"]);
  await page.context().setOffline(true);
  await page.evaluate(() =>
    window.dispatchEvent(new Event("enturma-academic-revalidate")),
  );
  await expect(page.locator(".academic-error")).toBeVisible();
  await expect(page.getByText("Acesso liberado!", { exact: true })).toHaveCount(
    0,
  );
  await page.context().setOffline(false);
  await expect(page.locator(".academic-error")).toHaveCount(0);
  await expect(page).toHaveURL(/academic-verification/);
  const denied = await request.get(
    `${backend}/api/v1/admin/academic-verification`,
    { headers: { Authorization: `Bearer ${account.accessToken}` } },
  );
  expect(denied.status()).toBe(403);
});

test("comprovante privado, decisão administrativa e descarte real; mobile claro e escuro", async ({
  page,
  browser,
  request,
}) => {
  const account = await register(request, `Documento ${tag}`);
  await authenticate(page.context(), account);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await page.goto("/academic-verification?next=%2Fonboarding");
  await selectInstitution(page);
  await page
    .getByRole("button", { name: /Não possui e-mail acadêmico/ })
    .click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "matricula.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(
      "%PDF-1.4\nFixture de comprovante para teste administrativo\n%%EOF",
    ),
  });
  await page.getByRole("button", { name: "Enviar para análise" }).click();
  await expect(
    page.getByRole("heading", { name: "Comprovante em análise." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "../../.local/academic-mobile-dark.png",
    fullPage: true,
  });
  await page.emulateMedia({ colorScheme: "light" });
  await page.screenshot({
    path: "../../.local/academic-mobile-light.png",
    fullPage: true,
  });
  const operator = await browser.newContext();
  try {
    await authenticate(operator, admin);
    const review = await operator.newPage();
    await review.goto("/admin/academic-verification");
    const card = review.locator("article").filter({
      has: review.getByRole("heading", {
        name: `Documento ${tag}`,
        exact: true,
      }),
    });
    await expect(card).toBeVisible();
    const download = review.waitForEvent("download");
    await card
      .getByRole("button", { name: "Baixar comprovante privado" })
      .click();
    await download;
    await card
      .getByLabel("Justificativa")
      .fill("Vínculo confirmado pela equipe no comprovante de teste.");
    await card.getByRole("button", { name: "Aprovar vínculo" }).click();
    await expect(page).toHaveURL(/onboarding/, { timeout: 20000 });
    expect(
      (
        await db.query(
          "SELECT count(*)::int n FROM academic_verification_document WHERE user_id=(SELECT id FROM app_user WHERE email=$1)",
          [account.email],
        )
      ).rows[0].n,
    ).toBe(0);
  } finally {
    await operator.close();
  }
});

test("admin edita e desativa domínio sem afetar contas já aprovadas", async ({
  page,
}) => {
  await authenticate(page.context(), admin);
  await page.goto("/admin/academic-verification");
  const card = page
    .locator("article")
    .filter({ has: page.getByText(institutionName, { exact: true }) })
    .first();
  await card.getByRole("button", { name: "Editar associação" }).click();
  await expect(page.getByLabel("Domínio completo")).toHaveValue(domain);
  await page
    .getByLabel("Fonte oficial", { exact: true })
    .fill("https://example.test/updated-official-mail");
  await page.getByRole("button", { name: "Salvar domínio" }).click();
  await expect(page.getByRole("status")).toContainText("Domínio salvo");
  await card.getByRole("button", { name: "Desativar", exact: true }).click();
  await expect(card).toContainText("Desativado");
  expect(
    (
      await db.query(
        "SELECT status FROM academic_identity WHERE user_id=(SELECT user_id FROM user_session WHERE access_hash=encode(sha256(convert_to($1, 'UTF8')), 'hex'))",
        [admin.accessToken],
      )
    ).rows[0]?.status,
  ).toBe("STUDENT_VERIFIED");
});
