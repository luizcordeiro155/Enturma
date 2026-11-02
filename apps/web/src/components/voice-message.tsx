"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, Send, Square, Trash2 } from "lucide-react";
import "./voice-message.css";

const MAX_BYTES = 1433600;
export function VoiceMessage({ src }: { src: string }) {
  return (
    <div className="voice-message">
      <Mic size={18} aria-hidden />
      <audio
        controls
        preload="metadata"
        src={src}
        aria-label="Mensagem de voz"
      />
    </div>
  );
}

export function VoiceRecorder({
  disabled,
  hiddenWhenIdle = false,
  onSend,
  onError,
}: {
  disabled?: boolean;
  hiddenWhenIdle?: boolean;
  onSend: (file: File) => Promise<void>;
  onError: (error: string) => void;
}) {
  const [stage, setStage] = useState<
    "idle" | "starting" | "recording" | "preview" | "sending"
  >("idle");
  const [seconds, setSeconds] = useState(0);
  const [recording, setRecording] = useState<{ file: File; url: string }>();
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const alive = useRef(true);
  const cancelled = useRef(false);
  const generation = useRef<symbol | null>(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      generation.current = null;
      cancelled.current = true;
      if (recorder.current?.state !== "inactive") recorder.current?.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);
  useEffect(
    () => () => {
      if (recording) URL.revokeObjectURL(recording.url);
    },
    [recording],
  );
  useEffect(() => {
    if (stage !== "recording") return;
    const start = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      setSeconds(elapsed);
      if (elapsed >= 120 && recorder.current?.state === "recording")
        recorder.current.stop();
    }, 250);
    return () => window.clearInterval(timer);
  }, [stage]);

  async function begin() {
    if (disabled || stage !== "idle") return;
    setStage("starting");
    cancelled.current = false;
    const currentGeneration = Symbol("recording");
    generation.current = currentGeneration;
    try {
      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      )
        throw Error(
          "Este navegador não permite gravar áudio. Atualize o navegador ou o aplicativo.",
        );
      const input = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: false,
      });
      if (
        !alive.current ||
        cancelled.current ||
        currentGeneration !== generation.current
      ) {
        input.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = input;
      const format = [
        "audio/webm;codecs=opus",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ].find((type) => MediaRecorder.isTypeSupported(type));
      if (!format)
        throw Error(
          "Não há um formato de gravação compatível neste dispositivo.",
        );
      const current = new MediaRecorder(input, {
        mimeType: format,
        audioBitsPerSecond: 64000,
      });
      recorder.current = current;
      const chunks: Blob[] = [];
      let size = 0;
      current.ondataavailable = (event) => {
        if (!event.data.size) return;
        chunks.push(event.data);
        size += event.data.size;
        if (size > MAX_BYTES && current.state === "recording") current.stop();
      };
      current.onerror = () => {
        cancelled.current = true;
        input.getTracks().forEach((t) => t.stop());
        if (alive.current && currentGeneration === generation.current) {
          setStage("idle");
          onError("Não foi possível gravar o áudio. Tente novamente.");
        }
      };
      current.onstop = () => {
        input.getTracks().forEach((t) => t.stop());
        if (
          !alive.current ||
          cancelled.current ||
          currentGeneration !== generation.current
        )
          return;
        if (!size || size > MAX_BYTES) {
          setStage("idle");
          onError(
            "O áudio ficou vazio ou muito grande. Grave uma mensagem mais curta.",
          );
          return;
        }
        const mime = format.split(";")[0];
        const extension = mime === "audio/mp4" ? "m4a" : mime.split("/")[1];
        const file = new File(chunks, `audio-${Date.now()}.${extension}`, {
          type: mime,
        });
        setRecording({ file, url: URL.createObjectURL(file) });
        setStage("preview");
      };
      current.start(1000);
      setSeconds(0);
      setStage("recording");
    } catch (error) {
      if (alive.current && currentGeneration === generation.current) {
        stream.current?.getTracks().forEach((track) => track.stop());
        setStage("idle");
        onError(
          error instanceof DOMException && error.name === "NotAllowedError"
            ? "Permita o microfone para enviar uma mensagem de voz."
            : (error as Error).message,
        );
      }
    }
  }
  function discard() {
    generation.current = null;
    cancelled.current = true;
    if (recorder.current?.state === "recording") recorder.current.stop();
    stream.current?.getTracks().forEach((track) => track.stop());
    setRecording(undefined);
    setStage("idle");
  }
  async function send() {
    if (!recording || stage !== "preview" || disabled) return;
    setStage("sending");
    try {
      await onSend(recording.file);
      if (alive.current) discard();
    } catch (error) {
      if (alive.current) {
        setStage("preview");
        onError((error as Error).message);
      }
    }
  }
  if (hiddenWhenIdle && stage === "idle") return null;
  return (
    <div className="voice-recorder" data-stage={stage}>
      {stage === "idle" && (
        <button
          type="button"
          className="voice-record-button voice-record-send"
          aria-label="Gravar mensagem de voz"
          title="Gravar mensagem de voz"
          disabled={disabled || stage !== "idle"}
          onClick={() => void begin()}
        >
          <Mic size={20} />
        </button>
      )}
      {stage !== "idle" && (
        <div
          className="voice-record-panel"
          role="group"
          aria-label="Gravação de mensagem de voz"
        >
          <button
            type="button"
            className="voice-record-button"
            aria-label="Descartar áudio"
            disabled={stage === "sending"}
            onClick={discard}
          >
            <Trash2 size={19} />
          </button>
          {stage === "recording" || stage === "starting" ? (
            <>
              <span className="voice-record-timer" role="status">
                {stage === "starting"
                  ? "Abrindo microfone…"
                  : `Gravando · ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`}
                <small>Até 2 minutos · revise antes de enviar</small>
              </span>
              <button
                type="button"
                className="voice-record-button"
                aria-label="Parar e ouvir áudio"
                disabled={stage === "starting"}
                onClick={() => recorder.current?.stop()}
              >
                <Square size={20} />
              </button>
            </>
          ) : (
            <>
              <audio
                controls
                src={recording?.url}
                aria-label="Ouvir áudio antes de enviar"
              />
              <button
                type="button"
                className="voice-record-button voice-record-send"
                aria-label={
                  stage === "sending" ? "Enviando áudio" : "Enviar áudio"
                }
                disabled={disabled || stage === "sending"}
                onClick={() => void send()}
              >
                <Send size={20} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
