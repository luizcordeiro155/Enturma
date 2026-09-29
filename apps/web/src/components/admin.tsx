"use client";
import { useEffect, useState } from "react";
import type { AcademicEntry } from "@enturma/contracts";
import { api, post } from "@/lib/api";
import { Shell } from "./shell";
import { Feedback } from "./feedback";
export function Admin() {
  const [kind, setKind] = useState("INSTITUTION");
  const [entries, setEntries] = useState<AcademicEntry[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api<AcademicEntry[]>(`/admin/academics?kind=${kind}`)
      .then(setEntries)
      .catch((e) => setError(e.message));
  }, [kind]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const text = String(new FormData(e.currentTarget).get("json"));
      await post("/admin/academics/import", JSON.parse(text));
      setSuccess("Importação validada e registrada na auditoria.");
      setEntries(await api<AcademicEntry[]>(`/admin/academics?kind=${kind}`));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell>
      <div className="narrow">
        <h1>Catálogo acadêmico</h1>
        <p className="lead">
          Dados com procedência, verificação e histórico de alterações.
        </p>
        <Feedback error={error} success={success} />
        <label>
          Tipo de registro
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            {[
              "INSTITUTION",
              "CAMPUS",
              "COURSE",
              "CURRICULUM",
              "PERIOD",
              "SUBJECT",
              "TOPIC",
            ].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        {entries.map((e) => (
          <article key={e.id} className="room-row">
            <div>
              <h3>{e.name}</h3>
              <p>{e.status}</p>
              <a href={e.sourceUrl} target="_blank" rel="noreferrer">
                {e.sourceName}
              </a>
            </div>
          </article>
        ))}
        <h2 className="section-heading">Importar registros</h2>
        <p className="muted">
          Envie JSON no formato documentado em docs/API.md. A importação é
          atômica e exige os registros pais primeiro.
        </p>
        <form onSubmit={submit}>
          <label>
            Documento JSON
            <textarea
              className="code-input"
              name="json"
              required
              spellCheck={false}
              placeholder={'{"entries": []}'}
            />
          </label>
          <button disabled={busy}>
            {busy ? "Validando…" : "Validar e importar"}
          </button>
        </form>
      </div>
    </Shell>
  );
}
