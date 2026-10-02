"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { isMobileApp } from "./desktop-updates";

type PushRegistration = {
  installationId: string;
  token: string;
  platform: "ANDROID";
};

type PushBridge = {
  getPushRegistration?: () => string;
  refreshPushToken?: () => void;
};

const REGISTRATION_CACHE = "enturma-push-registration-v1";
const REFRESH_AFTER_MS = 6 * 60 * 60 * 1000;

export function MobilePushRegistration() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isMobileApp()) return;

    let live = true;
    const bridge = window.EnturmaNative as
      | (typeof window.EnturmaNative & PushBridge)
      | undefined;

    async function register(registration: PushRegistration) {
      if (
        !registration?.installationId ||
        !registration?.token ||
        registration.platform !== "ANDROID"
      )
        return;

      const key = `${registration.installationId}:${registration.token}`;
      try {
        const cached = JSON.parse(
          localStorage.getItem(REGISTRATION_CACHE) || "{}",
        ) as { key?: string; at?: number };
        if (
          cached.key === key &&
          Date.now() - Number(cached.at || 0) < REFRESH_AFTER_MS
        )
          return;
      } catch {}

      try {
        await api("/notifications/push-device", {
          method: "POST",
          body: JSON.stringify(registration),
        });
        if (!live) return;
        localStorage.setItem(
          REGISTRATION_CACHE,
          JSON.stringify({ key, at: Date.now() }),
        );
      } catch {
        // Login pode ainda estar sendo restaurado; a troca de rota tenta novamente.
      }
    }

    function readBridge() {
      try {
        const raw = bridge?.getPushRegistration?.();
        if (!raw) return;
        void register(JSON.parse(raw) as PushRegistration);
      } catch {}
    }

    const onToken = (event: Event) => {
      const detail = (event as CustomEvent<PushRegistration>).detail;
      void register(detail);
    };

    window.addEventListener("enturma-native-push-token", onToken);
    readBridge();
    bridge?.refreshPushToken?.();

    return () => {
      live = false;
      window.removeEventListener("enturma-native-push-token", onToken);
    };
  }, [pathname]);

  return null;
}
