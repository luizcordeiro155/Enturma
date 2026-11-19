"use client";
import { useState } from "react";
import {
  AtSign,
  Facebook,
  Github,
  Gitlab,
  Globe,
  Instagram,
  Link2,
  Linkedin,
  Mail,
  MessageCircle,
  Music2,
  Phone,
  Plus,
  Send,
  Trash2,
  Twitch,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { ConfirmedLink } from "./forum-links";
import {
  MAX_PROFILE_LINKS,
  describeLink,
  normalizeLink,
  profileLinks,
  type LinkKind,
} from "@/lib/profile-links";

const ICONS: Record<LinkKind, LucideIcon> = {
  github: Github,
  gitlab: Gitlab,
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  whatsapp: Phone,
  youtube: Youtube,
  x: AtSign,
  tiktok: Music2,
  twitch: Twitch,
  discord: MessageCircle,
  telegram: Send,
  email: Mail,
  site: Globe,
};

/** The profile's links, each named after the service it points to. */
export function ProfileLinks({
  details,
}: {
  details?: { website?: string; links?: string[] } | null;
}) {
  const [copied, setCopied] = useState("");
  const links = profileLinks(details);
  if (!links.length) return null;
  return (
    <ul className="profile-links" aria-label="Links">
      {links.map((href) => {
        const info = describeLink(href);
        const Icon = ICONS[info.kind];
        const label = `${info.name} ${info.detail}`.trim();
        const content = (
          <>
            <Icon size={18} aria-hidden="true" />
            <span>
              <strong>{info.name}</strong>
              {info.detail ? <small> {info.detail}</small> : null}
            </span>
          </>
        );
        return (
          <li key={href} data-kind={info.kind}>
            {info.kind === "email" ? (
              <a
                href={href}
                className="profile-link"
                aria-label={label}
                onClick={(event) => {
                  // The desktop and phone apps have no mail handler inside
                  // their window: hand the address over instead of navigating.
                  if (
                    !window.enturmaDesktop &&
                    !/EnturmaMobile\//.test(navigator.userAgent)
                  )
                    return;
                  event.preventDefault();
                  void navigator.clipboard?.writeText(info.detail).then(
                    () => setCopied(href),
                    () => setCopied(""),
                  );
                }}
              >
                {content}
              </a>
            ) : (
              <ConfirmedLink href={href} label={label} className="profile-link">
                {content}
              </ConfirmedLink>
            )}
            {copied === href ? (
              <small className="profile-link-note" role="status">
                E-mail copiado
              </small>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/** Edits the list of links; the service is recognised as the user types. */
export function ProfileLinksEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (links: string[]) => void;
}) {
  return (
    <div className="profile-links-editor" role="group" aria-label="Links">
      {value.map((link, i) => {
        const href = normalizeLink(link);
        const info = href ? describeLink(href) : undefined;
        const Icon = info ? ICONS[info.kind] : Link2;
        return (
          <div className="profile-link-row" key={i}>
            <Icon size={18} aria-hidden="true" />
            <input
              aria-label={`Link ${i + 1}`}
              value={link}
              maxLength={200}
              inputMode="url"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="github.com/voce ou voce@email.com"
              aria-invalid={Boolean(link.trim()) && !href}
              onChange={(event) =>
                onChange(
                  value.map((old, at) => (at === i ? event.target.value : old)),
                )
              }
            />
            <button
              type="button"
              className="icon-control"
              aria-label={`Remover link ${i + 1}`}
              onClick={() => onChange(value.filter((_, at) => at !== i))}
            >
              <Trash2 size={16} />
            </button>
            <small data-valid={Boolean(info)}>
              {info
                ? info.name
                : link.trim()
                  ? "Use um endereço web ou e-mail"
                  : "GitHub, site, e-mail, WhatsApp, Instagram, LinkedIn…"}
            </small>
          </div>
        );
      })}
      {value.length < MAX_PROFILE_LINKS ? (
        <button
          type="button"
          className="button secondary"
          onClick={() => onChange([...value, ""])}
        >
          <Plus size={16} />
          Adicionar link
        </button>
      ) : null}
    </div>
  );
}
