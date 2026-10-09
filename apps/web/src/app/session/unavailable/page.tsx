"use client";

import Link from "next/link";
import { BookOpen, RefreshCw } from "lucide-react";
import { authDestination } from "@/lib/auth-navigation";

export default function SessionUnavailable() {
  function retry() {
    const next = authDestination(
      new URLSearchParams(window.location.search).get("next"),
    );
    window.location.replace(next);
  }

  return (
    <main className="auth-session-gate">
      <section className="auth-session-gate-card">
        <BookOpen size={42} aria-hidden="true" />
        <h1>Estamos reconectando o Enturma</h1>
        <p>
          Não foi possível confirmar sua sessão neste momento. Seus dados de
          acesso foram preservados; você não precisa digitar a senha novamente
          por causa de uma instabilidade.
        </p>
        <button type="button" className="button" onClick={retry}>
          <RefreshCw size={17} /> Tentar novamente
        </button>
        <Link href="/login">Entrar com outra conta</Link>
      </section>
    </main>
  );
}
