const CACHE = "enturma-pwa-v7";
const STATIC_PREFIX = "/_next/static/";
const CORE = [
  "/offline",
  "/manifest.webmanifest",
  "/pwa/enturma-mobile-official-v6.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        Promise.allSettled(
          CORE.map((url) => cache.add(new Request(url, { cache: "reload" }))),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("enturma-pwa-") && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/rooms/")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match("/offline");
        return cached || Response.error();
      }),
    );
    return;
  }

  if (
    url.pathname.startsWith(STATIC_PREFIX) ||
    url.pathname === "/pwa/enturma-mobile-official-v6.png" ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (!response.ok) return response;
          const copy = response.clone();
          void caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        });
      }),
    );
  }
});

// Both realtime delivery and Web Push converge here; one receipt per event across tabs.
let deliveryQueue = Promise.resolve();
function safeNotificationTarget(href) {
  try {
    const url = new URL(href || "/notifications", self.location.origin);
    if (url.origin === self.location.origin && !url.username && !url.password)
      return url;
  } catch {}
  return new URL("/notifications", self.location.origin);
}
function deliverNotification(data) {
  deliveryQueue = deliveryQueue
    .catch(() => {})
    .then(async () => {
      const target = safeNotificationTarget(data.href);
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of windows)
        client.postMessage({ type: "ENTURMA_PUSH", data });
      if (
        Number.isFinite(data.unreadCount) &&
        typeof self.navigator?.setAppBadge === "function"
      ) {
        if (data.unreadCount > 0)
          await self.navigator.setAppBadge(data.unreadCount).catch(() => {});
        else if (typeof self.navigator.clearAppBadge === "function")
          await self.navigator.clearAppBadge().catch(() => {});
      }
      const receipts = await caches.open("enturma-notification-receipts-v1");
      const key = data.id
        ? new Request(
            self.location.origin +
              "/__notification-receipt/" +
              encodeURIComponent(data.id),
          )
        : null;
      if (key && (await receipts.match(key))) return;
      // Only the focused conversation suppresses its alert, not every visible page.
      const reading = windows.some(
        (client) =>
          client.focused &&
          client.visibilityState === "visible" &&
          new URL(client.url).pathname + new URL(client.url).search ===
            target.pathname + target.search,
      );
      if (!reading)
        await self.registration.showNotification(data.title || "Enturma", {
          body: data.body || "Você tem uma nova notificação.",
          icon: "/pwa/enturma-mobile-official-v6.png",
          badge: "/pwa/enturma-mobile-official-v6.png",
          tag: data.id
            ? "enturma-" + data.id
            : "enturma-" + (data.kind || "notification") + target.pathname,
          data: { href: target.pathname + target.search + target.hash },
        });
      if (key) {
        await receipts.put(key, new Response("1"));
        const keys = await receipts.keys();
        await Promise.all(
          keys
            .slice(0, Math.max(0, keys.length - 200))
            .map((old) => receipts.delete(old)),
        );
      }
    });
  return deliveryQueue;
}
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch {
    data = { body: event.data.text() };
  }
  event.waitUntil(deliverNotification(data));
});
self.addEventListener("message", (event) => {
  if (
    event.data?.type === "ENTURMA_SHOW_NOTIFICATION" &&
    event.source?.url &&
    new URL(event.source.url).origin === self.location.origin
  )
    event.waitUntil(deliverNotification(event.data.data));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = event.notification.data?.href || "/notifications";
  event.waitUntil(
    (async () => {
      const target = safeNotificationTarget(href).href;
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of windows) {
        if ("navigate" in client) await client.navigate(target);
        if ("focus" in client) await client.focus();
        return;
      }
      if (self.clients.openWindow) await self.clients.openWindow(target);
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "ENTURMA_BADGE") return;
  const count = Number(event.data.count || 0);
  if (typeof self.navigator?.setAppBadge === "function") {
    if (count > 0) event.waitUntil(self.navigator.setAppBadge(count));
    else if (typeof self.navigator.clearAppBadge === "function")
      event.waitUntil(self.navigator.clearAppBadge());
  }
});
