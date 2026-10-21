"use client";
import { useEffect, useRef, useState } from "react";
import { StarRating } from "./star-rating";
import { Avatar } from "./user-identity";
import { post } from "@/lib/api";
export type CompletedRide = {
  id: string;
  reviewed?: boolean;
  driverId: string;
  passengerId: string;
  driverName: string;
  passengerName: string;
  driverHasAvatar?: boolean;
  passengerHasAvatar?: boolean;
};
export function RideReviewDialog({
  ride,
  me,
  onDone,
  onClose,
}: {
  ride: CompletedRide;
  me: string;
  onDone: () => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    if (
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.reducedMotion === "true"
    )
      return;
    const animation = node?.animate(
      [
        { opacity: 0, transform: "translateY(24px) scale(.94)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 480, easing: "cubic-bezier(.16,1,.3,1)" },
    );
    return () => animation?.cancel();
  }, []);
  const peer = ride.driverId === me ? ride.passengerName : ride.driverName;
  return (
    <dialog
      ref={dialog}
      className="ride-review-dialog"
      aria-labelledby="ride-review-title"
      onCancel={(event) => {
        if (busy) event.preventDefault();
        else onClose();
      }}
    >
      <div className="ride-review-people">
        <Avatar
          user={{
            id: ride.driverId,
            name: ride.driverName,
            hasAvatar: ride.driverHasAvatar,
          }}
        />
        <span>✓</span>
        <Avatar
          user={{
            id: ride.passengerId,
            name: ride.passengerName,
            hasAvatar: ride.passengerHasAvatar,
          }}
        />
      </div>
      <small>Destino alcançado</small>
      <h2 id="ride-review-title">Como foi a carona?</h2>
      <p>
        Avalie sua experiência com <strong>{peer}</strong>.
      </p>
      <StarRating value={rating} onChange={setRating} disabled={busy} />
      <p className="ride-review-caption" aria-live="polite">
        {
          [
            "Toque ou deslize pelas estrelas",
            "Precisa melhorar",
            "Regular",
            "Boa",
            "Muito boa",
            "Excelente!",
          ][rating]
        }
      </p>
      <label>
        Conte como foi (opcional)
        <textarea
          value={comment}
          maxLength={300}
          onChange={(event) => setComment(event.target.value)}
        />
      </label>
      {error && (
        <p role="alert" className="feedback error">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={busy || !rating}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await post(`/matches/${ride.id}/review`, {
              rating,
              punctuality: rating,
              communication: rating,
              respect: rating,
              responsible: ride.passengerId === me ? rating >= 4 : null,
              comment,
            });
            onDone();
          } catch (error) {
            setError((error as Error).message);
            setBusy(false);
          }
        }}
      >
        {busy ? "Salvando…" : "Enviar avaliação e voltar ao mapa"}
      </button>
      <button
        type="button"
        className="text-button"
        disabled={busy}
        onClick={onClose}
      >
        Agora não
      </button>
    </dialog>
  );
}
