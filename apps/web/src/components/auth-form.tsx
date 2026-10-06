"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  ArrowRight,
  Check,
  KeyRound,
  MailCheck,
  ShieldCheck,
  UserRoundX,
  LogIn,
  MonitorCog,
  Moon,
  Sun,
} from "lucide-react";
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

type AuthTheme = "LIGHT" | "DARK" | "SYSTEM";

function AuthThemeControl() {
  const [theme, setTheme] = useState<AuthTheme>("SYSTEM");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cachedTheme: AuthTheme = "SYSTEM";
    try {
      const cached = JSON.parse(
        localStorage.getItem("enturma-experience") || "{}",
      ) as { theme?: string };
      if (cached.theme === "LIGHT" || cached.theme === "DARK") {
        cachedTheme = cached.theme;
      }
    } catch {}
    queueMicrotask(() => {
      setTheme(cachedTheme);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme =
        theme === "SYSTEM"
          ? system.matches
            ? "dark"
            : "light"
          : theme.toLowerCase();
    };
    apply();
    if (theme !== "SYSTEM") return;
    system.addEventListener("change", apply);
    return () => system.removeEventListener("change", apply);
  }, [ready, theme]);

  function choose(nextTheme: AuthTheme) {
    setTheme(nextTheme);
    try {
      const cached = JSON.parse(
        localStorage.getItem("enturma-experience") || "{}",
      ) as Record<string, unknown>;
      const next = { ...cached, theme: nextTheme };
      const serialized = JSON.stringify(next);
      localStorage.setItem("enturma-experience", serialized);
      localStorage.setItem("enturma-experience-pending", serialized);
    } catch {}
  }

  return (
    <div
      className="auth-theme-control"
      role="group"
      aria-label="Tema da interface"
    >
      <button
        type="button"
        className="auth-theme-option"
        aria-pressed={theme === "LIGHT"}
        onClick={() => choose("LIGHT")}
        title="Usar tema claro"
      >
        <Sun size={16} />
        <span>Claro</span>
      </button>
      <button
        type="button"
        className="auth-theme-option"
        aria-pressed={theme === "DARK"}
        onClick={() => choose("DARK")}
        title="Usar tema escuro"
      >
        <Moon size={16} />
        <span>Escuro</span>
      </button>
      <button
        type="button"
        className="auth-theme-option"
        aria-pressed={theme === "SYSTEM"}
        onClick={() => choose("SYSTEM")}
        title="Seguir o tema do sistema"
      >
        <MonitorCog size={16} />
        <span>Sistema</span>
      </button>
    </div>
  );
}

function AuthStoryHeader() {
  return (
    <header className="auth-story-top">
      <Link href="/" className="brand">
        <BookOpen size={40} />
        enturma.
      </Link>
      <AuthThemeControl />
    </header>
  );
}
export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [completed, setCompleted] = useState<"verify" | "reset" | null>(null);
  const [redirectSeconds, setRedirectSeconds] = useState(15);
  const [recoveryWaitingUntil, setRecoveryWaitingUntil] = useState<
    number | null
  >(null);
  const [recoveryTrackingToken, setRecoveryTrackingToken] = useState<
    string | null
  >(null);
  const [recoveryNow, setRecoveryNow] = useState(() => Date.now());
  const [accountState, setAccountState] = useState<
    "email-exists" | "email-missing" | null
  >(null);
  const [accountRedirectSeconds, setAccountRedirectSeconds] = useState(10);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [rememberConnected, setRememberConnected] = useState(() => {
    if (mode !== "login" || typeof window === "undefined") return true;
    try {
      return localStorage.getItem("enturma-remember-login") !== "0";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!busy || mode !== "login") return;
    const reduced =
      document.documentElement.dataset.reducedMotion === "true" ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
    if (reduced) return;
    const animations: Animation[] = [];
    const orbit = document.querySelector<HTMLElement>(".auth-login-progress-orbit");
    const core = document.querySelector<HTMLElement>(".auth-login-progress-core");
    const dots = document.querySelectorAll<HTMLElement>(".auth-login-progress-dot");
    if (orbit && typeof orbit.animate === "function")
      animations.push(
        orbit.animate(
          [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
          { duration: 1400, iterations: Infinity, easing: "linear" },
        ),
      );
    if (core && typeof core.animate === "function")
      animations.push(
        core.animate(
          [
            { transform: "scale(.94)", opacity: 0.72 },
            { transform: "scale(1.05)", opacity: 1 },
            { transform: "scale(.94)", opacity: 0.72 },
          ],
          { duration: 1200, iterations: Infinity, easing: "ease-in-out" },
        ),
      );
    dots.forEach((dot, index) => {
      if (typeof dot.animate !== "function") return;
      animations.push(
        dot.animate(
          [
            { transform: "translateY(0)", opacity: 0.35 },
            { transform: "translateY(-7px)", opacity: 1 },
            { transform: "translateY(0)", opacity: 0.35 },
          ],
          {
            duration: 900,
            delay: index * 130,
            iterations: Infinity,
            easing: "ease-in-out",
          },
        ),
      );
    });
    return () => animations.forEach((animation) => animation.cancel());
  }, [busy, mode]);

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
    if (!accountState) return;
    queueMicrotask(() => setAccountRedirectSeconds(10));
    const tick = window.setInterval(() => {
      setAccountRedirectSeconds((value) => Math.max(0, value - 1));
    }, 1000);
    const destination =
      accountState === "email-exists" ? "/login" : "/register";
    const redirect = window.setTimeout(
      () => router.replace(destination),
      10000,
    );
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(redirect);
    };
  }, [accountState, router]);
  useEffect(() => {
    if (mode !== "reset-password") return;
    if (sessionStorage.getItem("enturma-password-reset-complete") !== "1")
      return;
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
    queueMicrotask(() => setRedirectSeconds(redirectSecondsForFlow));
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

  function validateAuthFields(data: Record<string, FormDataEntryValue>) {
    const errors: Record<string, string> = {};
    const name = String(data.name ?? "").trim();
    const username = String(data.username ?? "").trim();
    const email = String(data.email ?? "").trim();
    const password = String(data.password ?? "");
    const confirmPassword = String(data.confirmPassword ?? "");

    if (mode === "register") {
      if (!name) errors.name = "Informe seu nome para criar a conta.";
      if (!username) errors.username = "Escolha um nome de usuário.";
      else if (!/^[\p{L}\p{M}\p{N}_]{1,40}$/u.test(username))
        errors.username =
          "Use até 40 letras, números ou _. Espaços e símbolos não são aceitos.";
    }

    if (["login", "register", "forgot-password"].includes(mode)) {
      if (!email) errors.email = "Informe seu e-mail.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        errors.email =
          "Digite um e-mail válido, por exemplo nome@provedor.com.";
    }

    if (["login", "register", "reset-password"].includes(mode)) {
      if (!password) errors.password = "Informe sua senha.";
      else if (mode !== "login" && password.length < 12)
        errors.password = "A senha precisa ter pelo menos 12 caracteres.";
    }

    if (["register", "reset-password"].includes(mode)) {
      if (!confirmPassword)
        errors.confirmPassword = "Confirme a senha digitada acima.";
      else if (password !== confirmPassword) {
        errors.password =
          "Confira a senha: os dois campos precisam ser iguais.";
        errors.confirmPassword = "A confirmação não corresponde à senha.";
      }
    }

    return errors;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    setFieldErrors({});
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const validationErrors = validateAuthFields(data);
    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors);
      setError("Revise os campos destacados em vermelho.");
      const firstField = Object.keys(validationErrors)[0];
      requestAnimationFrame(() => {
        document
          .querySelector<HTMLInputElement>(`input[name="${firstField}"]`)
          ?.focus();
      });
      setBusy(false);
      return;
    }

    try {
      const token = new URLSearchParams(window.location.hash.slice(1)).get(
        "token",
      );

      const payload =
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
                  };
      if (mode === "login") {
        try {
          localStorage.setItem(
            "enturma-remember-login",
            rememberConnected ? "1" : "0",
          );
        } catch {}
      }
      const response =
        mode === "login"
          ? await api<RecoveryStarted | void>(`/auth/${mode}`, {
              method: "POST",
              headers: {
                "X-Enturma-Remember": rememberConnected ? "1" : "0",
              },
              body: JSON.stringify(payload),
            })
          : await post<RecoveryStarted | void>(`/auth/${mode}`, payload);
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
      const message = (e as Error).message;
      if (
        mode === "register" &&
        message.includes("Já existe uma conta cadastrada com este e-mail")
      ) {
        setFieldErrors({
          email: "Este e-mail já está vinculado a uma conta do Enturma.",
        });
        setAccountState("email-exists");
        setError("");
      } else if (
        mode === "register" &&
        message.includes("Este nome de usuário já está em uso")
      ) {
        setFieldErrors({
          username: "Este nome de usuário já está sendo usado. Escolha outro.",
        });
        setError("Revise o campo destacado para concluir o cadastro.");
        requestAnimationFrame(() => {
          document
            .querySelector<HTMLInputElement>('input[name="username"]')
            ?.focus();
        });
      } else if (
        mode === "forgot-password" &&
        message.includes("Não encontramos uma conta cadastrada com este e-mail")
      ) {
        setFieldErrors({
          email: "Não existe uma conta cadastrada com este e-mail.",
        });
        setAccountState("email-missing");
        setError("");
      } else if (
        mode === "login" &&
        message.includes("Não encontramos uma conta cadastrada com este e-mail")
      ) {
        setFieldErrors({
          email: "Não encontramos nenhuma conta com este e-mail.",
        });
        setError("Confira o e-mail ou crie uma nova conta.");
        requestAnimationFrame(() => {
          document
            .querySelector<HTMLInputElement>('input[name="email"]')
            ?.focus();
        });
      } else if (
        mode === "login" &&
        message.includes("A senha informada está incorreta")
      ) {
        setFieldErrors({
          password: "Senha incorreta. Tente novamente ou recupere sua senha.",
        });
        setError("A senha informada não corresponde a esta conta.");
        requestAnimationFrame(() => {
          const password = document.querySelector<HTMLInputElement>(
            'input[name="password"]',
          );
          password?.focus();
          password?.select();
        });
      } else {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  }
  if (accountState) {
    const existing = accountState === "email-exists";
    const destination = existing ? "/login" : "/register";
    return (
      <div className="auth-layout">
        <section className="auth-story">
          <AuthStoryHeader />
          <div>
            <h1>
              {existing ? "Você já faz parte." : "Vamos criar sua conta."}
            </h1>
            <p>
              {existing
                ? "Encontramos uma conta vinculada a este e-mail."
                : "Este e-mail ainda não possui uma conta no Enturma."}
            </p>
          </div>
          <footer className="auth-story-footer">
          <span>Seu espaço de estudo e conexão.</span>
          <nav aria-label="Informações legais">
            <Link href="/privacidade">Política de Privacidade</Link>
            <span aria-hidden="true">•</span>
            <Link href="/termos">Termos de Uso</Link>
          </nav>
        </footer>
        </section>
        <main className="auth-main auth-success-main">
          <section
            className="auth-success-card account-state-card"
            role="status"
            aria-live="polite"
          >
            <div className="account-state-animation" aria-hidden="true">
              <span className="account-state-orbit orbit-one" />
              <span className="account-state-orbit orbit-two" />
              <span className="account-state-core">
                {existing ? <LogIn size={48} /> : <UserRoundX size={48} />}
              </span>
              <span className="account-state-pulse pulse-one" />
              <span className="account-state-pulse pulse-two" />
              <span className="account-state-pulse pulse-three" />
            </div>

            <div className="auth-success-copy">
              <span className="auth-success-kicker">
                <Check size={16} />
                {existing ? "Conta encontrada" : "E-mail disponível"}
              </span>
              <h1>
                {existing
                  ? "Este e-mail já possui uma conta"
                  : "Não encontramos uma conta com este e-mail"}
              </h1>
              <p>
                {existing
                  ? "Você não precisa criar outra conta. Entre com sua senha ou use a recuperação de senha caso não se lembre dela."
                  : "Você pode criar sua conta agora e começar a usar o Enturma."}
              </p>

              <div
                className="auth-redirect-progress account-state-progress"
                aria-hidden="true"
              >
                <span style={{ animationDuration: "10s" }} />
              </div>
              <small>Redirecionando em {accountRedirectSeconds}s…</small>

              <div className="account-state-actions">
                <button
                  type="button"
                  className="button wide"
                  onClick={() => router.replace(destination)}
                >
                  {existing ? "Ir para o login" : "Criar minha conta"}
                  <ArrowRight size={18} />
                </button>
                {existing ? (
                  <button
                    type="button"
                    className="button secondary wide"
                    onClick={() => router.replace("/forgot-password")}
                  >
                    Recuperar minha senha
                  </button>
                ) : (
                  <button
                    type="button"
                    className="button secondary wide"
                    onClick={() => {
                      setAccountState(null);
                      router.replace("/forgot-password");
                    }}
                  >
                    Tentar outro e-mail
                  </button>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (recoveryWaitingUntil) {
    return (
      <div className="auth-layout">
        <section className="auth-story">
          <AuthStoryHeader />
          <div>
            <h1>Verifique seu e-mail.</h1>
            <p>Enviamos um link seguro para redefinir sua senha.</p>
          </div>
          <span>O link expira em 30 minutos.</span>
        </section>
        <main className="auth-main auth-success-main">
          <section
            className="auth-success-card recovery-wait-card"
            role="status"
            aria-live="polite"
          >
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
                Abra o e-mail de recuperação e siga o link para criar uma nova
                senha. Por segurança, o link só funciona durante 30 minutos.
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
          <AuthStoryHeader />
          <div>
            <h1>{verified ? "E-mail confirmado." : "Senha alterada."}</h1>
            <p>
              {verified
                ? "Sua conta agora está verificada e o perfil será atualizado automaticamente."
                : "Sua nova senha já está ativa e você pode entrar novamente com segurança."}
            </p>
          </div>
          <footer className="auth-story-footer">
          <span>Seu espaço de estudo e conexão.</span>
          <nav aria-label="Informações legais">
            <Link href="/privacidade">Política de Privacidade</Link>
            <span aria-hidden="true">•</span>
            <Link href="/termos">Termos de Uso</Link>
          </nav>
        </footer>
        </section>
        <main className="auth-main auth-success-main">
          <section
            className="auth-success-card"
            role="status"
            aria-live="polite"
          >
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
              <h1>
                {verified
                  ? "Seu e-mail foi confirmado!"
                  : "Sua senha foi alterada!"}
              </h1>
              <p>
                {verified
                  ? "O status da sua conta foi atualizado. Se o seu perfil estiver aberto em outra aba, ele também será atualizado automaticamente."
                  : "Por segurança, todas as sessões foram encerradas. Você será enviado para o login e precisará entrar novamente em todos os dispositivos."}
              </p>
              {!verified ? (
                <div className="auth-security-note">
                  <ShieldCheck size={20} />
                  <span>
                    Todas as sessões anteriores foram revogadas para proteger
                    sua conta.
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
              <small>Redirecionando em {redirectSeconds}s…</small>
              <button
                type="button"
                className="button wide"
                onClick={() => router.replace(verified ? "/profile" : "/login")}
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
        <AuthStoryHeader />
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
        <footer className="auth-story-footer">
          <span>Seu espaço de estudo e conexão.</span>
          <nav aria-label="Informações legais">
            <Link href="/privacidade">Política de Privacidade</Link>
            <span aria-hidden="true">•</span>
            <Link href="/termos">Termos de Uso</Link>
          </nav>
        </footer>
      </section>
      <main className="auth-main">
        {busy && mode === "login" ? (
          <div
            className="auth-login-progress"
            role="status"
            aria-live="polite"
            aria-label="Entrando no Enturma"
          >
            <section className="auth-login-progress-card">
              <div className="auth-login-progress-animation" aria-hidden="true">
                <span className="auth-login-progress-orbit" />
                <span className="auth-login-progress-core">
                  <LogIn size={34} />
                </span>
              </div>
              <h2>Entrando no Enturma…</h2>
              <p>Estamos preparando sua conta e restaurando seu espaço de estudo.</p>
              <div className="auth-login-progress-dots" aria-hidden="true">
                <span className="auth-login-progress-dot" />
                <span className="auth-login-progress-dot" />
                <span className="auth-login-progress-dot" />
              </div>
              <small>
                {rememberConnected
                  ? "Este dispositivo continuará conectado."
                  : "A sessão termina quando você fechar o aplicativo."}
              </small>
            </section>
          </div>
        ) : null}
        <form onSubmit={submit} noValidate>
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
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? "name-error" : undefined}
                  className={
                    fieldErrors.name ? "auth-field-invalid" : undefined
                  }
                  required
                  maxLength={100}
                  onChange={() =>
                    setFieldErrors((current) => {
                      const next = { ...current };
                      delete next.name;
                      return next;
                    })
                  }
                />
                {fieldErrors.name ? (
                  <small
                    id="name-error"
                    className="auth-field-error"
                    role="alert"
                  >
                    {fieldErrors.name}
                  </small>
                ) : null}
              </label>
              <label>
                Nome de usuário
                <input
                  name="username"
                  autoComplete="username"
                  aria-invalid={Boolean(fieldErrors.username)}
                  aria-describedby={
                    fieldErrors.username ? "username-error" : undefined
                  }
                  className={
                    fieldErrors.username ? "auth-field-invalid" : undefined
                  }
                  maxLength={40}
                  autoCapitalize="none"
                  required
                  placeholder="Ex.: Cleitão ou Clton_junin"
                  onChange={() =>
                    setFieldErrors((current) => {
                      const next = { ...current };
                      delete next.username;
                      return next;
                    })
                  }
                />
                {fieldErrors.username ? (
                  <small
                    id="username-error"
                    className="auth-field-error"
                    role="alert"
                  >
                    {fieldErrors.username}
                  </small>
                ) : null}
              </label>
            </>
          ) : null}
          {["login", "register", "forgot-password"].includes(mode) ? (
            <label>
              E-mail
              <input
                name="email"
                type="email"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                className={fieldErrors.email ? "auth-field-invalid" : undefined}
                autoComplete="email"
                required
                maxLength={254}
                onChange={() =>
                  setFieldErrors((current) => {
                    const next = { ...current };
                    delete next.email;
                    return next;
                  })
                }
              />
              {fieldErrors.email ? (
                <small
                  id="email-error"
                  className="auth-field-error"
                  role="alert"
                >
                  {fieldErrors.email}
                </small>
              ) : null}
            </label>
          ) : null}
          {["login", "register", "reset-password"].includes(mode) ? (
            <label>
              Senha
              <input
                name="password"
                aria-label="Senha"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={
                  fieldErrors.password ? "password-error" : undefined
                }
                className={
                  fieldErrors.password ? "auth-field-invalid" : undefined
                }
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
                minLength={mode === "login" ? 1 : 12}
                maxLength={72}
                onChange={() =>
                  setFieldErrors((current) => {
                    const next = { ...current };
                    delete next.password;
                    return next;
                  })
                }
              />
              {fieldErrors.password ? (
                <small
                  id="password-error"
                  className="auth-field-error"
                  role="alert"
                >
                  {fieldErrors.password}
                </small>
              ) : mode !== "login" ? (
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
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                aria-describedby={
                  fieldErrors.confirmPassword
                    ? "confirm-password-error"
                    : undefined
                }
                className={
                  fieldErrors.confirmPassword ? "auth-field-invalid" : undefined
                }
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={72}
                onChange={() =>
                  setFieldErrors((current) => {
                    const next = { ...current };
                    delete next.confirmPassword;
                    return next;
                  })
                }
              />
              {fieldErrors.confirmPassword ? (
                <small
                  id="confirm-password-error"
                  className="auth-field-error"
                  role="alert"
                >
                  {fieldErrors.confirmPassword}
                </small>
              ) : null}
            </label>
          ) : null}
          {mode === "login" ? (
            <label className="auth-remember-toggle">
              <input
                type="checkbox"
                aria-label="Manter conectado"
                checked={rememberConnected}
                onChange={(event) => setRememberConnected(event.target.checked)}
              />
              <span>
                <strong>Manter conectado</strong>
                <small>
                  Mantenha sua sessão neste dispositivo para não precisar entrar
                  novamente toda vez que abrir o Enturma.
                </small>
              </span>
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
