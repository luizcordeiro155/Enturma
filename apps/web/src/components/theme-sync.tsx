"use client";
import { useEffect } from "react";
import { applyEnturmaTheme, setThemeOrigin } from "@/lib/theme-motion";
import { getExperience, useExperience } from "@/lib/experience-preferences";
/** The root owns the DOM theme. Route controls only update shared preferences. */
export function ThemeSync() {
  const preference = useExperience();
  useEffect(() => {
    const system = matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      const value = getExperience();
      const root = document.documentElement;
      root.dataset.highContrast = String(value.highContrast);
      root.dataset.reducedMotion = String(value.reducedMotion);
      root.dataset.enhancedFocus = String(value.enhancedFocus);
      root.style.setProperty("--font-scale", String(value.fontScale));
      applyEnturmaTheme(
        value.theme === "SYSTEM"
          ? system.matches
            ? "dark"
            : "light"
          : value.theme.toLowerCase(),
      );
      window.dispatchEvent(new Event("enturma-motion"));
    };
    update();
    system.addEventListener("change", update);
    return () => system.removeEventListener("change", update);
  }, [preference]);
  useEffect(() => {
    const pointer = (event: PointerEvent) =>
      setThemeOrigin(event.clientX, event.clientY);
    document.addEventListener("pointerdown", pointer, { passive: true });
    return () => document.removeEventListener("pointerdown", pointer);
  }, []);
  return null;
}
