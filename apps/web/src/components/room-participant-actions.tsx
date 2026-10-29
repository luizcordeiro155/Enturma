"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, MoreHorizontal, UserPlus, UserRoundX, X } from "lucide-react";
import { api, post } from "@/lib/api";

type Invitation = { code: string; url: string };
type Dialog = "closed" | "invite" | "remove";

/**
 * The room host can send a real invitation or remove an existing participant.
 * Neither action runs when the three-dot trigger is pressed: removal requires
 * a separate confirmation. The menu/dialog live in a body portal so the
 * scrollable participants sidebar cannot clip them on desktop or mobile.
 */
export function RoomParticipantActions({
  roomId,
  memberId,
  memberName,
  onRemoved,
}: {
  roomId: string;
  memberId: string;
  memberName: string;
  onRemoved: () => Promise<void>;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const dialogElement = useRef<HTMLElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [dialog, setDialog] = useState<Dialog>("closed");
  const [invite, setInvite] = useState<Invitation>();
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);

  function closeDialog() {
    if (working) return;
    setDialog("closed");
    setMessage("");
    trigger.current?.focus({ preventScroll: true });
  }

  function toggleMenu() {
    if (position) {
      setPosition(null);
      return;
    }
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 252;
    const above = rect.bottom + 170 > window.innerHeight && rect.top > 180;
    setPosition({
      left: Math.max(10, Math.min(window.innerWidth - width - 10, rect.right - width)),
      top: above ? rect.top - 156 : rect.bottom + 7,
    });
  }

  useEffect(() => {
    if (!position) return;
    const dismiss = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menu.current?.contains(target) && !trigger.current?.contains(target))
        setPosition(null);
    };
    const hideOnScroll = () => setPosition(null);
    const hideOnResize = () => setPosition(null);
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("scroll", hideOnScroll, true);
    window.addEventListener("resize", hideOnResize);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      menu.current?.animate(
        [{ opacity: 0, transform: "translateY(-8px) scale(.97)" }, { opacity: 1, transform: "none" }],
        { duration: 190, easing: "cubic-bezier(.16,1,.3,1)" },
      );
    }
    menu.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("scroll", hideOnScroll, true);
      window.removeEventListener("resize", hideOnResize);
    };
  }, [position]);

  useEffect(() => {
    if (!position && dialog === "closed") return;
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || working) return;
      event.preventDefault();
      if (dialog !== "closed") closeDialog();
      else {
        setPosition(null);
        trigger.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  // The close callback intentionally reads the current busy/dialog state.
  }, [position, dialog, working]);

  useEffect(() => {
    if (dialog === "closed" || !dialogElement.current) return;
    dialogElement.current.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      dialogElement.current.animate(
        [{ opacity: 0, transform: "translateY(14px) scale(.97)" }, { opacity: 1, transform: "translateY(0) scale(1)" }],
        { duration: 240, easing: "cubic-bezier(.16,1,.3,1)" },
      );
    }
  }, [dialog]);

  async function openInvitation() {
    setPosition(null);
    setDialog("invite");
    setMessage("");
    if (invite) return;
    setWorking(true);
    try {
      setInvite(await post<Invitation>("/study-rooms/" + roomId + "/share-code"));
    } catch (error) {
      setMessage((error as Error).message || "Não foi possível gerar o convite.");
    } finally {
      setWorking(false);
    }
  }

  async function copyInvitation() {
    if (!invite) return;
    try {
      await navigator.clipboard.writeText(invite.url);
      setMessage("Link de convite copiado.");
    } catch {
      setMessage("Selecione e copie o link de convite abaixo.");
    }
  }

  async function removeMember() {
    setWorking(true);
    setMessage("");
    try {
      await api("/study-rooms/" + roomId + "/participants/" + memberId, { method: "DELETE" });
      await onRemoved();
      setDialog("closed");
    } catch (error) {
      setMessage((error as Error).message || "Não foi possível remover este participante.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="room-member-action-trigger"
        aria-label={"Opções para " + memberName}
        title="Ações do participante"
        aria-haspopup="menu"
        aria-expanded={Boolean(position)}
        onClick={toggleMenu}
      >
        <MoreHorizontal size={19} />
      </button>

      {typeof document !== "undefined" && position ? createPortal(
        <div
          ref={menu}
          className="room-member-menu"
          role="menu"
          aria-label={"Ações de " + memberName}
          style={{ top: position.top, left: position.left }}
        >
          <button type="button" role="menuitem" onClick={() => void openInvitation()}>
            <UserPlus size={18} aria-hidden="true" />
            <span><strong>Adicionar usuário</strong><small>Enviar convite para entrar na sala</small></span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="room-member-danger"
            onClick={() => { setPosition(null); setMessage(""); setDialog("remove"); }}
          >
            <UserRoundX size={18} aria-hidden="true" />
            <span><strong>Expulsar da sala</strong><small>Solicita confirmação antes de remover</small></span>
          </button>
        </div>,
        document.body,
      ) : null}

      {typeof document !== "undefined" && dialog !== "closed" ? createPortal(
        <div
          className="room-member-overlay"
          onPointerDown={(event) => { if (event.target === event.currentTarget) closeDialog(); }}
        >
          <section
            ref={dialogElement}
            className="room-member-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="room-member-dialog-title"
            aria-describedby="room-member-dialog-description"
          >
            <header>
              <div className="room-member-dialog-icon" aria-hidden="true">
                {dialog === "invite" ? <UserPlus size={24} /> : <UserRoundX size={24} />}
              </div>
              <button
                className="room-member-dialog-close"
                type="button"
                aria-label="Fechar"
                disabled={working}
                onClick={closeDialog}
              ><X size={20} /></button>
            </header>

            {dialog === "invite" ? (
              <>
                <h2 id="room-member-dialog-title">Adicionar usuário à sala</h2>
                <p id="room-member-dialog-description">
                  Convide um colega pelo link ou código. O participante precisa aceitar o convite e entrar na turma.
                </p>
                {invite ? (
                  <div className="room-member-invite">
                    <label htmlFor="room-member-invite-link">Link de convite</label>
                    <input id="room-member-invite-link" readOnly value={invite.url} onFocus={(event) => event.currentTarget.select()} />
                    <small>Código da sala: <strong>{invite.code}</strong></small>
                    <button className="room-member-primary" type="button" onClick={() => void copyInvitation()}>
                      {message === "Link de convite copiado." ? <Check size={17} /> : <Copy size={17} />}
                      {message === "Link de convite copiado." ? "Link copiado" : "Copiar convite"}
                    </button>
                  </div>
                ) : working ? <p role="status">Preparando convite…</p> : null}
                {message && <p className="room-member-feedback" role="status">{message}</p>}
              </>
            ) : (
              <>
                <h2 id="room-member-dialog-title">Expulsar participante?</h2>
                <p id="room-member-dialog-description">
                  Você está prestes a remover <strong>{memberName}</strong> da sala.
                  Essa ação interrompe a participação atual e não pode ser desfeita automaticamente.
                </p>
                {message && <p className="room-member-feedback" role="alert">{message}</p>}
                <div className="room-member-dialog-actions">
                  <button className="room-member-cancel" type="button" disabled={working} onClick={closeDialog}>
                    Cancelar
                  </button>
                  <button className="room-member-confirm-remove" type="button" disabled={working} onClick={() => void removeMember()}>
                    <UserRoundX size={17} />
                    {working ? "Removendo…" : "Confirmar expulsão"}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
