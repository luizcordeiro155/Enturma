"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";
import { isMobileApp } from "./desktop-updates";

const INSTALLATION_KEY = "enturma-web-push-installation-v1";

function installationId() {
  let value = localStorage.getItem(INSTALLATION_KEY);
  if (!value) {
    value = crypto.randomUUID();
    localStorage.setItem(INSTALLATION_KEY, value);
  }
  return value;
}

function decodeKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

async function subscribe() {
  if (
    isMobileApp() ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  )
    return false;

  if (Notification.permission === "denied") return false;
  if (Notification.permission !== "granted") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;
  }

  const registration = await navigator.serviceWorker.ready;
  const { publicKey } = await api<{ publicKey: string }>(
    "/notifications/web-push/public-key",
    { cache: "no-store" },
  );

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeKey(publicKey),
    });
  }

  const payload = subscription.toJSON();
  const keys = payload.keys;
  if (!payload.endpoint || !keys?.p256dh || !keys?.auth) return false;

  await api("/notifications/web-push/subscribe", {
    method: "POST",
    body: JSON.stringify({
      installationId: installationId(),
      endpoint: payload.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    }),
  });
  return true;
}

export async function enableDesktopNotifications() {
  try {
    return await subscribe();
  } catch {
    return false;
  }
}

export function WebPushRegistration() {
  useEffect(() => {
    if (isMobileApp() || !("Notification" in window)) return;

    const registerIfAllowed = () => {
      if (Notification.permission === "granted") void subscribe();
    };
    const onEnable = () => void subscribe();

    registerIfAllowed();
    window.addEventListener("enturma-enable-web-push", onEnable);
    window.addEventListener("focus", registerIfAllowed);
    return () => {
      window.removeEventListener("enturma-enable-web-push", onEnable);
      window.removeEventListener("focus", registerIfAllowed);
    };
  }, []);

  return null;
}
