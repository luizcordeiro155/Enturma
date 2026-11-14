"use client";
import { useEffect, useRef } from "react";
import { LockKeyhole, MessagesSquare } from "lucide-react";

/** The right panel on wide screens before a conversation is chosen. */
export function FriendsChatPlaceholder() {
  return (
    <div className="friends-empty-chat">
      <span className="friends-empty-chat-mark" aria-hidden>
        <MessagesSquare size={34} />
      </span>
      <h2>Suas conversas</h2>
      <p>Escolha um amigo na lista para conversar. A conversa abre aqui ao lado.</p>
      <small>
        <LockKeyhole size={14} aria-hidden />
        Protegidas de ponta a ponta: só vocês dois leem.
      </small>
    </div>
  );
}

/** Esc closes the open conversation, unless a dialog (call, menu, media) is in front. */
export function useEscapeClosesChat(open: boolean, close: () => void) {
  const latest = useRef(close);
  useEffect(() => {
    latest.current = close;
  }, [close]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (document.querySelector("dialog[open], [role='dialog'], [role='menu']")) return;
      latest.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
}
