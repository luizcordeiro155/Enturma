"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Profile } from "@enturma/contracts";
import { api, post } from "@/lib/api";
import { Shell } from "./shell";
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
  useEffect(() => {
    api<Profile>("/users/me")
      .then(setP)
      .catch((e) => setError(e.message));
    if (settings)
      api<typeof sessions>("/auth/sessions")
        .then(setSessions)
        .catch((e) => setError(e.message));
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
      <div className="narrow">
        <h1>
          {subjectsOnly
            ? "Minhas matérias"
            : settings
              ? "Configurações"
              : "Meu perfil"}
        </h1>
        <Feedback error={error} />
        {p ? (
          <>
            <p className="lead">{p.name}</p>
            {!subjectsOnly ? (
              <dl className="details">
                <dt>Usuário</dt>
                <dd>@{p.username}</dd>
                <dt>E-mail</dt>
                <dd>
                  {p.email} ·{" "}
                  {p.emailVerified ? "Confirmado" : "Confirmação pendente"}
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
