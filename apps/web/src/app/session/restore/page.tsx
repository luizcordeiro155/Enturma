"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, LoaderCircle, RefreshCw } from "lucide-react";
import { authDestination } from "@/lib/auth-navigation";

function destination() {
  return authDestination(
    new URLSearchParams(window.location.search).get("next"),
  );
}

/** A single locked refresh across tabs prevents reuse of a rotated token. */
async function restoreSession() {
  const refresh = () =>
    fetch("/api/session", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
    });
  if (navigator.locks?.request)
    return navigator.locks.request("enturma-refresh", refresh);
  return refresh();
}

export default function RestorePage() {
  const [error, setError] = useState("");
  const [working, setWorking] = useState(true);

  async function retry() {
    setWorking(true);
    setError("");
    try {
      const response = await restoreSession();
      const next = destination();
      if (response.ok) {
        window.location.replace(next);
      } else if (response.status === 401 || response.status === 403) {
        window.location.replace(
          `/login?next=${encodeURIComponent(next)}`,
        );
      } else {
        setError("Não foi possível verificar sua sessão agora. Tente novamente.");
      }
    } catch {
      setError("Sem conexão com o Enturma. Verifique sua internet e tente novamente.");
    } finally {
      setWorking(false);
    }
  }

  useEffect(() => {
    const id = window.setTimeout(() => void retry(), 0);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <main className="auth-session-gate">
      <section className="auth-session-gate-card" aria-live="polite">
        <BookOpen size={42} aria-hidden="true" />
        <h1>Restaurando sua sessão</h1>
        <p>
          Estamos verificando seu acesso ao Enturma. Suas aulas e conversas
          permanecem protegidas enquanto isso.
        </p>
        {error ? <p role="alert">{error}</p> : null}
        {working ? (
          <p className="auth-session-gate-progress" role="status">
            <LoaderCircle className="auth-session-gate-spin" size={19} />
            Verificando sua conta…
          </p>
        ) : (
          <button type="button" className="button" onClick={() => void retry()}>
            <RefreshCw size={17} /> Tentar novamente
          </button>
        )}
        <Link href="/login">Entrar com outra conta</Link>
      </section>
    </main>
  );
}
