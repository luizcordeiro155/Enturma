"use client";
import { useEffect, useState } from "react";
import { api } from "./api";

export type Providers = { google: boolean; github: boolean };
type Answer = Record<"google" | "github", { enabled?: boolean } | undefined>;

/** The Android and Windows apps show the site inside their own window. */
export function insideNativeShell() {
  return (
    typeof navigator !== "undefined" &&
    /Enturma(?:Mobile|Desktop)\//.test(navigator.userAgent)
  );
}

function embedded() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/**
 * Which outside accounts can be used right here. A framed page cannot leave for a provider, so
 * the buttons stay out of it; inside the apps they work through the device browser.
 */
export function useProviders(): Providers {
  const [providers, setProviders] = useState<Providers>({
    google: false,
    github: false,
  });
  useEffect(() => {
    let active = true;
    api<Answer>("/public/auth/providers")
      .then((answer) => {
        if (!active) return;
        setProviders({
          google: answer?.google?.enabled === true && !embedded(),
          github: answer?.github?.enabled === true && !embedded(),
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return providers;
}
