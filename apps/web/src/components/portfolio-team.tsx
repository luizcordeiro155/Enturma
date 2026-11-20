"use client";

import { useState } from "react";
import { Check, Clock, UserPlus, Users, X } from "lucide-react";
import { api } from "@/lib/api";
import type { Project } from "@/lib/portfolio-projects";
import {
  TEAM_STATUS,
  type PublicMember,
  type TeamInvitation,
  type TeamMember,
} from "@/lib/portfolio-team";
import "./portfolio-team.css";

type Friend = {
  userId: string;
  name: string;
  username?: string;
  status: string;
};

/**
 * The team of one of the student's own projects. A tagged friend only shows up to visitors
 * after accepting, so the list says where each invitation stands.
 */
export function ProjectTeam({
  projectId,
  number,
  saved,
  members,
  onChanged,
}: {
  projectId: string;
  number: number;
  /** The server only knows projects that were saved. */
  saved: boolean;
  members: TeamMember[];
  onChanged: () => void;
}) {
  const [friends, setFriends] = useState<Friend[]>();
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function pick() {
    setError("");
    setPicking((open) => !open);
    if (friends) return;
    try {
      const people = await api<Friend[]>("/friends", { cache: "no-store" });
      setFriends((people ?? []).filter((f) => f.status === "ACCEPTED"));
    } catch (cause) {
      setFriends([]);
      setError((cause as Error).message);
    }
  }
  async function run(key: string, path: string, init: RequestInit) {
    if (busy) return;
    setBusy(key);
    setError("");
    try {
      await api(path, init);
      setPicking(false);
      onChanged();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy("");
    }
  }

  const tagged = new Set(members.map((member) => member.userId));
  const free = (friends ?? []).filter(
    (friend) => friend.username && !tagged.has(friend.userId),
  );
  return (
    <div className="portfolio-team-members">
      <div className="portfolio-team-head">
        <strong>Quem fez com você</strong>
        {saved ? (
          <button
            type="button"
            className="secondary"
            aria-expanded={picking}
            onClick={() => void pick()}
          >
            <UserPlus size={15} aria-hidden="true" /> Marcar colega
          </button>
        ) : null}
      </div>
      {!saved ? (
        <p className="portfolio-team-note">
          Salve o portfólio para marcar quem fez este projeto com você.
        </p>
      ) : (
        <p className="portfolio-team-note">
          Só amigos do Enturma podem ser marcados. O nome aparece na página
          pública depois que a pessoa aceita, e a parte dela é ela quem escreve.
        </p>
      )}
      {error ? (
        <p className="portfolio-team-error" role="alert">
          {error}
        </p>
      ) : null}
      {picking ? (
        friends === undefined ? (
          <p role="status" className="portfolio-team-note">
            Buscando seus amigos…
          </p>
        ) : free.length ? (
          <ul className="portfolio-team-picker" aria-label="Amigos para marcar">
            {free.map((friend) => (
              <li key={friend.userId}>
                <span>
                  <strong>{friend.name}</strong>
                  <small>@{friend.username}</small>
                </span>
                <button
                  type="button"
                  className="secondary"
                  disabled={Boolean(busy)}
                  aria-label={`Marcar ${friend.name}`}
                  onClick={() =>
                    void run(
                      friend.userId,
                      `/portfolio/me/projects/${projectId}/members`,
                      {
                        method: "POST",
                        body: JSON.stringify({ username: friend.username }),
                      },
                    )
                  }
                >
                  {busy === friend.userId ? "Marcando…" : "Marcar"}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="portfolio-team-note">
            {friends.length
              ? "Todos os seus amigos já foram marcados neste projeto."
              : "Você ainda não tem amigos no Enturma para marcar."}
          </p>
        )
      ) : null}
      {members.length ? (
        <ul
          className="portfolio-team-list"
          aria-label={`Equipe do projeto ${number}`}
        >
          {members.map((member) => (
            <li key={member.userId} data-status={member.status}>
              <span className="portfolio-team-person">
                <strong>{member.name}</strong>
                {member.contribution ? (
                  <span>{member.contribution}</span>
                ) : null}
              </span>
              <span className="portfolio-team-status">
                {member.status === "ACCEPTED" ? (
                  <Check size={14} aria-hidden="true" />
                ) : member.status === "PENDING" ? (
                  <Clock size={14} aria-hidden="true" />
                ) : (
                  <X size={14} aria-hidden="true" />
                )}
                {TEAM_STATUS[member.status]}
              </span>
              <button
                type="button"
                className="text-button"
                disabled={Boolean(busy)}
                aria-label={`Tirar ${member.name} da equipe`}
                onClick={() =>
                  void run(
                    member.userId,
                    `/portfolio/me/projects/${projectId}/members/${member.userId}`,
                    { method: "DELETE" },
                  )
                }
              >
                Tirar
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Projects other students tagged this one in. Accepting is the student's call, in their own
 * words; after that the project can come into their portfolio as the team's work.
 */
export function TeamInvitations({
  invitations,
  onChanged,
  onIncluded,
}: {
  invitations: TeamInvitation[];
  onChanged: () => void;
  onIncluded: (project: Project) => void;
}) {
  const [parts, setParts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [leaving, setLeaving] = useState("");
  const [error, setError] = useState("");
  if (!invitations.length) return null;

  async function run<T>(key: string, path: string, init: RequestInit) {
    if (busy) return undefined;
    setBusy(key);
    setError("");
    try {
      const result = await api<T>(path, init);
      return { result };
    } catch (cause) {
      setError((cause as Error).message);
      return undefined;
    } finally {
      setBusy("");
    }
  }

  return (
    <section
      id="equipe"
      className="portfolio-project-editor portfolio-team-invitations"
      aria-labelledby="portfolio-team-title"
    >
      <div className="section-heading">
        <div>
          <h2 id="portfolio-team-title">Projetos em equipe</h2>
          <p className="muted">
            Projetos de colegas que marcaram você. Seu nome só aparece no
            portfólio deles depois que você aceitar.
          </p>
        </div>
      </div>
      {error ? (
        <p className="portfolio-team-error" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="portfolio-team-cards">
        {invitations.map((item) => {
          const key = `${item.ownerId}/${item.projectId}`;
          const path = `/portfolio/team/${item.ownerId}/${item.projectId}`;
          const part = parts[key] ?? item.contribution;
          const answer = (status: "ACCEPTED" | "DECLINED") =>
            run(key, path, {
              method: "PUT",
              body: JSON.stringify({
                status,
                contribution: status === "ACCEPTED" ? part.trim() : "",
              }),
            }).then((done) => {
              if (done) onChanged();
            });
          return (
            <li key={key} data-status={item.status}>
              <div className="portfolio-team-card-head">
                <Users size={18} aria-hidden="true" />
                <div>
                  <strong>{item.projectName}</strong>
                  <span>
                    {item.status === "PENDING"
                      ? `${item.ownerName} marcou você neste projeto.`
                      : `Você está na equipe de ${item.ownerName}.`}
                  </span>
                </div>
              </div>
              {item.projectDescription ? (
                <p className="portfolio-team-about">
                  {item.projectDescription}
                </p>
              ) : null}
              <label className="portfolio-field">
                <span>
                  Minha participação
                  <small aria-hidden="true">{part.length}/300</small>
                </span>
                <textarea
                  aria-label={`Minha participação em ${item.projectName}`}
                  value={part}
                  maxLength={300}
                  rows={2}
                  placeholder="O que você fez neste projeto, nas suas palavras."
                  onChange={(e) =>
                    setParts((all) => ({ ...all, [key]: e.target.value }))
                  }
                />
              </label>
              <div className="portfolio-team-actions">
                {item.status === "PENDING" ? (
                  <>
                    <button
                      type="button"
                      disabled={Boolean(busy)}
                      aria-label={`Aceitar e entrar na equipe de ${item.projectName}`}
                      onClick={() => void answer("ACCEPTED")}
                    >
                      Aceitar
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      disabled={Boolean(busy)}
                      aria-label={`Recusar o convite de ${item.projectName}`}
                      onClick={() => void answer("DECLINED")}
                    >
                      Recusar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="secondary"
                      disabled={
                        Boolean(busy) || part.trim() === item.contribution
                      }
                      aria-label={`Salvar minha participação em ${item.projectName}`}
                      onClick={() => void answer("ACCEPTED")}
                    >
                      Salvar participação
                    </button>
                    {item.included ? (
                      <span className="portfolio-team-included">
                        <Check size={14} aria-hidden="true" /> No seu portfólio
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="secondary"
                        disabled={Boolean(busy)}
                        aria-label={`Adicionar ${item.projectName} ao meu portfólio`}
                        onClick={() =>
                          void run<Project>(key, `${path}/copy`, {
                            method: "POST",
                          }).then((done) => {
                            if (done?.result) {
                              onIncluded(done.result);
                              onChanged();
                            }
                          })
                        }
                      >
                        Adicionar ao meu portfólio
                      </button>
                    )}
                    {leaving === key ? (
                      <>
                        <button
                          type="button"
                          className="secondary portfolio-journey-danger"
                          disabled={Boolean(busy)}
                          aria-label={`Sair mesmo da equipe de ${item.projectName}`}
                          onClick={() =>
                            void run(key, path, { method: "DELETE" }).then(
                              (done) => {
                                setLeaving("");
                                if (done) onChanged();
                              },
                            )
                          }
                        >
                          Sair mesmo
                        </button>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => setLeaving("")}
                        >
                          Ficar
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="text-button"
                        aria-label={`Sair da equipe de ${item.projectName}`}
                        onClick={() => setLeaving(key)}
                      >
                        Sair da equipe
                      </button>
                    )}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** The teammates on a public project card. */
export function PublicTeam({ members }: { members: PublicMember[] }) {
  if (!members.length) return null;
  return (
    <ul className="public-project-team" aria-label="Equipe">
      {members.map((member) => (
        <li key={member.username ?? member.name}>
          {member.portfolio && member.username ? (
            <a href={`/p/${encodeURIComponent(member.username)}`}>
              {member.name}
            </a>
          ) : (
            <strong>{member.name}</strong>
          )}
          {member.contribution ? <span>{member.contribution}</span> : null}
        </li>
      ))}
    </ul>
  );
}
