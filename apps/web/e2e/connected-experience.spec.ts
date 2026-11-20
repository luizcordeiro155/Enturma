import { test } from "./student-fixture";
import { expect } from "@playwright/test";
import { authenticate } from "./session";
import { randomUUID } from "node:crypto";

test("tema por hover e toque, edição cancelável e portfólio com arquivo real", async ({
  page,
  request,
}) => {
  const tag = randomUUID().slice(0, 8),
    username = `connected_${tag}`;
  const response = await request.post(
    `${process.env.E2E_API_URL ?? "http://localhost:8080"}/api/v1/auth/register`,
    {
      data: {
        name: "Perfil conectado",
        username,
        email: `${username}@example.test`,
        password: "Connected-test-12345",
        device: "E2E",
      },
    },
  );
  expect(response.ok()).toBe(true);
  await authenticate(page.context(), await response.json());
  await page.goto("/profile");
  await expect(page.getByRole("button", { name: /^Sobre você/ })).toBeVisible();
  const theme = page.getByRole("button", { name: /^Tema .*Alternar tema/ });
  await theme.hover();
  const themeMenu = page.getByRole("menu", { name: "Escolher tema" });
  // Headless Chromium can miss pointerenter when the topbar reflows after load.
  // Keep the hover scenario, but use the accessible keyboard path if needed.
  if (!(await themeMenu.isVisible())) {
    await theme.focus();
    await theme.press("ArrowDown");
  }
  await expect(themeMenu).toBeVisible();
  await page.getByRole("menuitemradio", { name: /Escuro/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const editCard = page.getByRole("button", { name: /^Sobre você/ });
  await expect(editCard).toHaveCSS("background-color", "rgb(22, 30, 33)");
  await expect(editCard).toHaveCSS("color", "rgb(242, 246, 244)");
  await expect(editCard.locator(".profile-edit-thumbnail svg")).toHaveCSS(
    "color",
    "rgb(242, 246, 244)",
  );
  await expect(editCard.locator("small")).toHaveCSS("opacity", "1");

  await theme.hover();
  const darkMenu = page.getByRole("menu", { name: "Escolher tema" });
  if (!(await darkMenu.isVisible())) {
    await theme.focus();
    await theme.press("ArrowDown");
  }
  const selectedDark = darkMenu.getByRole("menuitemradio", { name: /Escuro/ });
  await expect(selectedDark).toHaveCSS("color", "rgb(242, 246, 244)");
  await expect(selectedDark.locator("svg").first()).toHaveCSS(
    "color",
    "rgb(242, 246, 244)",
  );
  await selectedDark.click();
  await page.getByRole("button", { name: /^Sobre você/ }).click();
  await page
    .getByLabel("Nome exibido", { exact: true })
    .fill("Rascunho cancelado");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancelar", exact: true })
    .click();
  await page.getByRole("button", { name: /^Sobre você/ }).click();
  await expect(page.getByLabel("Nome exibido", { exact: true })).toHaveValue(
    "Perfil conectado",
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancelar", exact: true })
    .click();
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/settings");
  await theme.focus();
  await page.keyboard.press("ArrowDown");
  const menu = page.getByRole("menu", { name: "Escolher tema" });
  const bounds = (await menu.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(360);
  await page.getByRole("menuitemradio", { name: /Claro/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/profile");
  const lightCard = page.getByRole("button", { name: /^Sobre você/ });
  await expect(lightCard).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(lightCard).toHaveCSS("color", "rgb(23, 63, 54)");
  await expect(lightCard.locator(".profile-edit-thumbnail svg")).toHaveCSS(
    "color",
    "rgb(23, 63, 54)",
  );
  await page.getByRole("button", { name: /^Estilo do nome/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page
      .getByRole("dialog")
      .evaluate((n) => n.scrollWidth <= n.clientWidth),
  ).toBe(true);
  await page.screenshot({ path: "../../.local/connected-editor-mobile.png" });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Aplicar", exact: true })
    .click();
  // The mentor's AI service is not part of this stack. Its two answers are stubbed, and the
  // test looks at what leaves the browser and at what the student has to accept by hand.
  let asked: Record<string, unknown> | undefined;
  await page.route("**/api/backend/portfolio/mentor", (route) =>
    route.fulfill({ json: { available: true } }),
  );
  await page.route("**/api/backend/portfolio/me/mentor", (route) => {
    asked = route.request().postDataJSON();
    return route.fulfill({
      json: {
        description: "Revisão da literatura sobre evasão no ensino superior.",
        caseStudy:
          "Problema: faltava um panorama da evasão.\nSolução: revisão de 30 artigos.",
        questions: ["Quantos artigos entraram na revisão?"],
      },
    });
  });
  await page.goto("/portfolio");
  await page.getByRole("button", { name: "Adicionar projeto", exact: true }).click();
  // A new project opens empty with its name field ready to type.
  await expect(
    page.getByLabel("Nome do projeto 1", { exact: true }),
  ).toBeFocused();
  await expect(
    page.getByLabel("Nome do projeto 1", { exact: true }),
  ).toHaveValue("");
  await page
    .getByLabel("Nome do projeto 1", { exact: true })
    .fill("Pesquisa acadêmica");
  await page.locator(".portfolio-upload input").setInputFiles({
    name: "pesquisa.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.7\nDocumento de teste\n%%EOF"),
  });
  await expect(page.getByRole("link", { name: /pesquisa.pdf/ })).toBeVisible();
  await page
    .getByRole("button", { name: "Salvar portfólio", exact: true })
    .click();
  await expect(
    page.getByText("Portfólio atualizado.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  // Back on the page, the project is a closed row; the student opens it to look inside.
  const saved = page
    .getByRole("article", { name: "Projeto 1", exact: true })
    .locator("button.portfolio-project-toggle");
  await expect(saved).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByLabel("Nome do projeto 1", { exact: true })).toHaveCount(0);
  await saved.click();
  await expect(page.getByRole("link", { name: /pesquisa.pdf/ })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);

  // The professional detail, the GitHub import and what visitors end up seeing.
  await page.route("https://api.github.com/**", (route) =>
    route.fulfill({
      headers: { "access-control-allow-origin": "*" },
      json: route.request().url().includes("/languages")
        ? { Java: 9000, TypeScript: 3000 }
        : [
            {
              full_name: "ana-dev/caronas",
              name: "caronas",
              description: "App de caronas entre colegas.",
              html_url: "https://github.com/ana-dev/caronas",
              homepage: "",
              language: "Java",
              topics: ["spring-boot"],
              stargazers_count: 12,
              fork: false,
              archived: false,
              pushed_at: "2026-10-02T12:00:00Z",
            },
            {
              full_name: "ana-dev/rascunho",
              name: "rascunho",
              description: "",
              html_url: "https://github.com/ana-dev/rascunho",
              homepage: "",
              language: "Python",
              topics: [],
              stargazers_count: 0,
              fork: false,
              archived: false,
              pushed_at: "2026-09-01T12:00:00Z",
            },
          ],
    }),
  );
  await page
    .getByLabel("Objetivo profissional", { exact: true })
    .fill("Estágio em back-end");
  // Competencies: one will be shown by a technology, one linked by hand, one only declared.
  await page
    .getByLabel("Competências", { exact: true })
    .fill("Java, Pesquisa, Inglês");
  await page
    .getByRole("button", { name: "Pesquisa no projeto 1", exact: true })
    .click();
  await page.getByLabel("Projeto 1 feito em equipe").check();
  await page
    .getByLabel("Minha participação no projeto 1", { exact: true })
    .fill("Escrevi a revisão bibliográfica.");
  // The mentor: asked with this project's words only, and nothing lands by itself.
  const first = page.getByRole("article", { name: "Projeto 1", exact: true });
  await expect(
    first.getByRole("button", { name: "Pedir sugestões ao mentor" }),
  ).toBeDisabled();
  await page
    .getByLabel("Descrição do projeto 1", { exact: true })
    .fill("Revisão sobre evasão no ensino superior.");
  await first.getByRole("button", { name: "Pedir sugestões ao mentor" }).click();
  const advice = page.getByRole("region", {
    name: "Sugestões do mentor para o projeto 1",
  });
  await expect(advice).toBeVisible();
  expect(asked).toEqual({
    name: "Pesquisa acadêmica",
    description: "Revisão sobre evasão no ensino superior.",
    technologies: [],
    team: true,
    role: "Escrevi a revisão bibliográfica.",
    goal: "Estágio em back-end",
  });
  await expect(
    advice.getByText("Quantos artigos entraram na revisão?"),
  ).toBeVisible();
  await expect(
    page.getByLabel("Descrição do projeto 1", { exact: true }),
  ).toHaveValue("Revisão sobre evasão no ensino superior.");
  await expect(
    page.getByLabel("Estudo de caso do projeto 1", { exact: true }),
  ).toHaveValue("");
  await advice
    .getByRole("button", {
      name: "Usar sugestão de estudo de caso no projeto 1",
      exact: true,
    })
    .click();
  await expect(
    page.getByLabel("Estudo de caso do projeto 1", { exact: true }),
  ).toHaveValue(/^Problema: faltava um panorama da evasão\./);
  expect(
    await advice.evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Importar do GitHub", exact: true })
    .click();
  const sheet = page.getByRole("dialog", { name: "Importar do GitHub" });
  await expect(sheet).toBeVisible();
  expect(
    await sheet.evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
  await sheet.getByLabel("Usuário do GitHub").fill("github.com/ana-dev");
  await sheet
    .getByRole("button", { name: "Buscar repositórios", exact: true })
    .click();
  // nothing comes ticked: the student chooses
  await expect(sheet.getByRole("checkbox", { name: /caronas/ })).not.toBeChecked();
  await sheet.getByRole("checkbox", { name: /caronas/ }).check();
  await sheet.getByRole("checkbox", { name: /rascunho/ }).check();
  await sheet
    .getByRole("button", { name: "Adicionar 2 projetos", exact: true })
    .click();
  await expect(sheet).toBeHidden();
  await expect(
    page.getByText(/2 projetos do GitHub entraram como rascunho/),
  ).toBeVisible();
  await expect(page.getByText("3 de 60 projetos")).toBeVisible();
  await page
    .getByRole("button", { name: "Destacar projeto 2", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Arquivar projeto 3", exact: true })
    .click();
  await expect(
    page.getByRole("tab", { name: "Arquivados (1)", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Portfólio público").check();
  await page
    .getByRole("button", { name: "Salvar portfólio", exact: true })
    .click();
  await expect(
    page.getByText("Portfólio atualizado.", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);

  await page.goto(`/p/${username}`);
  const open = page.locator("main.public-portfolio");
  await expect(open.getByText("Estágio em back-end")).toBeVisible();
  // the highlight comes first, the archived repository does not come at all
  await expect(open.getByRole("heading", { level: 3 })).toHaveText([
    "caronas",
    "Pesquisa acadêmica",
  ]);
  const imported = open.locator("article.public-project", {
    hasText: "caronas",
  });
  await expect(imported.getByText("Destaque")).toBeVisible();
  await expect(imported.getByRole("link", { name: /Repositório/ })).toHaveAttribute(
    "href",
    "https://github.com/ana-dev/caronas",
  );
  await expect(
    imported.getByRole("list", { name: "Tecnologias" }).getByRole("listitem"),
  ).toHaveText(["Java", "TypeScript", "spring-boot"]);
  await expect(
    open.getByText(/Minha participação: Escrevi a revisão bibliográfica\./),
  ).toBeVisible();
  // the case study the student accepted and saved is on the project's card
  await expect(
    open
      .locator("article.public-project", { hasText: "Pesquisa acadêmica" })
      .locator(".public-project-case"),
  ).toHaveText(/Estudo de caso\s*Problema: faltava um panorama da evasão\./);
  // each competency says what backs it; the archived repository backs nothing
  await expect(
    open.getByRole("list", { name: "Competências" }).getByRole("listitem"),
  ).toHaveText([
    /^Java\s*Demonstrada em\s*caronas$/,
    /^Pesquisa\s*Demonstrada em\s*Pesquisa acadêmica$/,
    /^Inglês\s*Declarada$/,
  ]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("jornada: sugestão revisada entra privada, o estudante mostra e o visitante vê", async ({
  page,
  request,
}) => {
  const tag = randomUUID().slice(0, 8),
    username = `jornada_${tag}`;
  const api = process.env.E2E_API_URL ?? "http://localhost:8080";
  const response = await request.post(`${api}/api/v1/auth/register`, {
    data: {
      name: "Estudante da jornada",
      username,
      email: `${username}@example.test`,
      password: "Connected-test-12345",
      device: "E2E",
    },
  });
  expect(response.ok()).toBe(true);
  const credentials = await response.json();
  await authenticate(page.context(), credentials);
  const headers = { authorization: `Bearer ${credentials.accessToken}` };
  // A calendar activity that already happened, and a portfolio visitors can open.
  const task = await request.post(`${api}/api/v1/planner/tasks`, {
    headers,
    data: {
      kind: "EXAM",
      title: "Prova de Banco de Dados",
      dueAt: "2026-05-21T15:00:00Z",
      minutes: 60,
    },
  });
  expect(task.ok()).toBe(true);
  const saved = await request.put(`${api}/api/v1/portfolio/me`, {
    headers,
    data: {
      publicProfile: true,
      headline: "Estudante",
      summary: "",
      goal: "",
      skills: [],
      projects: [],
    },
  });
  expect(saved.ok()).toBe(true);

  await page.goto("/portfolio");
  const journey = page.locator("section.portfolio-journey");
  await expect(
    journey.getByRole("heading", { name: "Minha jornada" }),
  ).toBeVisible();
  // the platform offers; nothing is in the timeline yet
  await expect(journey.getByRole("list", { name: "Registros da jornada" })).toHaveCount(0);
  await journey
    .getByRole("button", { name: "Revisar e adicionar Prova de Banco de Dados" })
    .click();
  const form = journey.getByRole("form", { name: "Novo registro da jornada" });
  await expect(form.getByLabel("Data")).toHaveValue("2026-05-21");
  await expect(form.getByLabel("Mostrar no portfólio público")).not.toBeChecked();
  await form.getByRole("button", { name: "Salvar registro" }).click();
  await expect(form).toBeHidden();
  const record = journey
    .getByRole("list", { name: "Registros da jornada" })
    .locator("li", { hasText: "Prova de Banco de Dados" })
    .last();
  await expect(record.getByText("Só você vê")).toBeVisible();
  await expect(
    journey.getByRole("button", {
      name: "Revisar e adicionar Prova de Banco de Dados",
    }),
  ).toHaveCount(0);

  // a record the student writes
  await journey.getByRole("button", { name: "Novo registro" }).click();
  await form.getByLabel("Título").fill("Entrei na faculdade");
  await form.getByLabel("Data").fill("2024-02-05");
  await form.getByRole("button", { name: "Salvar registro" }).click();
  await expect(form).toBeHidden();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);

  // visitors see only what is shown
  await page.goto(`/p/${username}`);
  const open = page.locator("section.public-journey");
  await expect(open.getByRole("heading", { level: 4 })).toHaveText([
    "Entrei na faculdade",
  ]);

  await page.goto("/portfolio");
  await journey
    .getByRole("button", {
      name: "Mostrar Prova de Banco de Dados no portfólio público",
    })
    .click();
  await expect(
    journey.getByRole("button", {
      name: "Ocultar Prova de Banco de Dados do portfólio público",
    }),
  ).toBeVisible();
  await page.goto(`/p/${username}`);
  await expect(open.getByRole("heading", { level: 4 })).toHaveText([
    "Prova de Banco de Dados",
    "Entrei na faculdade",
  ]);
  await open
    .getByRole("group", { name: "Filtrar jornada por semestre" })
    .getByRole("button", { name: "2024.1" })
    .click();
  await expect(open.getByRole("heading", { level: 4 })).toHaveText([
    "Entrei na faculdade",
  ]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("nível: o perfil mostra o nível, a barra de XP e o que falta para o próximo", async ({
  page,
  request,
}) => {
  const tag = randomUUID().slice(0, 8),
    username = `nivel_${tag}`;
  const response = await request.post(
    `${process.env.E2E_API_URL ?? "http://localhost:8080"}/api/v1/auth/register`,
    {
      data: {
        name: "Estudante de nível",
        username,
        email: `${username}@example.test`,
        password: "Connected-test-12345",
        device: "E2E",
      },
    },
  );
  expect(response.ok()).toBe(true);
  await authenticate(page.context(), await response.json());
  await page.goto("/profile");
  // A new account starts at level 1 with the whole level ahead of it.
  const bar = page.locator(".level-meter [role=progressbar]").first();
  await expect(bar).toHaveAttribute("aria-label", "Progresso do nível 1");
  await expect(bar).toHaveAttribute("aria-valuetext", "0 de 250 XP");
  await expect(
    page.locator(".level-meter .level-foot").first(),
  ).toContainText("Faltam 250 XP para o nível 2");
  await expect(
    page.locator(".profile-handle-row .level-badge").first(),
  ).toHaveAttribute("aria-label", "Nível 1, 0 de 250 XP");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
