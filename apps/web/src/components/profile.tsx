"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Profile } from "@enturma/contracts";
import { api, post } from "@/lib/api";
import { Shell } from "./shell";
import { ProfileDetailsEditor } from "./profile-details-editor";
import { Feedback } from "./feedback";

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

  async function loadProfile() {
    setP(await api<Profile>("/users/me"));
  }

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
        <h1>
          {subjectsOnly
            ? "Minhas matérias"
            : settings
              ? "Configurações"
              : "Meu perfil"}
        </h1>
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
                          setNotice(
                            "Enviamos um novo link de confirmação para seu e-mail. Verifique também a caixa de spam.",
                          );
                        } catch (e) {
                          setError((e as Error).message);
                        } finally {
                          setVerificationBusy(false);
                        }
                      }}
                    >
                      {verificationBusy
                        ? "Enviando…"
                        : "Reenviar confirmação"}
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
      </div>
    </Shell>
  );
}
