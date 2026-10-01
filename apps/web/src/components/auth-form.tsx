"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BookOpen, ArrowRight, Check, KeyRound, MailCheck, ShieldCheck } from "lucide-react";
import { api, post } from "@/lib/api";
import { Feedback } from "./feedback";
type Mode =
  "login" | "register" | "forgot-password" | "reset-password" | "verify-email";
type RecoveryStarted = { trackingToken: string; expiresIn: number };
type RecoveryStatus = {
  status: "PENDING" | "COMPLETED" | "EXPIRED";
  remainingSeconds: number;
};

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
  const [completed, setCompleted] = useState<"verify" | "reset" | null>(null);
  const [redirectSeconds, setRedirectSeconds] = useState(15);
  const [recoveryWaitingUntil, setRecoveryWaitingUntil] = useState<number | null>(null);
  const [recoveryTrackingToken, setRecoveryTrackingToken] = useState<string | null>(null);
  const [recoveryNow, setRecoveryNow] = useState(() => Date.now());

  const finishRecoveryWaiting = useCallback(() => {
    sessionStorage.removeItem("enturma-password-recovery-tracking");
    sessionStorage.removeItem("enturma-password-recovery-expires");
    setRecoveryTrackingToken(null);
    setRecoveryWaitingUntil(null);
    setSuccess("Senha atualizada com sucesso.");
    setRedirectSeconds(15);
    setCompleted("reset");
  }, []);
  useEffect(() => {
    if (mode !== "reset-password") return;
    if (sessionStorage.getItem("enturma-password-reset-complete") !== "1") return;
    sessionStorage.removeItem("enturma-password-reset-complete");
    router.replace("/login");
  }, [mode, router]);

  useEffect(() => {
    if (!completed) return;
    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("enturma-account-status")
        : null;

    if (completed === "verify") {
      channel?.postMessage({ type: "email-verified", at: Date.now() });
      localStorage.setItem("enturma-email-verified-at", String(Date.now()));
    }
    if (completed === "reset") {
      channel?.postMessage({ type: "password-reset", at: Date.now() });
      localStorage.setItem("enturma-password-reset-at", String(Date.now()));
    }

    const redirectSecondsForFlow = completed === "verify" ? 5 : 15;
    setRedirectSeconds(redirectSecondsForFlow);
    const interval = window.setInterval(() => {
      setRedirectSeconds((value) => Math.max(0, value - 1));
    }, 1000);
    const timeout = window.setTimeout(() => {
      router.replace(completed === "verify" ? "/profile" : "/login");
    }, redirectSecondsForFlow * 1000);

    return () => {
      channel?.close();
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [completed, router]);

  useEffect(() => {
    if (!recoveryWaitingUntil) return;
    const interval = window.setInterval(() => {
      const now = Date.now();
      setRecoveryNow(now);
      if (now >= recoveryWaitingUntil) setRecoveryWaitingUntil(null);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [recoveryWaitingUntil]);

  useEffect(() => {
    if (mode !== "forgot-password") return;

    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("enturma-account-status")
        : null;

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "password-reset") finishRecoveryWaiting();
    };
    channel?.addEventListener("message", onMessage);

    const onStorage = (event: StorageEvent) => {
      if (event.key === "enturma-password-reset-at" && event.newValue) {
        finishRecoveryWaiting();
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      channel?.removeEventListener("message", onMessage);
      channel?.close();
      window.removeEventListener("storage", onStorage);
    };
  }, [finishRecoveryWaiting, mode]);

  useEffect(() => {
    if (mode !== "forgot-password" || !recoveryTrackingToken) return;
    let active = true;

    const checkServer = async () => {
      try {
        const status = await api<RecoveryStatus>(
          `/auth/recovery-status?trackingToken=${encodeURIComponent(recoveryTrackingToken)}`,
        );
        if (!active) return;
        if (status.status === "COMPLETED") {
          finishRecoveryWaiting();
          return;
        }
        if (status.status === "EXPIRED") {
          sessionStorage.removeItem("enturma-password-recovery-tracking");
          sessionStorage.removeItem("enturma-password-recovery-expires");
          setRecoveryTrackingToken(null);
          setRecoveryWaitingUntil(null);
          setSuccess("");
          setError("O link de recuperação expirou. Solicite um novo e-mail.");
          return;
        }
        const serverExpiresAt = Date.now() + status.remainingSeconds * 1000;
        setRecoveryWaitingUntil(serverExpiresAt);
      } catch {
        // Mantém a contagem local e tenta novamente no próximo ciclo.
      }
    };

    void checkServer();
    const poll = window.setInterval(checkServer, 1500);
    return () => {
      active = false;
      window.clearInterval(poll);
    };
  }, [finishRecoveryWaiting, mode, recoveryTrackingToken]);

  const recoveryRemaining = recoveryWaitingUntil
    ? Math.max(0, Math.ceil((recoveryWaitingUntil - recoveryNow) / 1000))
    : 0;
  const recoveryClock = `${String(Math.floor(recoveryRemaining / 60)).padStart(2, "0")}:${String(recoveryRemaining % 60).padStart(2, "0")}`;


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
      if (
        (mode === "register" || mode === "reset-password") &&
        data.password !== data.confirmPassword
      )
        throw Error("As senhas não coincidem.");

      const response = await post<RecoveryStarted | void>(
        `/auth/${mode}`,
        mode === "verify-email"
          ? { token }
          : mode === "reset-password"
            ? { token, password: data.password }
            : mode === "forgot-password"
              ? { email: data.email }
              : mode === "register"
                ? {
                    name: data.name,
                    username: data.username,
                    email: data.email,
                    password: data.password,
                    device: "Navegador web",
                  }
                : {
                    email: data.email,
                    password: data.password,
                    device: "Navegador web",
                  },
      );
      if (mode === "login" || mode === "register")
        router.push(mode === "register" ? "/onboarding" : "/home");
      else if (mode === "verify-email") {
        setSuccess("E-mail confirmado com sucesso.");
        setCompleted("verify");
      } else if (mode === "reset-password") {
        sessionStorage.setItem("enturma-password-reset-complete", "1");
        window.history.replaceState(null, "", "/reset-password");
        setSuccess("Senha atualizada com sucesso.");
        setRedirectSeconds(15);
        setCompleted("reset");
      } else {
        const recovery = response as RecoveryStarted;
        const expiresAt =
          Date.now() + Math.max(1, recovery.expiresIn ?? 1800) * 1000;
        sessionStorage.setItem(
          "enturma-password-recovery-tracking",
          recovery.trackingToken,
        );
        sessionStorage.setItem(
          "enturma-password-recovery-expires",
          String(expiresAt),
        );
        setRecoveryTrackingToken(recovery.trackingToken);
        setSuccess(
          "Se houver uma conta com este e-mail, enviaremos as instruções.",
        );
        setRecoveryNow(Date.now());
        setRecoveryWaitingUntil(expiresAt);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (recoveryWaitingUntil) {
    return (
      <div className="auth-layout">
        <section className="auth-story">
          <Link href="/" className="brand">
            <BookOpen size={40} />
            enturma.
          </Link>
          <div>
            <h1>Verifique seu e-mail.</h1>
            <p>
              Enviamos um link seguro para redefinir sua senha.
            </p>
          </div>
          <span>O link expira em 30 minutos.</span>
        </section>
        <main className="auth-main auth-success-main">
          <section className="auth-success-card recovery-wait-card" role="status" aria-live="polite">
            <div className="auth-success-animation" aria-hidden="true">
              <span className="auth-success-orbit orbit-one" />
              <span className="auth-success-orbit orbit-two" />
              <span className="auth-success-check">
                <MailCheck size={48} />
              </span>
            </div>
            <div className="auth-success-copy">
              <span className="auth-success-kicker">
                <Check size={16} />
                E-mail enviado
              </span>
              <h1>Aguardando você abrir o link</h1>
              <p>
                Abra o e-mail de recuperação e siga o link para criar uma nova senha.
                Por segurança, o link só funciona durante 30 minutos.
              </p>
              <div className="verification-countdown" aria-live="polite">
                <strong>{recoveryClock}</strong>
                <span>tempo restante do link</span>
              </div>
              <div className="verification-wait-progress" aria-hidden="true">
                <span
                  style={{
                    width: `${Math.max(0, Math.min(100, (recoveryRemaining / 1800) * 100))}%`,
                  }}
                />
              </div>
              <button
                type="button"
                className="button secondary wide"
                onClick={() => {
                  setRecoveryWaitingUntil(null);
                  router.replace("/login");
                }}
              >
                Cancelar e voltar ao login
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (completed) {
    const verified = completed === "verify";
    return (
      <div className="auth-layout">
        <section className="auth-story">
          <Link href="/" className="brand">
            <BookOpen size={40} />
            enturma.
          </Link>
          <div>
            <h1>
              {verified ? "E-mail confirmado." : "Senha alterada."}
            </h1>
            <p>
              {verified
                ? "Sua conta agora está verificada e o perfil será atualizado automaticamente."
                : "Sua nova senha já está ativa e você pode entrar novamente com segurança."}
            </p>
          </div>
          <span>Seu espaço de estudo e conexão.</span>
        </section>
        <main className="auth-main auth-success-main">
          <section className="auth-success-card" role="status" aria-live="polite">
            <div className="auth-success-animation" aria-hidden="true">
              <span className="auth-success-orbit orbit-one" />
              <span className="auth-success-orbit orbit-two" />
              <span className="auth-success-check">
                {verified ? <MailCheck size={48} /> : <KeyRound size={48} />}
              </span>
              <span className="auth-success-spark spark-one" />
              <span className="auth-success-spark spark-two" />
              <span className="auth-success-spark spark-three" />
            </div>
            <div className="auth-success-copy">
              <span className="auth-success-kicker">
                <Check size={16} />
                Tudo certo
              </span>
              <h1>{verified ? "Seu e-mail foi confirmado!" : "Sua senha foi alterada!"}</h1>
              <p>
                {verified
                  ? "O status da sua conta foi atualizado. Se o seu perfil estiver aberto em outra aba, ele também será atualizado automaticamente."
                  : "Por segurança, todas as sessões foram encerradas. Você será enviado para o login e precisará entrar novamente em todos os dispositivos."}
              </p>
              {!verified ? (
                <div className="auth-security-note">
                  <ShieldCheck size={20} />
                  <span>
                    Todas as sessões anteriores foram revogadas para proteger sua conta.
                  </span>
                </div>
              ) : null}
              <div className="auth-redirect-progress" aria-hidden="true">
                <span
                  style={{
                    animationDuration: verified ? "5s" : "15s",
                  }}
                />
              </div>
              <small>
                Redirecionando em {redirectSeconds}s…
              </small>
              <button
                type="button"
                className="button wide"
                onClick={() =>
                  router.replace(verified ? "/profile" : "/login")
                }
              >
                {verified ? "Ir para meu perfil" : "Ir para o login"}
                <ArrowRight size={18} />
              </button>
            </div>
          </section>
        </main>
      </div>
    );
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
          {["register", "reset-password"].includes(mode) ? (
            <label>
              Confirmar senha
              <input
                name="confirmPassword"
                aria-label="Confirmar senha"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={72}
              />
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
