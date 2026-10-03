"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { AcademicEntry } from "@enturma/contracts";
import { api } from "@/lib/api";
import { Shell } from "./shell";
import { Feedback } from "./feedback";
type Subject = AcademicEntry & {
  details: {
    workloadHours?: number;
    curriculumName: string;
    version: string;
    periodName: string;
  };
  topics: AcademicEntry[];
  prerequisites: AcademicEntry[];
};
export function SubjectDetail({ id }: { id: string }) {
  const [s, setS] = useState<Subject>();
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api<Subject>(`/catalog/subjects/${id}`)
      .then((v) => {
        if (active) setS(v);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id]);
  return (
    <Shell>
      <div className="narrow">
        <Link href="/subjects">← Minhas matérias</Link>
        <Feedback error={error} />
        {s ? (
          <>
            <p className="eyebrow">Disciplina verificada</p>
            <h1>{s.name}</h1>
            <p className="lead">{s.details.periodName}</p>
            <p>
              {s.details.curriculumName} · {s.details.version}
            </p>
            {s.details.workloadHours ? (
              <p>{s.details.workloadHours} horas</p>
            ) : null}
            <a href={s.sourceUrl} target="_blank" rel="noreferrer">
              Consultar matriz oficial: {s.sourceName}
            </a>
            <h2 className="section-heading">Pré-requisitos documentados</h2>
            {s.prerequisites.length ? (
              s.prerequisites.map((p) => (
                <p key={p.id}>
                  <Link href={`/subjects/${p.id}`}>{p.name}</Link>
                </p>
              ))
            ) : (
              <p>
                Sem relações de pré-requisito verificadas nesta versão. Consulte
                a matriz oficial.
              </p>
            )}
            <h2 className="section-heading">Tópicos</h2>
            {s.topics.length ? (
              s.topics.map((t) => (
                <article className="room-row" key={t.id}>
                  {t.name}
                </article>
              ))
            ) : (
              <p>A fonte ainda não fornece tópicos verificados para esta UC.</p>
            )}
            <div className="actions">
              <Link className="button" href="/rooms/new">
                Estudar esta matéria
              </Link>
              <Link href="/home">Encontrar salas de estudo</Link>
            </div>
          </>
        ) : !error ? (
          <p role="status">Carregando disciplina…</p>
        ) : null}
      </div>
    </Shell>
  );
}
