"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import jsQR from "jsqr";
import { roomInviteCode } from "@/lib/room-invite";

export default function RoomQrScanner({
  onCode,
  onClose,
}: {
  onCode: (code: string) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const callback = useRef(onCode);
  useEffect(() => {
    callback.current = onCode;
  }, [onCode]);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    function stop() {
      stream?.getTracks().forEach((track) => track.stop());
      clearTimeout(timer);
    }
    function scan() {
      if (cancelled) return;
      const node = video.current;
      if (node && context && node.readyState >= 2 && node.videoWidth) {
        canvas.width = Math.min(640, node.videoWidth);
        canvas.height = Math.round(
          (node.videoHeight * canvas.width) / node.videoWidth,
        );
        context.drawImage(node, 0, 0, canvas.width, canvas.height);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(pixels.data, pixels.width, pixels.height, {
          inversionAttempts: "dontInvert",
        });
        if (result) {
          const code = roomInviteCode(result.data, location.origin);
          if (code) {
            stop();
            callback.current(code);
            return;
          }
          setError(
            "Este QR não é um convite desta comunidade Enturma. Aponte para o QR da sala.",
          );
        }
      }
      timer = setTimeout(scan, 180);
    }
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia)
          throw Error("CAMERA_UNAVAILABLE");
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 960 },
          },
        });
        if (cancelled) {
          stop();
          return;
        }
        if (video.current) {
          video.current.srcObject = stream;
          await video.current.play();
        }
        if (cancelled) {
          stop();
          return;
        }
        setReady(true);
        scan();
      } catch (failure) {
        stop();
        if (!cancelled)
          setError(
            (failure as Error).name === "NotAllowedError"
              ? "Permita o uso da câmera nas configurações do navegador ou aplicativo. Você também pode digitar o código da sala."
              : "Não foi possível abrir a câmera. Verifique se ela está disponível ou digite o código da sala.",
          );
      }
    }
    const visibility = () => {
      if (document.hidden) {
        cancelled = true;
        stop();
        setReady(false);
        setError("Câmera pausada. Toque em tentar novamente para continuar.");
      }
    };
    void start();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [attempt]);
  return (
    <dialog
      ref={dialog}
      className="room-qr-dialog"
      aria-labelledby="scan-room-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header>
        <div>
          <Camera size={20} />
          <h2 id="scan-room-title">Escanear convite</h2>
        </div>
        <button
          type="button"
          className="icon-control"
          aria-label="Fechar câmera"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </header>
      <div className="room-qr-view">
        <video ref={video} autoPlay playsInline muted />
        <span className="room-qr-frame" aria-hidden="true" />
        {!ready && <p>Preparando câmera…</p>}
      </div>
      <p>
        Aponte para o QR da sala. O convite será aberto para você confirmar a
        entrada.
      </p>
      {error && (
        <div role="status">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => {
              setError("");
              setReady(false);
              setAttempt((v) => v + 1);
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}
    </dialog>
  );
}
