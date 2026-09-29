"use client";
import { useEffect, useRef, useState } from "react";
import { Car, Check, X } from "lucide-react";
import { Avatar, type PublicProfile } from "./user-identity";
import { api } from "@/lib/api";
export function RideMatchCelebration({
  owner,
  passenger,
  area,
  onClose,
  onChat,
}: {
  owner: PublicProfile;
  passenger: PublicProfile;
  area: string;
  onClose: () => void;
  onChat: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [profiles, setProfiles] = useState([owner, passenger]);
  const ownerId = owner.id,
    ownerName = owner.name,
    passengerId = passenger.id,
    passengerName = passenger.name;
  useEffect(() => {
    let active = true;
    Promise.all(
      [
        { id: ownerId, name: ownerName },
        { id: passengerId, name: passengerName },
      ].map((p) => api<PublicProfile>(`/users/${p.id}/profile`).catch(() => p)),
    ).then((p) => {
      if (active) setProfiles(p);
    });
    return () => {
      active = false;
    };
  }, [ownerId, ownerName, passengerId, passengerName]);
  useEffect(() => {
    const el = dialog.current!;
    const previous = document.activeElement as HTMLElement | null;
    el.showModal();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let animations: Animation[] = [];
    function animate() {
      animations.forEach((a) => a.cancel());
      animations = [];
      if (
        reduced.matches ||
        document.documentElement.dataset.reducedMotion === "true"
      )
        return;
      el.querySelectorAll(".ride-match-person").forEach((person, i) =>
        animations.push(
          person.animate(
            [
              {
                opacity: 0,
                transform: `translateX(${i ? 65 : -65}px) rotate(${i ? 12 : -12}deg) scale(.72)`,
              },
              {
                opacity: 1,
                transform: `translateX(${i ? -5 : 5}px) rotate(${i ? -2 : 2}deg) scale(1.04)`,
                offset: 0.76,
              },
              { opacity: 1, transform: "translateX(0) rotate(0) scale(1)" },
            ],
            {
              duration: 800,
              easing: "cubic-bezier(.2,.8,.2,1)",
              fill: "backwards",
            },
          ),
        ),
      );
      const badge = el.querySelector(".ride-match-link")!;
      animations.push(
        badge.animate(
          [
            { opacity: 0, transform: "scale(.3)" },
            { opacity: 1, transform: "scale(1.15)", offset: 0.7 },
            { opacity: 1, transform: "scale(1)" },
          ],
          { duration: 550, delay: 450, fill: "backwards" },
        ),
      );
      el.querySelectorAll(".ride-match-particle").forEach((particle, i) => {
        const angle = (i * Math.PI) / 6,
          x = Math.cos(angle) * 125,
          y = Math.sin(angle) * 100;
        animations.push(
          particle.animate(
            [
              { opacity: 0, transform: "translate(0,0) scale(.3)" },
              { opacity: 1, offset: 0.18 },
              {
                opacity: 0,
                transform: `translate(${x}px,${y}px) rotate(${i * 45}deg) scale(1)`,
              },
            ],
            {
              duration: 1200,
              delay: 600,
              fill: "backwards",
              easing: "cubic-bezier(.1,.7,.3,1)",
            },
          ),
        );
      });
    }
    animate();
    reduced.addEventListener("change", animate);
    window.addEventListener("enturma-motion", animate);
    return () => {
      animations.forEach((a) => a.cancel());
      reduced.removeEventListener("change", animate);
      window.removeEventListener("enturma-motion", animate);
      el.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="ride-match-dialog"
      aria-labelledby="ride-match-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ride-match-celebration">
        <button
          className="icon-control ride-match-dismiss"
          aria-label="Fechar confirmação de match"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <span className="eyebrow">
          <Car size={18} /> Carona confirmada
        </span>
        <div className="ride-match-profiles">
          {profiles.map((p, i) => (
            <div className="ride-match-person" key={p.id}>
              <Avatar user={p} />
              <strong
                className={`name-${p.profileDetails?.nameFont ?? "SYSTEM"}`}
              >
                {p.name}
              </strong>
              <small>{i === 0 ? "Publicou a carona" : "Vai junto"}</small>
            </div>
          ))}
          <span className="ride-match-link" aria-hidden="true">
            <Check size={28} />
          </span>
          <span className="ride-match-burst" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => (
              <i key={i} className="ride-match-particle" />
            ))}
          </span>
        </div>
        <h2 id="ride-match-title">Deu match na carona!</h2>
        <p>Vocês vão pelo mesmo caminho. Agora é só combinar o encontro.</p>
        <p className="ride-match-area">
          <Car size={18} /> {area}
        </p>
        <button onClick={onChat}>Combinar encontro</button>
        <button className="text-button" onClick={onClose}>
          Continuar depois
        </button>
      </div>
    </dialog>
  );
}
