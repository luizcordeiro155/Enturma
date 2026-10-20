"use client";
import { useEffect, useState } from "react";
import { Car, Star, UserRound } from "lucide-react";
import { api } from "@/lib/api";

export function RideReputation({ userId }: { userId: string }) {
  const [roles, setRoles] = useState<
    { role: string; rating: number; reviews: number }[]
  >([]);
  useEffect(() => {
    let live = true;
    api<{ roles: typeof roles }>(`/rides/users/${userId}/reputation`)
      .then((value) => {
        if (live) setRoles(value.roles ?? []);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [userId]);
  if (!roles.length) return null;
  return (
    <section
      className="profile-ride-reputation"
      aria-label="Avaliações de caronas"
    >
      <h3>Avaliações de caronas</h3>
      {roles.map((role) => (
        <div key={role.role}>
          {role.role === "DRIVER" ? <Car size={20} /> : <UserRound size={20} />}
          <span>
            <strong>
              {role.role === "DRIVER" ? "Como motorista" : "Como passageiro"}
            </strong>
            <small>
              {role.reviews} {role.reviews === 1 ? "avaliação" : "avaliações"}
            </small>
          </span>
          <b>
            <Star size={16} fill="currentColor" />{" "}
            {Number(role.rating).toFixed(1)}
          </b>
        </div>
      ))}
    </section>
  );
}
