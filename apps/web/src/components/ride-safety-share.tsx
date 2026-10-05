"use client";

import { useEffect, useRef, useState } from "react";
import { Clock3, MapPin, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { tripStatusLabel } from "@/lib/ride-labels";
import { ridePanel, rideStatus } from "@/lib/ride-motion";

type SafetyState = {
  tripStatus: string;
  originArea: string;
  departureAt: string;
  campusName: string;
  driverName: string;
  passengerName: string;
  meetingPoint?: string | null;
  expiresAt: string;
  location?: {
    lat: number;
    lng: number;
    accuracyM: number;
    updatedAt: string;
  } | null;
};

export function RideSafetyShare({ token }: { token: string }) {
  const [data, setData] = useState<SafetyState>();
  const [error, setError] = useState("");
  const root = useRef<HTMLElement>(null);
  const status = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      try {
        const next = await api<SafetyState>(`/public/rides/safety/${token}`, {
          cache: "no-store",
        });
        if (!active) return;
        setData(next);
        setError("");
        timer = setTimeout(load, 15000);
      } catch (e) {
        if (!active) return;
        setError((e as Error).message);
      }
    };
    void load();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [token]);

  useEffect(() => {
    if (data) {
      ridePanel(root.current);
      rideStatus(status.current);
    }
  }, [data?.tripStatus]);

  if (error)
    return (
      <main className="ride-public-safety">
        <h1>Acompanhamento indisponível</h1>
        <p>{error}</p>
      </main>
    );

  if (!data)
    return (
      <main className="ride-public-safety">
        <p>Carregando acompanhamento da carona…</p>
      </main>
    );

  const mapUrl = data.location
    ? `https://www.openstreetmap.org/?mlat=${encodeURIComponent(data.location.lat)}&mlon=${encodeURIComponent(data.location.lng)}#map=17/${encodeURIComponent(data.location.lat)}/${encodeURIComponent(data.location.lng)}`
    : "";

  return (
    <main className="ride-public-safety" ref={root}>
      <header>
        <ShieldCheck size={30} aria-hidden="true" />
        <h1>Acompanhamento compartilhado</h1>
        <p>
          Este link temporário foi criado por um participante da carona. Ele
          expira automaticamente e não dá acesso à conta do Enturma.
        </p>
      </header>
      <div className="ride-trip-status" ref={status}>
        {tripStatusLabel(data.tripStatus)}
      </div>
      <div className="ride-public-safety-grid">
        <div>
          <small>Motorista</small>
          <strong>{data.driverName}</strong>
        </div>
        <div>
          <small>Passageiro</small>
          <strong>{data.passengerName}</strong>
        </div>
        <div>
          <small>Trajeto</small>
          <strong>
            {data.originArea} → {data.campusName}
          </strong>
        </div>
        <div>
          <small>Horário</small>
          <strong>
            <Clock3 size={15} />{" "}
            {new Date(data.departureAt).toLocaleString("pt-BR")}
          </strong>
        </div>
      </div>
      {data.meetingPoint ? (
        <div className="ride-public-location">
          <small>Ponto combinado</small>
          <strong>
            <MapPin size={16} /> {data.meetingPoint}
          </strong>
        </div>
      ) : null}
      <div className="ride-public-location">
        <small>Localização compartilhada</small>
        {data.location ? (
          <>
            <strong>Atualizada recentemente</strong>
            <p>
              Precisão aproximada de {Math.round(data.location.accuracyM)} m.
            </p>
            <a href={mapUrl} target="_blank" rel="noreferrer">
              Abrir localização no mapa
            </a>
          </>
        ) : (
          <p>
            O participante não está compartilhando localização ao vivo neste
            momento.
          </p>
        )}
      </div>
      <small>
        Link válido até {new Date(data.expiresAt).toLocaleString("pt-BR")}.
      </small>
    </main>
  );
}
