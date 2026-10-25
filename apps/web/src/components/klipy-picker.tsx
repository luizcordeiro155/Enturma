"use client";
/* eslint-disable @next/next/no-img-element -- KLIPY requires direct-origin GIF images */
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { klipyHasMore, klipyRequestUrl, parseKlipyItems, type KlipyGif } from "@/lib/klipy";

export function KlipyPicker({ query, onSelect, disabled }: {
  query: string;
  onSelect: (gif: KlipyGif) => Promise<void>;
  disabled: boolean;
}) {
  const [key, setKey] = useState("");
  const [term, setTerm] = useState(query);
  const [debounced, setDebounced] = useState(query);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [results, setResults] = useState<ReturnType<typeof parseKlipyItems>>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/klipy-config", { cache: "no-store" })
      .then(r => r.json())
      .then((data: { key?: string }) => { if (active) setKey(data.key ?? ""); })
      .catch(() => { if (active) setError("Não foi possível iniciar a KLIPY."); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term.trim()), 450);
    return () => clearTimeout(timer);
  }, [term]);

  useEffect(() => {
    if (!key) return;
    const ctrl = new AbortController();
    // Schedule the request asynchronously: React effects should not synchronously
    // cascade state updates during mount or a query change.
    const timer = window.setTimeout(() => {
      setBusy(true);
      setError("");
      void fetch(klipyRequestUrl(key, debounced, page), { signal: ctrl.signal, cache: "no-store" })
      .then(r => {
        if (!r.ok) throw Error(r.status === 429
          ? "Limite de buscas da KLIPY atingido. Tente novamente mais tarde."
          : "Não foi possível buscar GIFs na KLIPY.");
        return r.json();
      })
      .then(data => {
        if (ctrl.signal.aborted) return;
        const next = parseKlipyItems(data);
        setResults(previous => page === 1 ? next : [...previous, ...next]);
        setHasMore(klipyHasMore(data, page));
      })
      .catch(e => {
        if (!ctrl.signal.aborted) setError((e as Error).message);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setBusy(false);
      });
    }, 0);
    return () => {
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, [key, debounced, page]);

  return <section className="klipy-picker" aria-label="GIFs da KLIPY">
    <div className="klipy-search">
      <label>
        <Search size={18} aria-hidden="true" />
        <input type="search" aria-label="Pesquisar GIFs na KLIPY"
          placeholder="Pesquisar GIFs na KLIPY" value={term}
          onChange={event => {
            setTerm(event.target.value);
            setPage(1);
            setResults([]);
            setHasMore(false);
            setError("");
          }} />
      </label>
      {term && <button type="button" aria-label="Limpar pesquisa KLIPY"
        onClick={() => {
          setTerm("");
          setPage(1);
          setResults([]);
          setHasMore(false);
          setError("");
        }}><X size={17}/></button>}
    </div>
    {!key ? <p className="media-empty">KLIPY indisponível. A coleção do Enturma continua funcionando.</p> : null}
    <div className="media-library-grid" aria-busy={busy}>
      {results.map((item, i) => item.kind === "ad"
        ? <article key={"ad-" + i}>
            {item.href?.startsWith("https://")
              ? <a href={item.href} rel="noopener noreferrer sponsored" target="_blank">Patrocinado · {item.title}</a>
              : <span>Patrocinado · {item.title}</span>}
          </article>
        : <article key={item.gif.id + "-" + i}>
            <button type="button" className="media-select" disabled={disabled || busy}
              onClick={() => { void onSelect(item.gif).then(() => {
                if (item.gif.slug) {
                  void fetch(`https://api.klipy.com/api/v1/${encodeURIComponent(key)}/gifs/share/${encodeURIComponent(item.gif.slug)}`,
                    { method: "POST", cache: "no-store" }).catch(() => {});
                }
              }).catch(e => setError((e as Error).message)); }}>
              <img src={item.gif.preview} alt={item.gif.title} loading="lazy" />
              <span>{item.gif.title}</span>
            </button>
          </article>
      )}
    </div>
    {busy ? <small role="status">Buscando GIFs…</small> : null}
    {key && hasMore && !busy && !error &&
      <button type="button" className="klipy-load-more" disabled={disabled}
        onClick={() => setPage(value => value + 1)}>Carregar mais GIFs</button>}
    {!busy && !error && results.length === 0 && key &&
      <p className="media-empty">Nenhum GIF encontrado. Experimente outra pesquisa.</p>}
    {error ? <p role="alert">{error}</p> : null}
    <small className="media-library-credit">Powered by KLIPY · Conteúdo externo</small>
  </section>;
}
