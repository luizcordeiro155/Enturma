import { expect, it } from "vitest";
import { watchNotificationBadge } from "./notification-presentation";

it("preserves the current route title, caps the count and restores the icon", async () => {
  document.title = "Salas — Enturma";
  document.head.insertAdjacentHTML("beforeend", '<link rel="icon" type="image/png" href="/logo.png">');
  const restore = watchNotificationBadge(140);
  expect(document.title).toBe("(99+) Salas — Enturma");
  expect(decodeURIComponent(document.querySelector<HTMLLinkElement>('link[rel="icon"]')!.href)).toContain("99+");
  document.title = "Cadernos — Enturma";
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(document.title).toBe("(99+) Cadernos — Enturma");
  restore();
  expect(document.title).toBe("Cadernos — Enturma");
  expect(document.querySelector('link[rel="icon"]')?.getAttribute("href")).toBe("/logo.png");
});
it("replaces the prior badge rather than stacking prefixes as counts change", () => {
  document.title = "Caronas | Enturma";
  const old = watchNotificationBadge(3);
  expect(document.title).toBe("(3) Caronas | Enturma");
  old();
  const next = watchNotificationBadge(4);
  expect(document.title).toBe("(4) Caronas | Enturma");
  next();
  expect(document.title).toBe("Caronas | Enturma");
});
it("leaves the route title untouched if unread count is empty or invalid", () => {
  for (const count of [0, -1, NaN]) {
    document.title = "Perfil | Enturma";
    const restore = watchNotificationBadge(count);
    expect(document.title).toBe("Perfil | Enturma");
    restore();
  }
});
