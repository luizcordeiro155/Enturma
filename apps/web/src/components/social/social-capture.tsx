"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, Circle, Square, SwitchCamera } from "lucide-react";
import { SocialDialog } from "./social-dialog";
export function SocialCapture({
  close,
  captured,
}: {
  close: () => void;
  captured: (file: File) => void;
}) {
  const video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null),
    recorder = useRef<MediaRecorder | null>(null),
    timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const alive = useRef(true),
    opening = useRef(false);
  const [facing, setFacing] = useState<"user" | "environment">("user"),
    [ready, setReady] = useState(false),
    [recording, setRecording] = useState(false),
    [seconds, setSeconds] = useState(0),
    [error, setError] = useState("");
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (timer.current) clearInterval(timer.current);
      if (recorder.current?.state === "recording") {
        recorder.current.onstop = null;
        recorder.current.ondataavailable = null;
        recorder.current.stop();
      }
      stream.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);
  async function open(next = facing) {
    if (opening.current) return;
    opening.current = true;
    try {
      setError("");
      stream.current?.getTracks().forEach((t) => t.stop());
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: next },
          width: { ideal: 720 },
          height: { ideal: 1280 },
        },
        audio: true,
      });
      if (!alive.current) {
        stream.current.getTracks().forEach((t) => t.stop());
        return;
      }
      if (video.current) {
        video.current.srcObject = stream.current;
        await video.current.play();
      }
      setFacing(next);
      setReady(true);
    } catch {
      if (alive.current)
        setError(
          "Não foi possível abrir a câmera. Confira a permissão ou escolha um vídeo da galeria.",
        );
    } finally {
      opening.current = false;
    }
  }
  function start() {
    if (!stream.current || typeof MediaRecorder === "undefined") {
      setError(
        "Use a câmera do sistema pelo botão Escolher mídia neste dispositivo.",
      );
      return;
    }
    try {
      const mime = [
        "video/webm;codecs=vp8,opus",
        "video/mp4",
        "video/webm",
      ].find((t) => MediaRecorder.isTypeSupported(t));
      const rec = new MediaRecorder(
        stream.current,
        mime ? { mimeType: mime, videoBitsPerSecond: 2500000 } : undefined,
      );
      recorder.current = rec;
      const parts: Blob[] = [];
      let bytes = 0,
        elapsed = 0;
      rec.ondataavailable = (e) => {
        bytes += e.data.size;
        if (bytes > 128 * 1024 * 1024) {
          rec.onstop = null;
          rec.stop();
          setRecording(false);
          setError("A gravação atingiu o limite. Grave um vídeo menor.");
          if (timer.current) clearInterval(timer.current);
        } else parts.push(e.data);
      };
      rec.onstop = () => {
        if (timer.current) clearInterval(timer.current);
        const blob = new Blob(parts, { type: rec.mimeType });
        captured(
          new File(
            [blob],
            `captura.${rec.mimeType.includes("mp4") ? "mp4" : "webm"}`,
            { type: rec.mimeType },
          ),
        );
        close();
      };
      rec.start(1000);
      setRecording(true);
      setSeconds(0);
      timer.current = setInterval(() => {
        setSeconds(++elapsed);
        if (elapsed >= 90 && rec.state === "recording") rec.stop();
      }, 1000);
    } catch {
      setError(
        "Gravação indisponível neste dispositivo. Importe um vídeo da câmera do sistema.",
      );
    }
  }
  return (
    <SocialDialog title="Gravar um Clip" close={close}>
      <div className="social-capture">
        <video
          className="social-capture-preview"
          ref={video}
          muted
          playsInline
        />
        <p role="status">
          {recording
            ? `Gravando · ${seconds}s / 90s`
            : "Revise e edite sua gravação antes de publicar."}
        </p>
        {error && <p role="alert">{error}</p>}
        <div className="social-row">
          {!ready ? (
            <button onClick={() => void open()}>
              <Camera /> Ativar câmera
            </button>
          ) : recording ? (
            <button onClick={() => recorder.current?.stop()}>
              <Square /> Finalizar
            </button>
          ) : (
            <>
              <button onClick={start}>
                <Circle /> Gravar
              </button>
              <button
                className="secondary"
                onClick={() =>
                  void open(facing === "user" ? "environment" : "user")
                }
              >
                <SwitchCamera /> Virar câmera
              </button>
            </>
          )}
        </div>
      </div>
    </SocialDialog>
  );
}
