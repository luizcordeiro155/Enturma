"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Accessibility, X } from "lucide-react";
import type { ExperiencePreference } from "@enturma/contracts";
import {
  experienceDefaults as defaults,
  useExperience,
  saveExperience,
  syncExperience,
} from "@/lib/experience-preferences";
import { ThemePicker } from "./theme-picker";
const accessibilityTitle = "Aparência e acessibilidade";
export function ExperienceControls({
  localOnly = false,
}: {
  localOnly?: boolean;
}) {
  const preference = useExperience();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const textSizeId = useId();
  useEffect(() => {
    if (!localOnly) void syncExperience().catch(() => {});
  }, [localOnly]);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  function save(next: ExperiencePreference) {
    setStatus(
      localOnly ? "Preferências aplicadas neste navegador." : "Salvando…",
    );
    void saveExperience(next, localOnly)
      .then(() => {
        if (!localOnly) setStatus("Preferências salvas no seu perfil.");
      })
      .catch(() =>
        setStatus(
          "Preferências aplicadas neste navegador. Não foi possível sincronizar com seu perfil.",
        ),
      );
  }
  return (
    <div className="experience-controls">
      <ThemePicker
        value={preference.theme}
        onChange={(theme) => save({ ...preference, theme })}
      />
      <button
        className="accessibility-trigger"
        aria-label="Acessibilidade"
        type="button"
        onClick={() => setOpen(true)}
      >
        <Accessibility size={19} />
        <span>Acessibilidade</span>
      </button>
      <dialog
        ref={dialog}
        className="accessibility-dialog"
        aria-label={accessibilityTitle}
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
      >
        <header>
          <h2>{accessibilityTitle}</h2>
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
            <option value="LIGHT">Claro</option>
            <option value="DARK">Escuro</option>
            <option value="ENTURMA">Enturma · verde e lima</option>
            <option value="SYSTEM">Seguir o sistema</option>
          </select>
        </label>
        <label htmlFor={textSizeId}>
          Tamanho do texto: {Math.round(preference.fontScale * 100)}%
        </label>
        <input
          id={textSizeId}
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
