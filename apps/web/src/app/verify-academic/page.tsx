"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen } from "lucide-react";
import { post } from "@/lib/api";
import { announceAcademicChange } from "@/lib/academic-identity";
import { AcademicMotion } from "@/components/academic-motion";

export default function ConfirmAcademicPage() {
  const [state, setState] = useState<"waiting" | "approved" | "error">(
    "waiting",
  );
  const [error, setError] = useState("");
  const token = useRef("");
  const pending = useRef<Promise<unknown> | null>(null);
  const confirm = useCallback(async () => {
    if (!token.current) {
      setError(
        "O link está incompleto. Solicite uma nova confirmação no Enturma.",
      );
      setState("error");
      return;
    }
    setState("waiting");
    try {
      // StrictMode and repeated taps share a single disposable-token request.
      if (!pending.current)
        pending.current = post("/auth/academic/confirm", {
          token: token.current,
        });
      await pending.current;
      setState("approved");
      announceAcademicChange();
      history.replaceState(history.state, "", window.location.pathname);
    } catch (e) {
      pending.current = null;
      setError((e as Error).message);
      setState("error");
    }
  }, []);
  useEffect(() => {
    token.current ||=
      new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
    const timer = setTimeout(() => void confirm(), 0);
    return () => clearTimeout(timer);
  }, [confirm]);
  return (
    <main className="academic-page">
      <header className="academic-header">
        <Link href="/home" className="brand">
          <BookOpen /> enturma.
        </Link>
      </header>
      <section className="academic-panel academic-confirm">
        <AcademicMotion state={state === "approved" ? "approved" : "confirm"} />
        <div aria-live="polite">
          <h1 style={{ fontSize: 32 }}>
            {state === "approved"
              ? "E-mail acadêmico confirmado."
              : state === "waiting"
                ? "Confirmando seu endereço…"
                : "Vamos conferir esse link."}
          </h1>
          {state === "approved" ? (
            <>
              <p>
                Você pode voltar ao Enturma no dispositivo em que iniciou o
                cadastro. A tela de verificação será atualizada automaticamente.
              </p>
              <Link
                className="button academic-primary"
                href="/academic-verification?next=%2Fonboarding"
              >
                Continuar neste dispositivo <ArrowRight size={18} />
              </Link>
              <p className="academic-note">
                A confirmação comprova a posse do endereço acadêmico autorizado,
                sem atestar matrícula ativa.
              </p>
            </>
          ) : state === "error" ? (
            <>
              <p role="alert">{error}</p>
              <button
                className="button academic-primary"
                onClick={() => void confirm()}
              >
                Tentar novamente
              </button>
              <Link
                className="academic-text-button"
                href="/academic-verification"
              >
                Solicitar outro link
              </Link>
            </>
          ) : (
            <p>Aguarde a resposta do servidor. Não feche esta tela.</p>
          )}
        </div>
      </section>
    </main>
  );
}
