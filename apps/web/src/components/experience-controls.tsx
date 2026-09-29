"use client";

import { useEffect, useState } from "react";
import { Accessibility, Moon, Sun, MonitorCog, X } from "lucide-react";
import type { ExperiencePreference } from "@enturma/contracts";
import { api } from "@/lib/api";

const defaults: ExperiencePreference = {
  theme: "SYSTEM",
  fontScale: 1,
  highContrast: false,
  reducedMotion: false,
  enhancedFocus: true,
};

function applyPreference(p: ExperiencePreference) {
  const root = document.documentElement;
  root.dataset.theme = p.theme.toLowerCase();
  root.dataset.highContrast = String(p.highContrast);
  root.dataset.reducedMotion = String(p.reducedMotion);
  root.dataset.enhancedFocus = String(p.enhancedFocus);
  root.style.setProperty("--font-scale", String(p.fontScale));
}

export function ExperienceControls() {
  const [preference, setPreference] = useState<ExperiencePreference>(defaults);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem("enturma-experience");
    if (cached) {
      try {
        const parsed = { ...defaults, ...JSON.parse(cached) } as ExperiencePreference;
        applyPreference(parsed);
        queueMicrotask(() => setPreference(parsed));
      } catch {}
    }
    api<ExperiencePreference>("/users/me/experience")
      .then((remote) => {
        const next = { ...defaults, ...remote };
        setPreference(next);
        applyPreference(next);
        localStorage.setItem("enturma-experience", JSON.stringify(next));
      })
      .catch(() => {});
  }, []);

  async function save(next: ExperiencePreference) {
    setPreference(next);
    applyPreference(next);
    localStorage.setItem("enturma-experience", JSON.stringify(next));
    try {
      await api("/users/me/experience", {
        method: "PUT",
        body: JSON.stringify(next),
      });
    } catch {}
  }

  function cycleTheme() {
    const next =
      preference.theme === "SYSTEM"
        ? "DARK"
        : preference.theme === "DARK"
          ? "LIGHT"
          : "SYSTEM";
    void save({ ...preference, theme: next });
  }

  const ThemeIcon =
    preference.theme === "DARK"
      ? Moon
      : preference.theme === "LIGHT"
        ? Sun
        : MonitorCog;

  return (
    <div className="experience-controls">
      <button
        className="icon-control"
        type="button"
        onClick={cycleTheme}
        aria-label={`Tema atual: ${preference.theme}. Alternar tema`}
        title="Alternar tema"
      >
        <ThemeIcon size={20} />
      </button>
      <button
        className="accessibility-trigger"
        type="button"
        onClick={() => setOpen(true)}
      >
        <Accessibility size={19} />
        <span>Acessibilidade</span>
      </button>

      {open ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section
            className="accessibility-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="accessibility-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <header>
              <div>
                <p className="eyebrow">Preferências pessoais</p>
                <h2 id="accessibility-title">Acessibilidade e aparência</h2>
              </div>
              <button
                className="icon-control"
                type="button"
                aria-label="Fechar configurações"
                onClick={() => setOpen(false)}
              >
                <X size={20} />
              </button>
            </header>

            <label>
              Tema
              <select
                value={preference.theme}
                onChange={(e) =>
                  void save({
                    ...preference,
                    theme: e.target.value as ExperiencePreference["theme"],
                  })
                }
              >
                <option value="SYSTEM">Seguir sistema</option>
                <option value="LIGHT">Claro</option>
                <option value="DARK">Escuro</option>
              </select>
            </label>

            <label>
              Tamanho do texto · {Math.round(preference.fontScale * 100)}%
              <input
                type="range"
                min="0.85"
                max="1.35"
                step="0.05"
                value={preference.fontScale}
                onChange={(e) =>
                  void save({ ...preference, fontScale: Number(e.target.value) })
                }
              />
            </label>

            <label className="toggle-row">
              <input
                type="checkbox"
                checked={preference.highContrast}
                onChange={(e) =>
                  void save({ ...preference, highContrast: e.target.checked })
                }
              />
              <span>
                <strong>Alto contraste</strong>
                <small>Reforça bordas, textos e estados interativos.</small>
              </span>
            </label>

            <label className="toggle-row">
              <input
                type="checkbox"
                checked={preference.reducedMotion}
                onChange={(e) =>
                  void save({ ...preference, reducedMotion: e.target.checked })
                }
              />
              <span>
                <strong>Reduzir animações</strong>
                <small>Também respeita a preferência do sistema operacional.</small>
              </span>
            </label>

            <label className="toggle-row">
              <input
                type="checkbox"
                checked={preference.enhancedFocus}
                onChange={(e) =>
                  void save({ ...preference, enhancedFocus: e.target.checked })
                }
              />
              <span>
                <strong>Foco visual reforçado</strong>
                <small>Deixa a navegação por teclado mais evidente.</small>
              </span>
            </label>
          </section>
        </div>
      ) : null}
    </div>
  );
}
