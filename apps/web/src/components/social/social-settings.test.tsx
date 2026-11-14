import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { SocialSettings } from "./social-settings";
import type { SocialPreferences } from "@/lib/social";

const experience = vi.hoisted(() => ({
  saveExperience: vi.fn(() => Promise.resolve()),
  value: {
    theme: "DARK",
    fontScale: 1,
    highContrast: false,
    reducedMotion: false,
    enhancedFocus: true,
  },
}));
vi.mock("@/lib/experience-preferences", () => ({
  experienceDefaults: {
    theme: "SYSTEM",
    fontScale: 1,
    highContrast: false,
    reducedMotion: false,
    enhancedFocus: true,
  },
  useExperience: () => experience.value,
  saveExperience: experience.saveExperience,
  syncExperience: () => Promise.resolve(),
}));
vi.mock("@/lib/api", () => ({
  api: vi.fn(() => Promise.resolve({ eligibleForReview: false, items: [] })),
}));
vi.mock("./social-dialog", () => ({
  SocialDialog: ({ title, children }: { title: string; children: ReactNode }) => (
    <div role="dialog" aria-label={title}>
      {children}
    </div>
  ),
}));

afterEach(cleanup);

const prefs = {
  privateAccount: false,
  recommendations: true,
  autoplay: true,
  interests: [],
  navigation: { automatic: false, order: ["feed", "clips", "create"] },
} as unknown as SocialPreferences;

it("keeps theme and accessibility inside the Social preferences", () => {
  render(<SocialSettings value={prefs} save={() => {}} close={() => {}} admin={false} />);
  const dialog = screen.getByRole("dialog", { name: "Seu Social, do seu jeito" });
  const appearance = within(dialog).getByRole("region", {
    name: "Aparência e acessibilidade",
  });
  fireEvent.change(within(appearance).getByRole("combobox", { name: "Tema" }), {
    target: { value: "LIGHT" },
  });
  expect(experience.saveExperience).toHaveBeenCalledWith(
    expect.objectContaining({ theme: "LIGHT" }),
    false,
  );
  fireEvent.click(within(appearance).getByRole("checkbox", { name: /Alto contraste/ }));
  expect(experience.saveExperience).toHaveBeenLastCalledWith(
    expect.objectContaining({ highContrast: true }),
    false,
  );
  expect(within(appearance).getByRole("slider", { name: /Tamanho do texto/ })).toBeInTheDocument();
});
