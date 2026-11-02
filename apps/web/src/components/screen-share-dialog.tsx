"use client";
import { useEffect, useRef } from "react";
import { MonitorUp, X } from "lucide-react";
import {
  screenResolutions,
  screenFrameRates,
  type ScreenResolution,
  type ScreenFrameRate,
} from "@/lib/call-media-quality";
import { playMotion } from "@/lib/motion";

export function ScreenShareDialog({
  resolution,
  fps,
  audio,
  noiseSuppression,
  sharing,
  busy,
  error,
  onResolution,
  onFps,
  onAudio,
  onNoiseSuppression,
  onClose,
  onShare,
}: {
  resolution: ScreenResolution;
  fps: ScreenFrameRate;
  audio: boolean;
  noiseSuppression: boolean;
  sharing: boolean;
  busy: boolean;
  error: string;
  onResolution: (value: ScreenResolution) => void;
  onFps: (value: ScreenFrameRate) => void;
  onAudio: (value: boolean) => void;
  onNoiseSuppression: (value: boolean) => void;
  onClose: () => void;
  onShare: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current!;
    const previous = document.activeElement as HTMLElement | null;
    element.showModal();
    const animation = playMotion(element, [
      { opacity: 0.5, transform: "translateY(14px) scale(.98)" },
      { opacity: 1, transform: "none" },
    ]);
    return () => {
      animation?.cancel();
      element.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="screen-share-dialog"
      aria-labelledby="share-title"
      onCancel={(event) => {
        if (busy) event.preventDefault();
        else onClose();
      }}
    >
      <header>
        <div>
          <h2 id="share-title">Transmitir a tela</h2>
          <p>Prepare a transmissão para sua turma.</p>
        </div>
        <button
          className="icon-control"
          aria-label="Fechar qualidade da transmissão"
          onClick={onClose}
          disabled={busy}
        >
          <X size={20} />
        </button>
      </header>
      <div className="share-source-note">
        <MonitorUp size={32} />
        <span>
          Na próxima etapa, escolha a tela, janela ou aba que deseja
          compartilhar. Só o conteúdo escolhido será transmitido.
        </span>
      </div>
      <fieldset className="share-options" disabled={sharing || busy}>
        <legend>Resolução</legend>
        <div>
          {screenResolutions.map((item) => (
            <label key={item.value}>
              <input
                type="radio"
                name="share-resolution"
                value={item.value}
                checked={resolution === item.value}
                onChange={() => onResolution(item.value)}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="share-options" disabled={sharing || busy}>
        <legend>Taxa de quadros</legend>
        <div>
          {screenFrameRates.map((value) => (
            <label key={value}>
              <input
                type="radio"
                name="share-fps"
                value={value}
                checked={fps === value}
                onChange={() => onFps(value)}
              />
              <span>{value} FPS</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="share-audio">
        <input
          type="checkbox"
          checked={audio}
          disabled={sharing || busy}
          onChange={(event) => onAudio(event.target.checked)}
        />
        <span>
          Incluir áudio da tela
          <small>
            Disponível conforme o navegador e a fonte escolhida. Confirme a
            permissão na próxima etapa.
          </small>
        </span>
      </label>
      <label className="share-audio">
        <input
          type="checkbox"
          checked={noiseSuppression}
          onChange={(event) => onNoiseSuppression(event.target.checked)}
        />
        <span>
          Reduzir ruído do microfone
          <small>Aplicado quando o microfone for ativado novamente.</small>
        </span>
      </label>
      <p>
        A qualidade recebida depende da conexão e do dispositivo.{" "}
        {sharing
          ? "Encerre a transmissão antes de alterar o preset."
          : "Para textos, 15 ou 30 FPS costumam ser suficientes."}
      </p>
      {error && <p role="alert">{error}</p>}
      <footer>
        <button className="secondary" onClick={onClose} disabled={busy}>
          Cancelar
        </button>
        <button className="button" onClick={onShare} disabled={busy}>
          {busy
            ? "Abrindo compartilhamento…"
            : sharing
              ? "Parar transmissão"
              : "Escolher e transmitir"}
          <MonitorUp size={18} />
        </button>
      </footer>
    </dialog>
  );
}
