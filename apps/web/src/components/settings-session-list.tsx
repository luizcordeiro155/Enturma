"use client";

import { Globe, Monitor, Smartphone } from "lucide-react";

export type AccountSession = {
  id: string;
  device: string;
  platform?: "WEB" | "DESKTOP" | "ANDROID" | null;
  clientName?: string | null;
  createdAt: string;
  lastSeenAt?: string | null;
  current?: boolean;
  online?: boolean;
};

const PLATFORM = {
  WEB: { label: "Navegador", Icon: Globe },
  DESKTOP: { label: "App desktop", Icon: Monitor },
  ANDROID: { label: "App Android", Icon: Smartphone },
} as const;

const relative = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

/** "há 3 horas", "ontem", or a date for anything older than a week. */
export function lastSeenText(iso: string, now: Date) {
  const then = new Date(iso);
  const minutes = Math.round((now.getTime() - then.getTime()) / 60_000);
  if (minutes < 60) return relative.format(-Math.max(minutes, 1), "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return relative.format(-hours, "hour");
  const days = Math.round(hours / 24);
  if (days < 7) return relative.format(-days, "day");
  return `em ${then.toLocaleDateString("pt-BR")}`;
}

function dateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function SessionList({
  sessions,
  onRevoke,
  now = new Date(),
}: {
  sessions: AccountSession[];
  onRevoke: (id: string) => void;
  now?: Date;
}) {
  return (
    <ul className="settings-sessions">
      {sessions.map((s) => {
        const platform = s.platform ? PLATFORM[s.platform] : undefined;
        const Icon = platform?.Icon ?? Globe;
        const title = platform?.label ?? s.device;
        const lastSeen = s.lastSeenAt ?? s.createdAt;
        return (
          <li key={s.id} data-current={s.current ? "true" : undefined}>
            <span className="settings-session-icon" aria-hidden="true">
              <Icon size={18} />
              {s.online && <i className="settings-session-online" />}
            </span>
            <div>
              <span className="settings-session-title">
                <strong>{title}</strong>
                {s.current && <span className="settings-session-badge">Este aparelho</span>}
              </span>
              {platform && s.clientName && (
                <span className="settings-session-client">{s.clientName}</span>
              )}
              <small className="settings-session-meta">
                {s.online ? (
                  <span className="settings-session-live">Ativa agora</span>
                ) : (
                  <span>Último acesso {lastSeenText(lastSeen, now)}</span>
                )}
                <span aria-hidden="true"> · </span>
                <span>Login em {dateTime(s.createdAt)}</span>
              </small>
            </div>
            {!s.current && (
              <button
                type="button"
                className="secondary compact"
                onClick={() => onRevoke(s.id)}
                aria-label={`Revogar ${title}`}
              >
                Revogar
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
