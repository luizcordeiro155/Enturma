"use client";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import type { SocialPerson, SocialPost } from "@/lib/social";
import { SocialDialog } from "./social-dialog";
import { SocialAuthor } from "./social-post";
import { SocialProfileGrid } from "./social-profile-grid";
import { SocialPostViewer } from "./social-post-viewer";

/** Discovery uses the same authorized feed, ranking and media proxy as reading. */
export function SocialExplore({
  me,
  person,
  close,
}: {
  me: string;
  person: (id: string) => void;
  close: () => void;
}) {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<SocialPerson[]>([]);
  const [error, setError] = useState("");
  const [viewer, setViewer] = useState<{
    items: SocialPost[];
    start: number;
  }>();
  useEffect(() => {
    if (!query) return;
    let current = true;
    void api<SocialPerson[]>(
      `/social/people?q=${encodeURIComponent(query.replace(/^[@#]/, ""))}`,
      { cache: "no-store" },
    )
      .then((rows) => {
        if (current) setPeople(rows);
      })
      .catch((cause: Error) => {
        if (current) setError(cause.message);
      });
    return () => {
      current = false;
    };
  }, [query]);
  function search(value: string) {
    if (value.trim() === query) return;
    setPeople([]);
    setError("");
    setQuery(value.trim());
  }
  return (
    <SocialDialog title="Explorar" variant="explore" close={close}>
      <form
        className="social-explore-search"
        onSubmit={(event) => {
          event.preventDefault();
          search(input);
        }}
      >
        <label className="sr-only" htmlFor="social-explore-query">
          Pesquisar no Explorar
        </label>
        <Search size={20} aria-hidden="true" />
        <input
          id="social-explore-query"
          type="search"
          maxLength={80}
          placeholder="Pesquisar pessoas, assuntos e #ideias"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            if (!event.target.value) search("");
          }}
        />
        <button className="icon-control" aria-label="Pesquisar no Explorar">
          <Search size={20} />
        </button>
      </form>
      {query && (
        <div className="social-explore-people">
          <h3>Resultados para “{query}”</h3>
          {error && <p role="alert">{error}</p>}
          {people.map((user) => (
            <SocialAuthor key={user.id} user={user} open={person} />
          ))}
        </div>
      )}
      <SocialProfileGrid
        key={query}
        query={`tab=for-you&kind=ALL${query ? `&q=${encodeURIComponent(query)}` : ""}`}
        active={!viewer}
        shape="square"
        open={(items, start) => setViewer({ items, start })}
      />
      {viewer && (
        <SocialPostViewer
          {...viewer}
          me={me}
          person={person}
          changed={() => {}}
          close={() => setViewer(undefined)}
        />
      )}
    </SocialDialog>
  );
}
