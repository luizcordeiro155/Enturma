"use client";

import { useEffect, useRef, useState } from "react";
import type { AcademicEntry } from "@enturma/contracts";
import { api, post } from "@/lib/api";
import { Shell } from "./shell";
import { Feedback } from "./feedback";
import { ApproximateLocationButton } from "./ride-mobility";
import { rideAccept, rideEnter } from "@/lib/ride-motion";
import type { PickupZone } from "@/lib/ride-types";

export function RideAdmin() {
  const [campuses, setCampuses] = useState<AcademicEntry[]>([]);
  const [campus, setCampus] = useState("");
  const [zones, setZones] = useState<PickupZone[]>([]);
  const [coords, setCoords] = useState<{
    lat: number;
    lng: number;
    accuracyMeters: number;
  }>();
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<AcademicEntry[]>("/academics?kind=CAMPUS")
      .then(setCampuses)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!campus) {
      setZones([]);
      return;
    }
    api<PickupZone[]>(`/rides/campuses/${campus}/pickup-zones`, {
      cache: "no-store",
    })
      .then(setZones)
      .catch((e) => setError(e.message));
  }, [campus]);

  useEffect(() => {
    list.current
      ?.querySelectorAll("article")
      .forEach((node, index) => rideEnter(node, index));
  }, [zones]);

  return (
    <Shell>
      <div className="narrow ride-page">
        <h1>Pontos oficiais de carona</h1>
        <p className="lead">
          Cadastre somente locais públicos e apropriados para embarque no
          campus. Estes pontos aparecem como sugestões privadas depois do match.
        </p>
        <Feedback error={error} success={success} />
        <label>
          Campus
          <select
            value={campus}
            onChange={(event) => setCampus(event.target.value)}
          >
            <option value="">Selecione</option>
            {campuses.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
        {campus ? (
          <form
            className="ride-mobility-section"
            onSubmit={async (event) => {
              event.preventDefault();
              const formElement = event.currentTarget;
              const form = new FormData(formElement);
              const lat = coords?.lat ?? Number(manualLat);
              const lng = coords?.lng ?? Number(manualLng);
              if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                setError("Informe coordenadas válidas para o ponto público.");
                return;
              }
              try {
                const created = await post<PickupZone>(
                  `/admin/rides/campuses/${campus}/pickup-zones`,
                  {
                    name: form.get("name"),
                    description: form.get("description"),
                    lat,
                    lng,
                  },
                );
                setZones((current) => [...current, created]);
                setSuccess("Ponto oficial adicionado.");
                setError("");
                setCoords(undefined);
                setManualLat("");
                setManualLng("");
                formElement.reset();
                rideAccept(formElement);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <h2>Novo ponto</h2>
            <label>
              Nome
              <input
                name="name"
                maxLength={120}
                placeholder="Ex.: Entrada principal"
                required
              />
            </label>
            <label>
              Descrição
              <input
                name="description"
                maxLength={300}
                placeholder="Local público e fácil de identificar"
              />
            </label>
            <ApproximateLocationButton
              onLocation={(value) => {
                setCoords(value);
                setManualLat(String(value.lat));
                setManualLng(String(value.lng));
              }}
            />
            <div className="form-row">
              <label>
                Latitude
                <input
                  name="lat"
                  type="number"
                  step="0.000001"
                  min={-90}
                  max={90}
                  value={manualLat}
                  onChange={(event) => {
                    setManualLat(event.target.value);
                    setCoords(undefined);
                  }}
                  required
                />
              </label>
              <label>
                Longitude
                <input
                  name="lng"
                  type="number"
                  step="0.000001"
                  min={-180}
                  max={180}
                  value={manualLng}
                  onChange={(event) => {
                    setManualLng(event.target.value);
                    setCoords(undefined);
                  }}
                  required
                />
              </label>
            </div>
            <button>Adicionar ponto oficial</button>
          </form>
        ) : null}
        <div className="ride-recurrence-list" ref={list}>
          {zones.map((zone) => (
            <article key={zone.id}>
              <div>
                <strong>{zone.name}</strong>
                <p>{zone.description || "Sem descrição adicional."}</p>
              </div>
              <small>
                {zone.lat.toFixed(5)}, {zone.lng.toFixed(5)}
              </small>
            </article>
          ))}
        </div>
      </div>
    </Shell>
  );
}
