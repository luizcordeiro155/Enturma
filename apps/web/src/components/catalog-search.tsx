"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { academicLabels, type CatalogPage } from "@enturma/contracts";
import { api } from "@/lib/api";
import { Feedback } from "./feedback";
export function CatalogSearch() {
  const [kind, setKind] = useState("courses");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<CatalogPage>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      api<CatalogPage>(
        `/catalog/${kind}?search=${encodeURIComponent(query)}&page=${page}`,
      )
        .then((r) => {
          if (active) {
            setResult(r);
            setError("");
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setBusy(false);
        });
    }, 220);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [kind, query, page]);
  return (
    <details className="catalog-note">
      <summary>Explorar universidades, cursos e disciplinas</summary>
      <label>
        Tipo
        <select
          value={kind}
          onChange={(e) => {
            setBusy(true);
            setKind(e.target.value);
            setPage(0);
          }}
        >
          <option value="institutions">Universidades</option>
          <option value="courses">Ofertas de cursos</option>
          <option value="subjects">Disciplinas</option>
        </select>
      </label>
      <label>
        Buscar no catálogo nacional
        <input
          value={query}
          onChange={(e) => {
            setBusy(true);
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder="UNA, ADS, algoritmos…"
        />
      </label>
      <Feedback error={error} />
      {busy ? (
        <p role="status">Buscando…</p>
      ) : result?.items.length ? (
        result.items.map((r) => (
          <article className="room-row" key={r.id}>
            <div>
              <h3>
                {r.kind === "SUBJECT" ? (
                  <Link href={`/subjects/${r.id}`}>{r.name}</Link>
                ) : (
                  r.name
                )}
              </h3>
              <small>
                {[r.modality, r.shift]
                  .filter(Boolean)
                  .map((v) => academicLabels[v!] ?? v)
                  .join(" · ")}{" "}
                · {r.sourceName}
              </small>
            </div>
            <a href={r.sourceUrl} target="_blank" rel="noreferrer">
              Fonte oficial
            </a>
          </article>
        ))
      ) : (
        <p>Nenhum registro verificado para essa busca.</p>
      )}
      <div className="actions">
        <button
          disabled={!page || busy}
          onClick={() => {
            setBusy(true);
            setPage((n) => n - 1);
          }}
        >
          Anterior
        </button>
        <span>Página {page + 1}</span>
        <button
          disabled={!result?.hasMore || busy}
          onClick={() => {
            setBusy(true);
            setPage((n) => n + 1);
          }}
        >
          Próxima
        </button>
      </div>
    </details>
  );
}
