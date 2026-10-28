import { expect, it } from "vitest";
import { watchNotificationBadge } from "./notification-presentation";

it("uses the full authoritative count in the title, caps the icon and restores metadata", async () => {
  document.title = "Salas — Enturma";
  document.head.insertAdjacentHTML(
    "beforeend",
    '<link rel="icon" type="image/png" href="/logo.png">',
  );
  const restore = watchNotificationBadge(140);
  expect(document.title).toBe("(140) Enturma");
  expect(
    decodeURIComponent(
      document.querySelector<HTMLLinkElement>('link[rel="icon"]')!.href,
    ),
  ).toContain("99+");
  document.title = "Cadernos — Enturma";
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(document.title).toBe("(140) Enturma");
  restore();
  expect(document.title).toBe("Salas — Enturma");
  expect(document.querySelector('link[rel="icon"]')?.getAttribute("href")).toBe(
    "/logo.png",
  );
});
it("does not invent unread notifications for an invalid or empty count", () => {
  for (const count of [0, -1, NaN]) {
    const restore = watchNotificationBadge(count);
    expect(document.title).toBe("Enturma");
    restore();
  }
});
