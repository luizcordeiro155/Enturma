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

  useEffect(() => {
    api<AcademicEntry[]>("/academics?kind=CAMPUS")
      .then(setCampuses)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <Shell>
      <div className="narrow ride-page">
        <Link href="/caronas" className="button secondary">
          <ArrowLeft size={17} /> Voltar para Caronas
        </Link>
        <h1>Minha mobilidade</h1>
        <p className="lead">
          Configure veículo e rotinas. O mapa principal continua sendo a
          experiência de pedir ou oferecer carona.
        </p>
        {error ? <p className="feedback error">{error}</p> : null}
        <RidePreferences campuses={campuses} />
      </div>
    </Shell>
  );
}
