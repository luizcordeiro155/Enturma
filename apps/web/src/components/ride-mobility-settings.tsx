"use client";

import { useEffect, useState } from "react";
import type { AcademicEntry } from "@enturma/contracts";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { RidePreferences } from "./ride-mobility";
import { Shell } from "./shell";

export function RideMobilitySettings() {
  const [campuses, setCampuses] = useState<AcademicEntry[]>([]);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"PASSENGER" | "DRIVER">(() => {
    if (typeof window === "undefined") return "PASSENGER";
    return localStorage.getItem("enturma-ride-mode") === "DRIVER"
      ? "DRIVER"
      : "PASSENGER";
  });

  useEffect(() => {
    api<AcademicEntry[]>("/academics?kind=CAMPUS")
      .then(setCampuses)
      .catch((e) => setError(e.message));

    const syncMode = () => {
      const saved = localStorage.getItem("enturma-ride-mode");
      setMode(saved === "DRIVER" ? "DRIVER" : "PASSENGER");
    };
    const custom = (event: Event) => {
      const next = (event as CustomEvent<"PASSENGER" | "DRIVER">).detail;
      if (next === "PASSENGER" || next === "DRIVER") setMode(next);
      else syncMode();
    };
    window.addEventListener("enturma-ride-mode-change", custom);
    return () => window.removeEventListener("enturma-ride-mode-change", custom);
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
