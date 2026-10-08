"use client";
import { useState } from "react";
import {
  Copy,
  Pencil,
  Reply,
  SmilePlus,
  Trash2,
  UserRound,
  Users,
  X,
  ChevronLeft,
} from "lucide-react";
import {
  MessageActionPopover,
  type MessageActionAnchor,
} from "./message-action-popover";
import { EmojiPicker, AnimatedEmoji } from "./emoji-picker";

export function MessageMenu({
  anchor,
  onDismiss,
  onEdit,
  onDelete,
  onReact,
  onReply,
  text,
  canDeleteEveryone,
}: {
  anchor: MessageActionAnchor;
  onDismiss: () => void;
  onEdit?: () => void;
  onReply?: () => void;
  text?: string;
  canDeleteEveryone: boolean;
  onDelete: (scope: "me" | "everyone") => Promise<void>;
  onReact?: (emoji: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<"actions" | "delete" | "emoji">("actions");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function act(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await action();
      onDismiss();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <MessageActionPopover
      anchor={anchor}
      onDismiss={() => {
        if (!busy) onDismiss();
      }}
      wide={mode === "emoji"}
      label={
        mode === "delete"
          ? "Excluir mensagem"
          : mode === "emoji"
            ? "Reagir à mensagem"
            : "Ações da mensagem"
      }
    >
      {mode === "actions" ? (
        <>
          {onReact && (
            <div className="message-menu-reactions">
              {["👍", "❤️", "😂", "🎉", "🤔"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  disabled={busy}
                  aria-label={`Reagir com ${emoji}`}
                  onClick={() => void act(() => onReact(emoji))}
                >
                  <AnimatedEmoji value={emoji} />
                </button>
              ))}
              <button
                type="button"
                aria-label="Mais emojis"
                onClick={() => setMode("emoji")}
              >
                <SmilePlus size={23} />
              </button>
            </div>
          )}
          {onReply && (
            <button
              type="button"
              onClick={() => {
                onReply();
                onDismiss();
              }}
            >
              <Reply size={19} /> Responder
            </button>
          )}
          {text && (
            <button
              type="button"
              onClick={() =>
                void act(() => navigator.clipboard.writeText(text))
              }
            >
              <Copy size={19} /> Copiar texto
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onEdit();
                onDismiss();
              }}
            >
              <Pencil size={19} /> Editar mensagem
            </button>
          )}
          <button
            type="button"
            className="danger"
            onClick={() => setMode("delete")}
          >
            <Trash2 size={19} /> Excluir mensagem
          </button>
        </>
      ) : mode === "delete" ? (
        <>
          <div className="message-delete-heading">
            <Trash2 size={24} />
            <h3>Excluir mensagem?</h3>
            <p>Escolha quem deixará de ver esta mensagem.</p>
          </div>
          {canDeleteEveryone && (
            <button
              type="button"
              className="danger"
              disabled={busy}
              onClick={() => void act(() => onDelete("everyone"))}
            >
              <Users size={20} />
              <span>
                Excluir para todos<small>Remove o conteúdo da conversa.</small>
              </span>
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => void act(() => onDelete("me"))}
          >
            <UserRound size={20} />
            <span>
              Excluir para mim<small>Oculta apenas na sua conta.</small>
            </span>
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            className="secondary"
            onClick={() => setMode("actions")}
          >
            <ChevronLeft size={18} /> Voltar às ações
          </button>
          <EmojiPicker
            disabled={busy}
            onSelect={(emoji) => void act(() => onReact!(emoji))}
          />
        </>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {busy && <p role="status">Salvando…</p>}
      <button
        type="button"
        className="secondary message-menu-cancel"
        disabled={busy}
        onClick={onDismiss}
      >
        <X size={19} /> Cancelar
      </button>
    </MessageActionPopover>
  );
}
