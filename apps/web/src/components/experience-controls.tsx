"use client";
import { useEffect, useRef, useState } from "react";
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
function normalize(p: Partial<ExperiencePreference>): ExperiencePreference {
  return {
    ...defaults,
    ...p,
    theme: ["LIGHT", "DARK", "SYSTEM"].includes(p.theme ?? "")
      ? p.theme!
      : "SYSTEM",
    fontScale: Math.max(0.85, Math.min(1.35, Number(p.fontScale) || 1)),
  };
}
export function ExperienceControls() {
  const [preference, setPreference] = useState(defaults);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const changed = useRef(false);
  useEffect(() => {
    let active = true;
    try {
      const raw = localStorage.getItem("enturma-experience");
      if (raw) {
        const cached = normalize(JSON.parse(raw));
        queueMicrotask(() => {
          if (active && !changed.current) setPreference(cached);
        });
      }
    } catch {}
    let pending: ExperiencePreference | null = null;
    try {
      const raw = localStorage.getItem("enturma-experience-pending");
      if (raw) pending = normalize(JSON.parse(raw));
    } catch {}
    const synchronization = pending
      ? api<ExperiencePreference>("/users/me/experience", {
          method: "PUT",
          body: JSON.stringify(pending),
          keepalive: true,
        }).then(() => {
          try {
            if (
              localStorage.getItem("enturma-experience-pending") ===
              JSON.stringify(pending)
            )
              localStorage.removeItem("enturma-experience-pending");
          } catch {}
          return pending!;
        })
      : api<ExperiencePreference>("/users/me/experience");
    synchronization
      .then((p) => {
        if (active && !changed.current) setPreference(normalize(p));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const system = matchMedia("(prefers-color-scheme: dark)");
    function apply() {
      const root = document.documentElement;
      root.dataset.theme =
        preference.theme === "SYSTEM"
          ? system.matches
            ? "dark"
            : "light"
          : preference.theme.toLowerCase();
      root.dataset.highContrast = String(preference.highContrast);
      root.dataset.reducedMotion = String(preference.reducedMotion);
      root.dataset.enhancedFocus = String(preference.enhancedFocus);
      root.style.setProperty("--font-scale", String(preference.fontScale));
      window.dispatchEvent(new Event("enturma-motion"));
    }
    apply();
    system.addEventListener("change", apply);
    return () => system.removeEventListener("change", apply);
  }, [preference]);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  function save(p: ExperiencePreference) {
    const next = normalize(p);
    changed.current = true;
    setPreference(next);
    try {
      localStorage.setItem("enturma-experience", JSON.stringify(next));
      localStorage.setItem("enturma-experience-pending", JSON.stringify(next));
    } catch {}
    setStatus("Salvando…");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void api("/users/me/experience", {
        method: "PUT",
        body: JSON.stringify(next),
        keepalive: true,
      })
        .then(() => {
          try {
            if (
              localStorage.getItem("enturma-experience-pending") ===
              JSON.stringify(next)
            )
              localStorage.removeItem("enturma-experience-pending");
          } catch {}
          setStatus("Preferências salvas no seu perfil.");
        })
        .catch(() =>
          setStatus(
            "Preferências aplicadas neste navegador. Não foi possível sincronizar com seu perfil.",
          ),
        );
    }, 400);
  }
  const Icon =
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
        onClick={() =>
          save({
            ...preference,
            theme:
              preference.theme === "SYSTEM"
                ? "DARK"
                : preference.theme === "DARK"
                  ? "LIGHT"
                  : "SYSTEM",
          })
        }
        aria-label={`Tema ${preference.theme === "SYSTEM" ? "do sistema" : preference.theme === "DARK" ? "escuro" : "claro"}. Alternar tema`}
      >
        <Icon size={20} />
      </button>
      <button
        className="accessibility-trigger"
        type="button"
        onClick={() => setOpen(true)}
      >
        <Accessibility size={19} />
        <span>Acessibilidade</span>
      </button>
      <dialog
        ref={dialog}
        className="accessibility-dialog"
        aria-labelledby="accessibility-title"
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
      >
        <header>
          <h2 id="accessibility-title">Aparência e acessibilidade</h2>
          <button
            className="icon-control"
            aria-label="Fechar configurações"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>
        </header>
        <p>Ajuste a leitura sem perder os destaques da interface.</p>
        <label>
          Tema
          <select
            value={preference.theme}
            onChange={(e) =>
              save({
                ...preference,
                theme: e.target.value as ExperiencePreference["theme"],
              })
            }
          >
            <option value="SYSTEM">Seguir o sistema</option>
            <option value="LIGHT">Claro</option>
            <option value="DARK">Escuro</option>
          </select>
        </label>
        <label htmlFor="text-size">
          Tamanho do texto: {Math.round(preference.fontScale * 100)}%
        </label>
        <input
          id="text-size"
          type="range"
          min="0.85"
          max="1.35"
          step="0.05"
          value={preference.fontScale}
          onChange={(e) =>
            save({ ...preference, fontScale: Number(e.target.value) })
          }
        />
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={preference.highContrast}
            onChange={(e) =>
              save({ ...preference, highContrast: e.target.checked })
            }
          />
          <span>
            Alto contraste<small>Texto e contornos mais definidos.</small>
          </span>
        </label>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={preference.reducedMotion}
            onChange={(e) =>
              save({ ...preference, reducedMotion: e.target.checked })
            }
          />
          <span>
            Reduzir animações
            <small>Também respeita a preferência do sistema.</small>
          </span>
        </label>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={preference.enhancedFocus}
            onChange={(e) =>
              save({ ...preference, enhancedFocus: e.target.checked })
            }
          />
          <span>Foco de teclado reforçado</span>
        </label>
        <button className="secondary" onClick={() => save(defaults)}>
          Restaurar preferências
        </button>
        <p role="status">{status}</p>
      </dialog>
    </div>
  );
}
