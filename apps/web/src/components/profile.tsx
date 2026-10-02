"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Profile } from "@enturma/contracts";
import { api, post } from "@/lib/api";
import { MailCheck, X } from "lucide-react";
import { Shell } from "./shell";
import { ProfileDetailsEditor } from "./profile-details-editor";
import { Feedback } from "./feedback";
import { DesktopUpdateButton } from "./desktop-updates";

import { NotificationPreferences } from "./community-feedback";
export function ProfileView({
  subjectsOnly = false,
  settings = false,
}: {
  subjectsOnly?: boolean;
  settings?: boolean;
}) {
  const router = useRouter();
  const [p, setP] = useState<Profile>();
  const [sessions, setSessions] = useState<
    { id: string; device: string; createdAt: string }[]
  >([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [verificationBusy, setVerificationBusy] = useState(false);
  const [verificationWaitingUntil, setVerificationWaitingUntil] = useState<
    number | null
  >(null);
  const [verificationNow, setVerificationNow] = useState(() => Date.now());
  const [verificationConfirmed, setVerificationConfirmed] = useState(false);

  const loadProfile = useCallback(async () => {
    setP(await api<Profile>("/users/me"));
  }, []);

  useEffect(() => {
    let active = true;
    api<Profile>("/users/me")
      .then((profile) => {
        if (active) setP(profile);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    if (settings)
      api<typeof sessions>("/auth/sessions")
        .then((items) => {
          if (active) setSessions(items);
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    return () => {
      active = false;
    };
  }, [settings]);

  useEffect(() => {
    if (!verificationWaitingUntil) return;
    const tick = window.setInterval(() => {
      const now = Date.now();
      setVerificationNow(now);
      if (now >= verificationWaitingUntil) {
        setVerificationWaitingUntil(null);
        setNotice("O link de confirmação expirou. Solicite um novo e-mail.");
      }
    }, 1000);
    const poll = window.setInterval(() => {
      api<Profile>("/users/me")
        .then((profile) => {
          setP(profile);
          if (profile.emailVerified) {
            setVerificationConfirmed(true);
            setNotice("E-mail confirmado com sucesso.");
            setVerificationWaitingUntil(null);
          }
        })
        .catch(() => {});
    }, 5000);

    return () => {
      window.clearInterval(tick);
      window.clearInterval(poll);
    };
  }, [verificationWaitingUntil]);

  useEffect(() => {
    const refreshVerifiedProfile = () => {
      void loadProfile().then(() => {
        setVerificationConfirmed(true);
        setVerificationWaitingUntil(null);
        setNotice("E-mail confirmado com sucesso.");
      });
    };

    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("enturma-account-status")
        : null;
    channel?.addEventListener("message", (event) => {
      if (event.data?.type === "email-verified") refreshVerifiedProfile();
    });

    const onStorage = (event: StorageEvent) => {
      if (event.key === "enturma-email-verified-at") refreshVerifiedProfile();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      channel?.close();
      window.removeEventListener("storage", onStorage);
    };
  }, [loadProfile]);

  useEffect(() => {
    if (!verificationConfirmed) return;
    const timeout = window.setTimeout(
      () => setVerificationConfirmed(false),
      5000,
    );
    return () => window.clearTimeout(timeout);
  }, [verificationConfirmed]);

  const verificationRemaining = useMemo(() => {
    if (!verificationWaitingUntil) return 0;
    return Math.max(
      0,
      Math.ceil((verificationWaitingUntil - verificationNow) / 1000),
    );
  }, [verificationNow, verificationWaitingUntil]);

  const verificationClock = `${String(Math.floor(verificationRemaining / 60)).padStart(2, "0")}:${String(verificationRemaining % 60).padStart(2, "0")}`;

  async function revoke(id: string) {
    try {
      await api(`/auth/sessions/${id}`, { method: "DELETE" });
      setSessions((s) => s.filter((v) => v.id !== id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Shell>
      <div className={subjectsOnly ? "narrow" : "profile-page"}>
        <div className="profile-page-heading">
          <h1>
            {subjectsOnly
              ? "Minhas matérias"
              : settings
                ? "Configurações"
                : "Meu perfil"}
          </h1>
          {settings && <DesktopUpdateButton />}
        </div>
        <Feedback error={error} success={notice} />

        {p ? (
          <>
            {!subjectsOnly && !settings ? (
              <ProfileDetailsEditor
                key={p.id}
                profile={p}
                onSaved={loadProfile}
              />
            ) : null}

            {!subjectsOnly ? (
              <dl className="details profile-details">
                <dt>Usuário</dt>
                <dd>@{p.username}</dd>
                <dt>E-mail</dt>
                <dd>
                  <span className="profile-email-status">
                    {p.email} ·{" "}
                    {p.emailVerified ? "Confirmado" : "Confirmação pendente"}
                  </span>
                  {!p.emailVerified ? (
                    <button
                      type="button"
                      className="button secondary compact"
                      disabled={verificationBusy}
                      onClick={async () => {
                        setVerificationBusy(true);
                        setError("");
                        setNotice("");
                        try {
                          await post("/auth/resend-verification");
                          const expiresAt = Date.now() + 30 * 60 * 1000;
                          setVerificationNow(Date.now());
                          setVerificationWaitingUntil(expiresAt);
                          setNotice(
                            "Enviamos um novo link de confirmação para seu e-mail. Você tem 30 minutos para confirmar.",
                          );
                        } catch (e) {
                          setError((e as Error).message);
                        } finally {
                          setVerificationBusy(false);
                        }
                      }}
                    >
                      {verificationBusy ? "Enviando…" : "Reenviar confirmação"}
                    </button>
                  ) : null}
                </dd>
                <dt>Período</dt>
                <dd>
                  {p.enrollment?.periodName ??
                    "Perfil acadêmico ainda não preenchido"}
                </dd>
              </dl>
            ) : null}

            <Link href="/onboarding" className="button secondary">
              Atualizar perfil acadêmico
            </Link>

            <h2 className="section-heading">Suas matérias</h2>
            {p.subjects.length ? (
              p.subjects.map((s) => (
                <article className="room-row" key={s.id}>
                  <div>
                    <h3>
                      <Link href={`/subjects/${s.id}`}>{s.name}</Link>
                    </h3>
                    <a href={s.sourceUrl} target="_blank" rel="noreferrer">
                      Consultar fonte: {s.sourceName}
                    </a>
                  </div>
                  <Link className="button" href="/rooms/new">
                    Estudar
                  </Link>
                </article>
              ))
            ) : (
              <p>Nenhuma matéria selecionada.</p>
            )}

            {settings ? (
              <>
                <NotificationPreferences />
                <h2 className="section-heading">Sessões ativas</h2>
                {sessions.map((s) => (
                  <div className="room-row" key={s.id}>
                    <span>
                      {s.device}
                      <small>
                        {new Date(s.createdAt).toLocaleString("pt-BR")}
                      </small>
                    </span>
                    <button onClick={() => revoke(s.id)}>Revogar</button>
                  </div>
                ))}
                <Link href="/forgot-password">Redefinir minha senha</Link>
                <button
                  className="button"
                  onClick={async () => {
                    try {
                      await post("/auth/logout");
                      router.push("/login");
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  Sair da conta
                </button>
              </>
            ) : null}

            {["ADMIN", "SUPER_ADMIN"].includes(p.role) ? (
              <p>
                <Link href="/admin">Administrar catálogo</Link>
              </p>
            ) : null}
          </>
        ) : null}

        {verificationWaitingUntil ? (
          <div
            className="verification-wait-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="verification-wait-title"
          >
            <section className="verification-wait-card">
              <button
                type="button"
                className="verification-wait-close"
                aria-label="Fechar"
                onClick={() => setVerificationWaitingUntil(null)}
              >
                <X size={18} />
              </button>
              <div className="verification-wait-animation" aria-hidden="true">
                <span className="verification-mail-orbit orbit-a" />
                <span className="verification-mail-orbit orbit-b" />
                <span className="verification-mail-core">
                  <MailCheck size={44} />
                </span>
              </div>
              <span className="verification-wait-kicker">
                Aguardando confirmação
              </span>
              <h2 id="verification-wait-title">Confirme seu e-mail</h2>
              <p>
                Abra o e-mail que enviamos para <strong>{p?.email}</strong> e
                clique no link de confirmação. Esta tela atualizará sozinha
                assim que a confirmação for concluída.
              </p>
              <div className="verification-countdown" aria-live="polite">
                <strong>{verificationClock}</strong>
                <span>tempo restante do link</span>
              </div>
              <div className="verification-wait-progress" aria-hidden="true">
                <span
                  style={{
                    width: `${Math.max(0, Math.min(100, (verificationRemaining / 1800) * 100))}%`,
                  }}
                />
              </div>
              <div className="verification-wait-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setVerificationWaitingUntil(null)}
                >
                  Cancelar espera
                </button>
                <button
                  type="button"
                  className="button"
                  onClick={async () => {
                    try {
                      const profile = await api<Profile>("/users/me");
                      setP(profile);
                      if (profile.emailVerified) {
                        setVerificationConfirmed(true);
                        setVerificationWaitingUntil(null);
                        setNotice("E-mail confirmado com sucesso.");
                      } else {
                        setNotice("Ainda aguardando a confirmação do e-mail.");
                      }
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  Já confirmei
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {verificationConfirmed ? (
          <div
            className="verification-confirmed-toast"
            role="status"
            aria-live="polite"
          >
            <span className="verification-confirmed-icon">
              <MailCheck size={24} />
            </span>
            <div>
              <strong>E-mail confirmado!</strong>
              <small>Seu perfil foi atualizado automaticamente.</small>
            </div>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}
