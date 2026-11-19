"use client";
/* eslint-disable @next/next/no-img-element -- same-origin profile banner */
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { sharedSocialProfileId } from "@/lib/social-stream-state";
import { Avatar, profileStyle, type PublicProfile } from "./user-identity";
import "./profile-share.css";

/** A profile sent in a private conversation, shown as a small card that opens it. */
export function SharedProfilePreview({ text }: { text: string }) {
  const id = sharedSocialProfileId(text);
  return id ? <SharedProfileCard id={id} text={text} /> : null;
}

function SharedProfileCard({ id, text }: { id: string; text: string }) {
  const [person, setPerson] = useState<PublicProfile>(),
    [missing, setMissing] = useState(false);
  useEffect(() => {
    let alive = true;
    api<PublicProfile>(`/users/${id}/profile`)
      .then((found) => {
        if (alive) setPerson(found);
      })
      .catch(() => {
        if (alive) setMissing(true);
      });
    return () => {
      alive = false;
    };
  }, [id]);
  // What the sender wrote around the link stays; the bare link gives way to the card.
  const note = text
    .replace(/https:\/\/enturma-flax\.vercel\.app\/social\?[^\s<>]+/g, "")
    .trim();
  const said = person?.profileDetails?.statusText?.trim() || person?.bio;
  return (
    <article className="shared-profile-message">
      {note && <p>{note}</p>}
      {person ? (
        <Link
          className="shared-profile-card"
          href={`/social?person=${id}`}
          aria-label={`Abrir perfil de ${person.name}`}
          style={profileStyle(person)}
        >
          <span className="shared-profile-banner">
            {person.hasBanner ? (
              <img
                src={`/api/backend/users/${person.id}/banner?v=${person.mediaVersion ?? 0}`}
                alt=""
                loading="lazy"
              />
            ) : null}
          </span>
          <Avatar user={person} />
          <span className="shared-profile-copy">
            <strong>{person.name}</strong>
            {person.username ? <small>@{person.username}</small> : null}
            {said ? <span>{said}</span> : null}
          </span>
          <span className="shared-profile-open">Ver perfil</span>
        </Link>
      ) : missing ? (
        <small role="status">Perfil indisponível.</small>
      ) : (
        // The same size as the card it becomes, so the conversation does not jump.
        <span
          className="shared-profile-card is-loading"
          role="status"
          aria-label="Carregando perfil…"
        >
          <span className="shared-profile-banner" />
          <span className="identity-avatar" />
          <span className="shared-profile-copy" />
          <span className="shared-profile-open">Ver perfil</span>
        </span>
      )}
    </article>
  );
}
