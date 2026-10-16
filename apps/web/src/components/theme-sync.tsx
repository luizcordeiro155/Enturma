"use client";
import { useEffect } from "react";
import { applyEnturmaTheme, setThemeOrigin } from "@/lib/theme-motion";

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
      const nextTheme =
        preference.theme === "DARK"
          ? "dark"
          : preference.theme === "LIGHT"
            ? "light"
            : system.matches
              ? "dark"
              : "light";
      root.dataset.highContrast = String(preference.highContrast === true);
      root.dataset.reducedMotion = String(preference.reducedMotion === true);
      applyEnturmaTheme(nextTheme);
    };
    system.addEventListener("change", update);
    const storage = (event: StorageEvent) => {
      if (event.key === "enturma-experience") update();
    };
    window.addEventListener("storage", storage);
    const pointer = (event: PointerEvent) =>
      setThemeOrigin(event.clientX, event.clientY);
    document.addEventListener("pointerdown", pointer, { passive: true });
    return () => {
      system.removeEventListener("change", update);
      window.removeEventListener("storage", storage);
      document.removeEventListener("pointerdown", pointer);
    };
  }, []);
  return null;
}
