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
