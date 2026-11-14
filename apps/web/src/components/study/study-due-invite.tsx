"use client";
import { useEffect, useRef, useState } from "react";
import { Brain, Clock3, X } from "lucide-react";
import { NavigationLink as Link } from "../navigation-link";
import { study, whenLabel, type StudySessionSummary } from "@/lib/study";

const SNOOZE_KEY = "enturma-study-snoozed";

function snoozed(): Record<string, number> {
  try {
    return JSON.parse(sessionStorage.getItem(SNOOZE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function snooze(id: string, minutes: number) {
  try {
    sessionStorage.setItem(SNOOZE_KEY, JSON.stringify({ ...snoozed(), [id]: Date.now() + minutes * 60000 }));
  } catch {
    // Storage may be unavailable; the invitation simply comes back on the next check.
  }
}

/** Invites the student into a study session that is about to start (or just started). */
export function StudyDueInvite() {
  const [session, setSession] = useState<StudySessionSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let alive = true;
    let retry = 0;
    async function check() {
      // Wait for the opening animation to finish before inviting.
      if (document.querySelector(".enturma-launch-overlay")) {
        retry = window.setTimeout(() => void check(), 1000);
        return;
      }
      try {
        const due = await study.due();
        if (!alive) return;
        const until = snoozed();
        setSession((current) => current ?? due.find((item) => (until[item.id] ?? 0) < Date.now()) ?? null);
      } catch {
        // No session, offline or signed out: the invitation is optional.
      }
    }
    // The opening animation mounts a moment after the page; give it time to appear first.
    retry = window.setTimeout(() => void check(), 1200);
    const timer = window.setInterval(() => void check(), 60000);
    return () => {
      alive = false;
      window.clearInterval(timer);
      window.clearTimeout(retry);
    };
  }, []);

  useEffect(() => {
    const node = dialog.current;
    if (!session || !node) return;
    if (!node.open) node.showModal();
    return () => {
      if (node.open) node.close();
    };
  }, [session]);

  if (!session) return null;

  function later() {
    snooze(session!.id, 10);
    setSession(null);
  }

  return (
    <dialog
      ref={dialog}
      className="study-due-invite"
      aria-labelledby="study-due-title"
      onCancel={(event) => {
        event.preventDefault();
        later();
      }}
    >
      <span className="study-due-orb" aria-hidden>
        <Brain size={30} />
      </span>
      <span className="home-section-kicker">Hora de estudar</span>
      <h2 id="study-due-title">{session.subjectName}</h2>
      <p className="study-due-when">
        <Clock3 size={15} aria-hidden /> {whenLabel(session.startsAt)} · {session.minutes} min
      </p>
      {session.goal ? <p className="study-due-goal">{session.goal}</p> : null}
      <p>Sua sala de estudo com o tutor de IA já está pronta.</p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="study-due-actions">
        <Link
          className="button"
          href={`/study/${session.id}`}
          onClick={() => {
            snooze(session.id, 600);
            setSession(null);
          }}
        >
          Ir para a sala
        </Link>
        <button
          type="button"
          className="secondary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await study.skip(session.id);
              setSession(null);
            } catch (cause) {
              setError((cause as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          Desistir de estudar agora
        </button>
        <button type="button" className="text-button" disabled={busy} onClick={later}>
          Lembrar em 10 min
        </button>
      </div>
      <button type="button" className="study-due-close" aria-label="Lembrar mais tarde" onClick={later}>
        <X size={18} />
      </button>
    </dialog>
  );
}
