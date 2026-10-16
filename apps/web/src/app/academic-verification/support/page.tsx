"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen } from "lucide-react";
import { api, post } from "@/lib/api";
type Ticket = {
  id: string;
  message: string;
  response: string | null;
  createdAt: string;
};
export default function AcademicSupport() {
  const [rows, setRows] = useState<Ticket[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    const load = () => {
      if (!document.hidden)
        api<Ticket[]>("/auth/academic/support", { cache: "no-store" })
          .then((value) => {
            if (active) setRows(value);
          })
          .catch((e: Error) => {
            if (active) setError(e.message);
          });
    };
    load();
    const timer = setInterval(load, 15000);
    window.addEventListener("focus", load);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, []);
  return (
    <main className="academic-page">
      <header className="academic-header">
        <Link href="/academic-verification">
          <ArrowLeft size={18} /> Voltar à verificação
        </Link>
        <span className="brand">
          <BookOpen /> enturma.
        </span>
      </header>
      <section
        className="academic-panel"
        style={{ maxWidth: 680, margin: "auto" }}
      >
        <h1 style={{ fontSize: 32 }}>Ajuda com a verificação</h1>
        <p>
          Não encontrou sua instituição ou teve dificuldade em confirmar seu
          vínculo? Descreva o problema. A equipe responderá nesta página.
        </p>
        {error && <p role="alert">{error}</p>}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            setBusy(true);
            setError("");
            try {
              setRows(
                await post<Ticket[]>("/auth/academic/support", {
                  message: new FormData(form).get("message"),
                }),
              );
              form.reset();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Sua dúvida
            <textarea
              name="message"
              minLength={10}
              maxLength={2000}
              rows={5}
              required
            />
          </label>
          <p className="academic-note">
            Não inclua senhas, códigos de confirmação nem documentos nesta
            mensagem. Comprovantes devem ser enviados somente na etapa de
            matrícula.
          </p>
          <button className="button" disabled={busy}>
            {busy ? "Enviando…" : "Enviar para a equipe"}
          </button>
        </form>
        <div
          className="academic-admin-list"
          style={{ marginTop: 24 }}
          aria-live="polite"
        >
          {rows.map((row) => (
            <article key={row.id}>
              <small>{new Date(row.createdAt).toLocaleString("pt-BR")}</small>
              <p>{row.message}</p>
              <strong>
                {row.response ? "Resposta da equipe" : "Aguardando resposta"}
              </strong>
              {row.response && <p>{row.response}</p>}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
