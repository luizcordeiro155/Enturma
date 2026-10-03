"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { isInstalledApp } from "./desktop-updates";

type ProfileShortcut = {
  id: string;
  hasAvatar: boolean;
  version: number;
};

type AppShellState = {
  installedApp: boolean;
  learning: boolean;
  profileShortcut: ProfileShortcut | null;
  refreshProfileShortcut: (bumpAvatar?: boolean) => Promise<void>;
};

const Context = createContext<AppShellState | null>(null);

const PREFETCH_ROUTES = [
  "/home",
  "/forum",
  "/notebooks",
  "/friends",
  "/explore",
  "/challenges",
  "/subjects",
  "/caronas",
  "/settings",
  "/profile",
  "/learn",
] as const;

export function AppShellStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const [installedApp, setInstalledApp] = useState(false);
  const [learning, setLearning] = useState(false);
  const [profileShortcut, setProfileShortcut] =
    useState<ProfileShortcut | null>(null);

  const refreshProfileShortcut = useCallback(async (bumpAvatar = false) => {
    try {
      const profile = await api<{ id: string; hasAvatar?: boolean }>(
        "/users/me",
        bumpAvatar ? { cache: "no-store" } : undefined,
      );
      setProfileShortcut((current) => ({
        id: profile.id,
        hasAvatar: Boolean(profile.hasAvatar),
        version:
          bumpAvatar ||
          current?.id !== profile.id ||
          current?.hasAvatar !== Boolean(profile.hasAvatar)
            ? Date.now()
            : current.version,
      }));
    } catch {
      // As próprias páginas tratam sessão expirada e indisponibilidade.
    }
  }, []);

  useEffect(() => {
    const installedTimer = window.setTimeout(
      () => setInstalledApp(isInstalledApp()),
      0,
    );
    void refreshProfileShortcut();

    const refreshAvatar = () => void refreshProfileShortcut(true);
    const refreshOnFocus = () => {
      if (document.visibilityState === "visible")
        void refreshProfileShortcut(false);
    };

    const markInstalled = () => setInstalledApp(true);
    window.addEventListener("enturma-profile-updated", refreshAvatar);
    window.addEventListener("enturma-pwa-installed", markInstalled);
    window.addEventListener("appinstalled", markInstalled);
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnFocus);
    return () => {
      window.clearTimeout(installedTimer);
      window.removeEventListener("enturma-profile-updated", refreshAvatar);
      window.removeEventListener("enturma-pwa-installed", markInstalled);
      window.removeEventListener("appinstalled", markInstalled);
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  }, [refreshProfileShortcut]);

  useEffect(() => {
    let active = true;
    api<{ eligible: boolean }>("/learning/access")
      .then((value) => {
        if (active) setLearning(value.eligible);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [path]);

  useEffect(() => {
    const prefetch = () => {
      for (const route of PREFETCH_ROUTES) router.prefetch(route);
    };
    const idleWindow = window as typeof window & {
      requestIdleCallback?: (callback: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (idleWindow.requestIdleCallback) {
      const id = idleWindow.requestIdleCallback(prefetch);
      return () => idleWindow.cancelIdleCallback?.(id);
    }
    const timer = window.setTimeout(prefetch, 400);
    return () => window.clearTimeout(timer);
  }, [router]);

  const value = useMemo(
    () => ({
      installedApp,
      learning,
      profileShortcut,
      refreshProfileShortcut,
    }),
    [installedApp, learning, profileShortcut, refreshProfileShortcut],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAppShellState() {
  const value = useContext(Context);
  if (!value)
    throw new Error(
      "useAppShellState precisa estar dentro de AppShellStateProvider.",
    );
  return value;
}
