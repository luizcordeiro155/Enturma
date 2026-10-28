"use client";
import { useEffect, useState } from "react";
import { MonitorCog, Moon, Sun } from "lucide-react";
import { applyEnturmaTheme } from "@/lib/theme-motion";
import { ThemePicker } from "./theme-picker";
type AuthTheme = "LIGHT" | "DARK" | "SYSTEM";

export function PublicThemeControl({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<AuthTheme>("SYSTEM");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      let cachedTheme: AuthTheme = "SYSTEM";
      try {
        const cached = JSON.parse(
          localStorage.getItem("enturma-experience") || "{}",
        ) as { theme?: string };
        if (cached.theme === "LIGHT" || cached.theme === "DARK") {
          cachedTheme = cached.theme;
        }
      } catch {}
      queueMicrotask(() => {
        setTheme(cachedTheme);
        setReady(true);
      });
    };
    sync();
    const changed = (event: StorageEvent) => {
      if (event.key === "enturma-experience") sync();
    };
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const nextTheme =
        theme === "SYSTEM"
          ? system.matches
            ? "dark"
            : "light"
          : theme.toLowerCase();
      applyEnturmaTheme(nextTheme);
    };
    apply();
    if (theme !== "SYSTEM") return;
    system.addEventListener("change", apply);
    return () => system.removeEventListener("change", apply);
  }, [ready, theme]);

  function choose(nextTheme: AuthTheme) {
    setTheme(nextTheme);
    try {
      const cached = JSON.parse(
        localStorage.getItem("enturma-experience") || "{}",
      ) as Record<string, unknown>;
      const next = { ...cached, theme: nextTheme };
      const serialized = JSON.stringify(next);
      localStorage.setItem("enturma-experience", serialized);
      localStorage.setItem("enturma-experience-pending", serialized);
    } catch {}
  }

  if (compact) return <ThemePicker value={theme} onChange={choose} />;
  return (
    <div
      className="auth-theme-control"
      role="group"
      aria-label="Tema da interface"
    >
      <button
        type="button"
        className="auth-theme-option"
        aria-pressed={theme === "LIGHT"}
        onClick={() => choose("LIGHT")}
        title="Usar tema claro"
      >
        <Sun size={16} />
        <span>Claro</span>
      </button>
      <button
        type="button"
        className="auth-theme-option"
        aria-pressed={theme === "DARK"}
        onClick={() => choose("DARK")}
        title="Usar tema escuro"
      >
        <Moon size={16} />
        <span>Escuro</span>
      </button>
      <button
        type="button"
        className="auth-theme-option"
        aria-pressed={theme === "SYSTEM"}
        onClick={() => choose("SYSTEM")}
        title="Seguir o tema do sistema"
      >
        <MonitorCog size={16} />
        <span>Sistema</span>
      </button>
    </div>
  );
}
