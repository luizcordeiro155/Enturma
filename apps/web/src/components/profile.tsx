"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Profile } from "@enturma/contracts";
import { api, post, peekApiSnapshot } from "@/lib/api";
import {
  BellRing,
  BookOpen,
  LockKeyhole,
  LogOut,
  MailCheck,
  MonitorSmartphone,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  X,
} from "lucide-react";
import { SettingsNav, SettingsSection, type SettingsSectionItem } from "./settings-sections";
import { Shell } from "./shell";
import { ProfileDetailsEditor } from "./profile-details-editor";
import { Feedback } from "./feedback";
import { AppUpdateSettingsCard } from "./desktop-updates";
import { ReleaseNotesList } from "./desktop-release-notes";
import { RELEASE_NOTES_DATE } from "@/lib/release-notes";

import { NotificationPreferences } from "./community-feedback";
import { FocusModeSettings } from "./focus-mode";
import { AppHelp } from "./app-help";
import { AccountPrivacyCard } from "./account-privacy-card";
import { useVisitor } from "@/lib/visitor-context";

const SETTINGS_SECTIONS: SettingsSectionItem[] = [
  { id: "conta", label: "Conta", icon: UserRound },
  { id: "materias", label: "Matérias", icon: BookOpen },
  { id: "estudo", label: "Estudo e foco", icon: Target },
  { id: "notificacoes", label: "Notificações", icon: BellRing },
  { id: "ajuda", label: "Ajuda e app", icon: Sparkles },
  { id: "seguranca", label: "Segurança", icon: ShieldCheck },
  { id: "privacidade", label: "Privacidade", icon: LockKeyhole },
];
export function ProfileView({
  subjectsOnly = false,
  settings = false,
  visitor = false,
}: {
  subjectsOnly?: boolean;
  settings?: boolean;
  visitor?: boolean;
}) {
  const guest = useVisitor();
  const router = useRouter();
  const [p, setP] = useState<Profile | undefined>(() =>
    visitor ? undefined : peekApiSnapshot<Profile>("/users/me"),
  );
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
    if (visitor) return;
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
  }, [settings, visitor]);

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
    if (visitor) return;
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
  }, [loadProfile, visitor]);

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

  async function resendVerification() {
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
  }

  const signOut = async () => {
                    try {
                      try {
                        const bridge = window.EnturmaNative as
                          | (typeof window.EnturmaNative & {
                              getPushRegistration?: () => string;
                              clearPushToken?: () => void;
                            })
                          | undefined;
                        const raw = bridge?.getPushRegistration?.();
                        const installationId = raw
                          ? String(JSON.parse(raw).installationId || "")
                          : "";
                        if (installationId) {
                          await api(
                            `/notifications/push-device/${encodeURIComponent(installationId)}`,
                            { method: "DELETE" },
                          ).catch(() => {});
                        }
                        localStorage.removeItem("enturma-push-registration-v1");
                        bridge?.clearPushToken?.();
                      } catch {}
                      await post("/auth/logout");
                      router.push("/login");
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  };

  return (
    <Shell visitor={visitor}>
      <div
        className={
          subjectsOnly
            ? "narrow"
            : `profile-page${settings ? " settings-page" : " profile-customization-page"}`
        }
      >
        <div className="profile-page-heading">
          {settings ? <span className="settings-kicker">Sua conta</span> : null}
          <h1>
            {subjectsOnly
              ? "Minhas matérias"
              : settings
                ? "Configurações"
                : "Meu perfil"}
          </h1>
          {settings ? (
            <p className="settings-lede">
              Conta, matérias, notificações, segurança e privacidade em um só
              lugar.
            </p>
          ) : null}
        </div>
        <Feedback error={error} success={notice} />
        {visitor && settings && (
          <>
            <p>
              Ajuste a aparência neste navegador pelo controle de tema e
              acessibilidade. Entre para gerenciar sua conta e sincronizar
              preferências.
            </p>
            <button onClick={() => guest.requestLogin("/settings")}>
              Entrar para gerenciar minha conta
            </button>
            <AppHelp />
            <NotificationPreferences />
            <h2 className="section-heading">Sessões ativas</h2>
            <p>Seus dispositivos conectados aparecem aqui depois de entrar.</p>
            <button
              className="secondary"
              onClick={() => guest.requestLogin("/settings")}
            >
              Gerenciar dispositivos
            </button>
            <AccountPrivacyCard />
          </>
        )}

        {p && settings ? (
          <div className="settings-layout">
            <SettingsNav items={SETTINGS_SECTIONS} />
            <div className="settings-sections">
              <SettingsSection
                id="conta"
                icon={UserRound}
                title="Conta"
                description="Quem você é no Enturma e o seu vínculo acadêmico."
                index={0}
              >
                <div className="settings-account">
                  <div className="settings-account-identity">
                    <span className="settings-avatar" aria-hidden="true">
                      {(p.name || p.username || "?").trim().charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <strong>{p.name}</strong>
                      <span>@{p.username}</span>
                    </div>
                  </div>
                  <dl className="settings-facts">
                    <div>
                      <dt>E-mail</dt>
                      <dd>
                        <span className="settings-email">{p.email}</span>
                        <span
                          className={`settings-badge ${p.emailVerified ? "is-ok" : "is-pending"}`}
                        >
                          {p.emailVerified ? "Confirmado" : "Confirmação pendente"}
                        </span>
                        {!p.emailVerified ? (
                          <button
                            type="button"
                            className="button secondary compact"
                            disabled={verificationBusy}
                            onClick={resendVerification}
                          >
                            {verificationBusy ? "Enviando…" : "Reenviar confirmação"}
                          </button>
                        ) : null}
                      </dd>
                    </div>
                    <div>
                      <dt>Período</dt>
                      <dd>
                        {p.enrollment?.periodName ??
                          "Perfil acadêmico ainda não preenchido"}
                      </dd>
                    </div>
                  </dl>
                  <Link href="/onboarding" className="button secondary settings-inline-action">
                    <Settings2 size={16} aria-hidden="true" />
                    Atualizar perfil acadêmico
                  </Link>
                </div>
              </SettingsSection>

              <SettingsSection
                id="materias"
                icon={BookOpen}
                title="Matérias"
                description={
                  p.subjects.length
                    ? `${p.subjects.length} ${p.subjects.length === 1 ? "matéria" : "matérias"} neste semestre.`
                    : "Escolha suas matérias no perfil acadêmico."
                }
                index={1}
              >
                {p.subjects.length ? (
                  <ul className="settings-subjects">
                    {p.subjects.map((s) => (
                      <li key={s.id}>
                        <div>
                          <h3>
                            <Link href={`/subjects/${s.id}`}>{s.name}</Link>
                          </h3>
                          <a href={s.sourceUrl} target="_blank" rel="noreferrer">
                            Fonte: {s.sourceName}
                          </a>
                        </div>
                        <Link
                          className="button compact"
                          href="/rooms/new"
                          aria-label={`Estudar ${s.name}`}
                        >
                          Estudar
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="settings-empty">Nenhuma matéria selecionada.</p>
                )}
              </SettingsSection>

              <SettingsSection
                id="estudo"
                icon={Target}
                title="Estudo e foco"
                bare
                index={2}
              >
                <FocusModeSettings />
              </SettingsSection>

              <SettingsSection
                id="notificacoes"
                icon={BellRing}
                title="Notificações"
                bare
                index={3}
              >
                <NotificationPreferences />
              </SettingsSection>

              <SettingsSection
                id="ajuda"
                icon={Sparkles}
                title="Ajuda e app"
                bare
                index={4}
              >
                <AppHelp />
                <AppUpdateSettingsCard />
                <details className="settings-release-notes">
                  <summary>
                    <Sparkles size={17} aria-hidden="true" />
                    <span>
                      <strong>Novidades do Enturma</strong>
                      <small>Atualizado em {RELEASE_NOTES_DATE}</small>
                    </span>
                  </summary>
                  <ReleaseNotesList />
                </details>
              </SettingsSection>

              <SettingsSection
                id="seguranca"
                icon={ShieldCheck}
                title="Segurança"
                description="Aparelhos conectados à sua conta e a sua senha."
                index={5}
              >
                {sessions.length ? (
                  <ul className="settings-sessions">
                    {sessions.map((s) => (
                      <li key={s.id}>
                        <span className="settings-session-icon" aria-hidden="true">
                          <MonitorSmartphone size={18} />
                        </span>
                        <div>
                          <strong>{s.device}</strong>
                          <small>
                            Desde {new Date(s.createdAt).toLocaleString("pt-BR")}
                          </small>
                        </div>
                        <button
                          type="button"
                          className="secondary compact"
                          onClick={() => revoke(s.id)}
                          aria-label={`Revogar ${s.device}`}
                        >
                          Revogar
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="settings-empty">Nenhum outro aparelho conectado.</p>
                )}
                <Link href="/forgot-password" className="button secondary settings-inline-action">
                  <LockKeyhole size={16} aria-hidden="true" />
                  Redefinir minha senha
                </Link>
              </SettingsSection>

              <SettingsSection
                id="privacidade-secao"
                icon={LockKeyhole}
                title="Privacidade"
                bare
                index={6}
              >
                <AccountPrivacyCard />
              </SettingsSection>

              <footer className="settings-footer">
                <button type="button" className="button settings-signout" onClick={signOut}>
                  <LogOut size={17} aria-hidden="true" />
                  Sair da conta
                </button>
                {["ADMIN", "SUPER_ADMIN"].includes(p.role) ? (
                  <Link href="/admin" className="settings-admin-link">
                    Administrar catálogo
                  </Link>
                ) : null}
              </footer>
            </div>
          </div>
        ) : null}

        {p && !settings ? (
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
                      onClick={resendVerification}
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
