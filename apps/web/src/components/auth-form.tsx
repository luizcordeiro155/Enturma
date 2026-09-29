"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookOpen, ArrowRight } from "lucide-react";
import { post } from "@/lib/api";
import { Feedback } from "./feedback";
type Mode =
  "login" | "register" | "forgot-password" | "reset-password" | "verify-email";
const titles: Record<Mode, string> = {
  login: "Bom te ver de novo.",
  register: "Encontre a sua turma.",
  "forgot-password": "Vamos recuperar seu acesso.",
  "reset-password": "Uma nova senha, um novo começo.",
  "verify-email": "Confirme seu e-mail.",
};
export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const token = new URLSearchParams(window.location.hash.slice(1)).get(
        "token",
      );
      await post(
        `/auth/${mode}`,
        mode === "verify-email"
          ? { token }
          : mode === "reset-password"
            ? { token, password: data.password }
            : mode === "forgot-password"
              ? data
              : { ...data, device: "Navegador web" },
      );
      if (mode === "login" || mode === "register")
        router.push(mode === "register" ? "/onboarding" : "/home");
      else
        setSuccess(
          mode === "forgot-password"
            ? "Se houver uma conta com este e-mail, enviaremos as instruções."
            : mode === "verify-email"
              ? "E-mail confirmado. Você já pode continuar."
              : "Senha atualizada. Entre novamente.",
        );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <section className="auth-story">
        <Link href="/" className="brand">
          <BookOpen size={40} />
          enturma.
        </Link>
        <div>
          <h1>
            Aprender fica
            <br />
            melhor junto.
          </h1>
          <p>
            Uma matéria em comum.
            <br />
            Uma conversa que ajuda.
            <br />
            Uma turma para chamar de sua.
          </p>
        </div>
        <span>Seu espaço de estudo e conexão.</span>
      </section>
      <main className="auth-main">
        <form onSubmit={submit}>
          <h1>{titles[mode]}</h1>
          <p className="muted">
            {mode === "register"
              ? "Comece sua jornada de estudo em companhia."
              : "Entre no seu espaço de estudo."}
          </p>
          <Feedback error={error} success={success} />
          {mode === "register" ? (
            <>
              <label>
                Seu nome
                <input
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={100}
                />
              </label>
              <label>
                Nome de usuário
                <input
                  name="username"
                  autoComplete="username"
                  maxLength={40}
                  autoCapitalize="none"
                  required
                  placeholder="Ex.: Cleitão ou Clton_junin"
                />
              </label>
            </>
          ) : null}
          {["login", "register", "forgot-password"].includes(mode) ? (
            <label>
              E-mail
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
              />
            </label>
          ) : null}
          {["login", "register", "reset-password"].includes(mode) ? (
            <label>
              Senha
              <input
                name="password"
                aria-label="Senha"
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
                minLength={mode === "login" ? 1 : 12}
                maxLength={72}
              />
              {mode !== "login" ? (
                <small>Use pelo menos 12 caracteres.</small>
              ) : null}
            </label>
          ) : null}
          <button disabled={busy} className="button wide" type="submit">
            {busy
              ? "Aguarde…"
              : mode === "login"
                ? "Entrar"
                : mode === "register"
                  ? "Criar conta"
                  : mode === "verify-email"
                    ? "Confirmar e-mail"
                    : "Continuar"}
            <ArrowRight size={18} />
          </button>
          {mode === "login" ? (
            <>
              <Link href="/forgot-password">Esqueci minha senha</Link>
              <p>
                Ainda não faz parte?{" "}
                <Link href="/register">Crie sua conta</Link>
              </p>
            </>
          ) : (
            <p>
              Já tem acesso? <Link href="/login">Entrar na minha conta</Link>
            </p>
          )}
        </form>
      </main>
    </div>
  );
}
