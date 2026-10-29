"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRideMode, type RideMode } from "@/lib/ride-mode";
import type { AcademicEntry } from "@enturma/contracts";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { RidePreferences } from "./ride-mobility";
import { Shell } from "./shell";

export function RideMobilitySettings() {
  const [campuses, setCampuses] = useState<AcademicEntry[]>([]);
  const [error, setError] = useState("");
  const storedMode = useRideMode();
  const params = useSearchParams();
  const requested = params.get("mode");
  const mode: RideMode = requested === "driver" ? "DRIVER" : requested === "passenger" ? "PASSENGER" : storedMode;

  useEffect(() => {
    api<AcademicEntry[]>("/academics?kind=CAMPUS")
      .then(setCampuses)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <Shell>
      <div className="ride-profile-page">
        <header className="ride-profile-page-header">
          <Link href="/caronas" className="ride-profile-back">
            <ArrowLeft size={18} /> Voltar ao mapa
          </Link>
          <span className="ride-profile-eyebrow">Enturma Caronas</span>
          <h1>
            {mode === "DRIVER" ? "Perfil do motorista" : "Perfil do passageiro"}
          </h1>
          <p>
            {mode === "DRIVER"
              ? "Deixe seu veículo e suas rotas prontos para aceitar corridas universitárias com menos etapas."
              : "Organize seus trajetos para pedir carona rapidamente entre casa, campus e outros pontos."}
          </p>
        </header>
        {error ? <p className="feedback error">{error}</p> : null}
        <RidePreferences campuses={campuses} mode={mode} />
      </div>
    </Shell>
  );
}
