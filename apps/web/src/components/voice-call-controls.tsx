"use client";
import {
  Headphones,
  HeadphoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  SwitchCamera,
  Settings2,
  MonitorUp,
  PhoneOff,
} from "lucide-react";
export function VoiceCallControls({
  deafened,
  muted,
  camera,
  cameraSwitchBusy,
  canSwitchCamera,
  mobile,
  screen,
  screenSettingsOpen,
  screenSupported,
  screenBusy,
  onDeafen,
  onMicrophone,
  onCamera,
  onSwitchCamera,
  onSettings,
  onShare,
  onLeave,
}: {
  deafened: boolean;
  muted: boolean;
  camera: boolean;
  cameraSwitchBusy: boolean;
  canSwitchCamera: boolean;
  mobile: boolean;
  screen: boolean;
  screenSettingsOpen: boolean;
  screenSupported: boolean;
  screenBusy: boolean;
  onDeafen: () => void;
  onMicrophone: () => void;
  onCamera: () => void;
  onSwitchCamera: () => void;
  onSettings: () => void;
  onShare: () => void;
  onLeave: () => void;
}) {
  return (
    <div className="call-controls enturma-call-controls">
      <button
        type="button"
        className={deafened ? "call-control is-off" : "call-control"}
        aria-pressed={deafened}
        aria-label={
          deafened ? "Ativar som da chamada" : "Silenciar som da chamada"
        }
        onClick={() => onDeafen()}
        title={deafened ? "Ouvir chamada" : "Silenciar áudio"}
      >
        <>{deafened ? <HeadphoneOff size={20} /> : <Headphones size={20} />}</>
        <span>{deafened ? "Som desligado" : "Som ligado"}</span>
      </button>
      <button
        type="button"
        className={muted ? "call-control is-off" : "call-control"}
        aria-pressed={muted}
        onClick={() => void onMicrophone()}
        title={muted ? "Ativar microfone" : "Silenciar"}
      >
        {muted ? <MicOff size={20} /> : <Mic size={20} />}
        <span>{muted ? "Ativar" : "Microfone"}</span>
      </button>
      <button
        type="button"
        className={camera ? "call-control active" : "call-control"}
        aria-pressed={camera}
        onClick={() => void onCamera()}
        disabled={cameraSwitchBusy}
        title={camera ? "Desligar câmera" : "Ligar câmera"}
      >
        {camera ? <Video size={20} /> : <VideoOff size={20} />}
        <span>Câmera</span>
      </button>
      {camera && canSwitchCamera && (
        <button
          type="button"
          className="call-control"
          disabled={cameraSwitchBusy}
          onClick={() => void onSwitchCamera()}
          title="Alternar câmera frontal, traseira ou conectada"
        >
          <SwitchCamera size={20} />
          <span>{cameraSwitchBusy ? "Trocando…" : "Virar câmera"}</span>
        </button>
      )}
      {!mobile && (
        <>
          <button
            type="button"
            className="call-control"
            aria-expanded={screenSettingsOpen}
            onClick={() => onSettings()}
            title="Qualidade da transmissão"
          >
            <Settings2 size={20} />
            <span>Qualidade</span>
          </button>
          <button
            type="button"
            className={screen ? "call-control active" : "call-control"}
            onClick={() => onShare()}
            disabled={!screenSupported || screenBusy}
            title={
              screenSupported
                ? screen
                  ? "Parar compartilhamento"
                  : "Compartilhar tela"
                : "Compartilhamento de tela indisponível neste Android"
            }
          >
            <MonitorUp size={20} />
            <span>
              {screen
                ? "Parar tela"
                : screenSupported
                  ? "Compartilhar"
                  : "Tela indisponível"}
            </span>
          </button>
        </>
      )}
      <button
        type="button"
        className="call-control hangup"
        onClick={onLeave}
        title="Sair da chamada"
      >
        <PhoneOff size={20} />
        <span>Desconectar</span>
      </button>
    </div>
  );
}
