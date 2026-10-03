const CACHE = "enturma-pwa-v5";
const STATIC_PREFIX = "/_next/static/";
const CORE = ["/offline", "/manifest.webmanifest", "/pwa/enturma-192-v5.png", "/pwa/enturma-v5.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        Promise.allSettled(
          CORE.map((url) =>
            cache.add(new Request(url, { cache: "reload" })),
          ),
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
    url.pathname === "/pwa/enturma-192-v5.png" ||
    url.pathname === "/pwa/enturma-v5.svg" ||
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


self.addEventListener("push", (event) => {
  if (!event.data) return;
  event.waitUntil((async () => {
    let data = {};
    try {
      data = event.data.json();
    } catch {
      data = { body: event.data.text() };
    }

    if (typeof self.navigator?.setAppBadge === "function") {
      try {
        const count = Number(data.unreadCount || 0);
        if (count > 0) await self.navigator.setAppBadge(count);
        else if (typeof self.navigator.clearAppBadge === "function")
          await self.navigator.clearAppBadge();
      } catch {}
    }

    const windows = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });
    const visible = windows.some(
      (client) => client.visibilityState === "visible",
    );
    if (visible) {
      for (const client of windows)
        client.postMessage({ type: "ENTURMA_PUSH", data });
      return;
    }

    await self.registration.showNotification(data.title || "Enturma", {
      body: data.body || "Você tem uma nova notificação.",
      icon: data.icon || "/pwa/enturma-192-v5.png",
      badge: data.badge || "/pwa/enturma-192-v5.png",
      tag: `enturma-${data.kind || "notification"}-${data.href || ""}`,
      renotify: true,
      data: { href: data.href || "/notifications" },
    });
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = event.notification.data?.href || "/notifications";
  event.waitUntil((async () => {
    const target = new URL(href, self.location.origin).href;
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
  })());
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
