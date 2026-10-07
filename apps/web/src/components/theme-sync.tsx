"use client";
import { useEffect } from "react";

/** Keep SYSTEM live on full-screen routes that do not mount the theme controls. */
export function ThemeSync() {
  useEffect(() => {
    const system = matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      let preference: {
        theme?: string;
        highContrast?: boolean;
        reducedMotion?: boolean;
      } = {};
      try {
        preference = JSON.parse(
          localStorage.getItem("enturma-experience") || "{}",
        );
      } catch {}
      const root = document.documentElement;
      root.dataset.theme =
        preference.theme === "DARK"
          ? "dark"
          : preference.theme === "LIGHT"
            ? "light"
            : system.matches
              ? "dark"
              : "light";
      root.dataset.highContrast = String(preference.highContrast === true);
      root.dataset.reducedMotion = String(preference.reducedMotion === true);
    };
    system.addEventListener("change", update);
    const storage = (event: StorageEvent) => {
      if (event.key === "enturma-experience") update();
    };
    window.addEventListener("storage", storage);
    return () => {
      system.removeEventListener("change", update);
      window.removeEventListener("storage", storage);
    };
  }, []);
  return null;
}
