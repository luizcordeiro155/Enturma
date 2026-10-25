"use client";
/* eslint-disable @next/next/no-img-element -- KLIPY requires direct-origin GIF images */
import { useEffect, useState } from "react";
import { parseKlipyItems, type KlipyGif } from "@/lib/klipy";

export function KlipyPicker({ query, onSelect, disabled }: {
  query: string;
  onSelect: (gif: KlipyGif) => Promise<void>;
  disabled: boolean;
}) {
  const [key, setKey] = useState("");
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
    if (!key) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      const search = query.trim().length > 0;
      const url = new URL(`https://api.klipy.com/api/v1/${encodeURIComponent(key)}/gifs/${search ? "search" : "trending"}`);
      url.searchParams.set("page", "1");
      url.searchParams.set("per_page", "20");
      url.searchParams.set("locale", "br");
      if (search) url.searchParams.set("q", query);
      setBusy(true);
      setError("");
      fetch(url.toString(), { signal: ctrl.signal, cache: "no-store" })
        .then(r => { if (!r.ok) throw Error(r.status === 429 ? "Limite de consultas da KLIPY atingido." : "Consulta KLIPY indisponível."); return r.json(); })
        .then(data => { if (!ctrl.signal.aborted) setResults(parseKlipyItems(data)); })
        .catch(e => { if (!ctrl.signal.aborted) setError((e as Error).message); })
        .finally(() => { if (!ctrl.signal.aborted) setBusy(false); });
    }, query.trim() ? 400 : 0);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [key, query]);
  return <section aria-label="GIFs da KLIPY">
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
    {busy ? <small>Buscando GIFs…</small> : null}
    {error ? <p role="alert">{error}</p> : null}
    <small className="media-library-credit">Powered by KLIPY · Conteúdo externo</small>
  </section>;
}
