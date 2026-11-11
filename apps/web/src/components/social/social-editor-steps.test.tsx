import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { SocialEditor } from "./social-editor";
import { PAGER_IGNORE } from "./social-pager";

const api = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api, post: vi.fn() }));
vi.mock("@/lib/social-draft", async (original) => ({
  ...(await original<typeof import("@/lib/social-draft")>()),
  localSocialDraft: vi.fn().mockResolvedValue(null),
}));
vi.mock("../navigation-link", () => ({
  NavigationLink: (props: ComponentProps<"a">) => <a {...props} />,
}));

function renderEditor(props: Partial<ComponentProps<typeof SocialEditor>> = {}) {
  return render(
    <SocialEditor
      user="me"
      mediaEnabled
      initialKind="POST"
      published={() => {}}
      {...props}
    />,
  );
}
beforeEach(() => {
  api.mockReset().mockImplementation((path: string) =>
    Promise.resolve(
      path === "/portfolio/me"
        ? { username: "eu", publicProfile: false, projects: [] }
        : [],
    ),
  );
});
afterEach(cleanup);

it("a página Criar não bloqueia o arrasto de volta ao Feed", async () => {
  renderEditor();
  const editor = await screen.findByRole("region", {
    name: "Central de criação",
  });
  // Only regions with their own horizontal meaning may opt out of the page gesture.
  expect(editor.closest(PAGER_IGNORE)).toBeNull();
  expect(screen.getByRole("textbox", { name: /compartilhar/i }).closest(PAGER_IGNORE))
    .not.toBeNull(); // campos de texto continuam fora do gesto
});
