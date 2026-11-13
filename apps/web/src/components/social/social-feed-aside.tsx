"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { SocialPerson } from "@/lib/social";
import { SocialAuthor } from "./social-post";
import { NavigationLink } from "../navigation-link";

/** Connections use the API's active-account and bidirectional-block rules. */
export function SocialFeedAside({ me, person, explore }: {
  me: SocialPerson;
  person: (id: string) => void;
  explore: () => void;
}) {
  const [people, setPeople] = useState<SocialPerson[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    let active = true;
    void api<SocialPerson[]>("/social/people/mentions", { cache: "no-store" })
      .then((items) => { if (active) { setPeople(items); setState("ready"); } })
      .catch(() => { if (active) setState("error"); });
    return () => { active = false; };
  }, [me.id]);
  return (
    <aside className="social-feed-aside" aria-label="Sua turma">
      <SocialAuthor user={me} open={person} />
      <header><h2>Sua turma</h2><button className="text-button" onClick={explore}>Descobrir</button></header>
      {state === "loading" && <p role="status">Carregando sua turma…</p>}
      {state === "error" && <p>Não foi possível carregar sua turma. Use Explorar para encontrar pessoas.</p>}
      {state === "ready" && !people.length && <p>Encontre pessoas e acompanhe o que acontece na sua turma.</p>}
      {people.length > 0 && <ul>{people.map((user) => <li key={user.id}><SocialAuthor user={user} open={person} /></li>)}</ul>}
      <footer><NavigationLink href="/friends">Mensagens</NavigationLink><br />Enturma Social · Sua turma. Suas descobertas.</footer>
    </aside>
  );
}
