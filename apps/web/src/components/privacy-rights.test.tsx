import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PrivacyRights } from "./privacy-rights";
import { LEGAL_VERSION, PRIVACY_EMAIL } from "@/lib/legal";

const api = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api }));
afterEach(() => {
  cleanup();
  api.mockReset();
});

it("asks to accept the current version and records it", async () => {
  api
    .mockResolvedValueOnce({ current: LEGAL_VERSION, accepted: false, history: [] })
    .mockResolvedValueOnce({
      current: LEGAL_VERSION,
      accepted: true,
      history: [
        { document: "PRIVACY", version: LEGAL_VERSION, source: "IN_APP", acceptedAt: "2026-11-16T14:00:00Z" },
        { document: "TERMS", version: LEGAL_VERSION, source: "IN_APP", acceptedAt: "2026-11-16T14:00:00Z" },
      ],
    });
  render(<PrivacyRights />);
  const accept = await screen.findByRole("button", { name: "Li e aceito" });
  await act(async () => fireEvent.click(accept));
  expect(api).toHaveBeenLastCalledWith(
    "/account/privacy/consents",
    expect.objectContaining({ method: "POST", body: JSON.stringify({ version: LEGAL_VERSION }) }),
  );
  expect(screen.queryByRole("button", { name: "Li e aceito" })).not.toBeInTheDocument();
  expect(screen.getByText(/Você aceitou em/)).toBeInTheDocument();
});

it("shows how to reach the data protection officer", async () => {
  api.mockResolvedValueOnce({ current: LEGAL_VERSION, accepted: true, history: [] });
  render(<PrivacyRights />);
  expect(await screen.findByRole("link", { name: PRIVACY_EMAIL })).toHaveAttribute("href", `mailto:${PRIVACY_EMAIL}`);
});
