"use client";
import { MonitorCog, Moon, Sun } from "lucide-react";
import { useExperience, saveExperience } from "@/lib/experience-preferences";
import { ThemePicker } from "./theme-picker";
import { EnturmaAppIcon } from "./enturma-app-icon";
import type { ExperiencePreference } from "@enturma/contracts";
type AuthTheme = ExperiencePreference["theme"];

export function PublicThemeControl({ compact = false }: { compact?: boolean }) {
  const preference = useExperience();
  const theme = preference.theme;
  function choose(theme: AuthTheme) {
    void saveExperience({ ...preference, theme }, true);
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
        aria-pressed={theme === "ENTURMA"}
        onClick={() => choose("ENTURMA")}
        title="Usar as cores do Enturma"
      >
        <EnturmaAppIcon size={16} />
        <span>Enturma</span>
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
