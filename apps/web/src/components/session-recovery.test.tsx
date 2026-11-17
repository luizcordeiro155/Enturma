import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/components/app-launch", () => ({ LaunchSplash: ({ children }: { children: unknown }) => children }));
vi.mock("@/lib/launch-performance", () => ({ APP_LAUNCH_MIN_MS: 0 }));
import { SessionRecovery } from "./session-recovery";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  replace.mockReset();
  delete document.documentElement.dataset.embedded;
});

test("inside Mostra+ a valid session continues with a client navigation", async () => {
  document.documentElement.dataset.embedded = "true";
  window.history.replaceState(null, "", "/session/restore?next=%2Fsettings");
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
  render(<SessionRecovery />);
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/settings"));
});
