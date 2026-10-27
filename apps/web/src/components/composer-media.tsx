"use client";
/* eslint-disable @next/next/no-img-element -- bounded authenticated media and local GIF assets */
import { useEffect, useId, useRef, useState } from "react";
import {
  Smile,
  Sticker,
  ImagePlay,
  Star,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { EmojiPicker } from "./emoji-picker";
import { KlipyPicker } from "./klipy-picker";
import type { KlipyGif } from "@/lib/klipy";
import {
  MessageActionPopover,
  messageActionAnchor,
  type MessageActionAnchor,
} from "./message-action-popover";
import { api } from "@/lib/api";
import {
  chatMediaFile,
  ENTURMA_GIFS,
  saveChatMedia,
  type ChatMedia,
} from "@/lib/chat-media";

type Tab = "EMOJI" | "STICKER" | "GIF";
/** Shared picker; leaves sending/encryption and native IME ownership with each chat. */
export function ComposerMedia({
  onEmoji,
  onFile,
  onMedia,
  onKlipy,
  disabled = false,
}: {
  onEmoji: (emoji: string) => void;
  onFile?: (file: File) => void;
  onMedia?: (file: File, kind: ChatMedia["kind"]) => Promise<void>;
  onKlipy?: (gif: KlipyGif) => Promise<void>;
  disabled?: boolean;
}) {
  const [anchor, setAnchor] = useState<MessageActionAnchor>();
  const [tab, setTab] = useState<Tab>("EMOJI");
  const [gifSource, setGifSource] = useState<"enturma" | "klipy">("enturma");
  const [items, setItems] = useState<ChatMedia[]>([]);
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [directSend, setDirectSend] = useState<boolean | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const panelId = useId();
  const mediaEnabled = Boolean(onFile || onMedia);
  useEffect(() => {
    if (!anchor || !mediaEnabled) return;
    let active = true;
    api<{ directSend: boolean }>("/chat-media/capabilities")
      .then(value => { if (active) setDirectSend(value.directSend === true); })
      .catch(() => { if (active) setDirectSend(false); });
    api<ChatMedia[]>("/chat-media")
      .then((data) => {
        if (active) setItems(data);
      })
      .catch(() => {
        if (active)
          setError(
            "Não foi possível carregar sua biblioteca. Tente abrir novamente.",
          );
      });
    return () => {
      active = false;
    };
  }, [anchor, mediaEnabled]);
  async function run(task: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await task();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const available = (
    tab === "GIF" && !favorites ? [...items, ...ENTURMA_GIFS] : items
  ).filter(
    (item) =>
      item.kind === tab &&
      (!favorites || item.favorite) &&
      item.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  return (
    <>
      <div className="composer-media-buttons">
        {(["EMOJI", ...(mediaEnabled ? ["STICKER", "GIF"] : [])] as Tab[]).map(
          (kind) => {
            const Icon =
              kind === "EMOJI"
                ? Smile
                : kind === "STICKER"
                  ? Sticker
                  : ImagePlay;
            const label =
              kind === "EMOJI"
                ? "Adicionar emoji"
                : kind === "STICKER"
                  ? "Figurinhas"
                  : "GIFs";
            return (
              <button
                key={kind}
                type="button"
                className={`composer-icon-button media-trigger-${kind.toLowerCase()}`}
                aria-label={label}
                title={label}
                disabled={disabled}
                aria-expanded={!!anchor && tab === kind}
                onPointerDown={(event) => event.preventDefault()}
                onClick={(event) => {
                  setTab(kind);
                  setCreating(false);
                  setAnchor(
                    anchor && tab === kind
                      ? undefined
                      : messageActionAnchor(event.currentTarget),
                  );
                }}
              >
                <Icon size={20} />
              </button>
            );
          },
        )}
      </div>
      {anchor && (
        <MessageActionPopover
          anchor={anchor}
          label="Emojis, figurinhas e GIFs"
          wide
          composer
          onDismiss={() => setAnchor(undefined)}
        >
          <div className="media-library">
            <header>
              <div role="tablist" aria-label="Tipo de mídia">
                {(
                  ["EMOJI", ...(mediaEnabled ? ["STICKER", "GIF"] : [])] as Tab[]
                ).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    role="tab"
                    id={`${panelId}-${kind}`}
                    aria-controls={panelId}
                    tabIndex={tab === kind ? 0 : -1}
                    aria-selected={tab === kind}
                    onKeyDown={(event) => {
                      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                      event.preventDefault();
                      const tabs = Array.from(event.currentTarget.parentElement!.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
                      const index = tabs.indexOf(event.currentTarget);
                      const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
                      tabs[next].click(); tabs[next].focus();
                    }}
                    onClick={() => {
                      setTab(kind);
                      setCreating(false);
                    }}
                  >
                    {kind === "EMOJI"
                      ? "Emoji"
                      : kind === "STICKER"
                        ? "Figurinhas"
                        : "GIFs"}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="icon-control"
                aria-label="Fechar biblioteca"
                onClick={() => setAnchor(undefined)}
              >
                <X size={18} />
              </button>
            </header>
            <div className="media-library-panel" role="tabpanel" id={panelId} aria-labelledby={`${panelId}-${tab}`}>
            {tab === "EMOJI" ? (
              <EmojiPicker
                onSelect={(emoji) => {
                  onEmoji(emoji);
                  setAnchor(undefined);
                }}
              />
            ) : (
              <>
                {tab === "GIF" && (
                  <div className="media-library-sources" aria-label="Origem dos GIFs">
                    <button type="button" aria-pressed={gifSource === "enturma"} onClick={() => setGifSource("enturma")}>Minha coleção</button>
                    <button type="button" aria-pressed={gifSource === "klipy"} onClick={() => setGifSource("klipy")}>KLIPY</button>
                  </div>
                )}
                {tab === "GIF" && gifSource === "klipy" ? (
                  <KlipyPicker query={query} disabled={disabled || busy}
                    onSelect={async (gif) => {
                      if (!onKlipy) throw Error("O envio de GIFs não está disponível neste chat.");
                      await onKlipy(gif);
                      setAnchor(undefined);
                    }} />
                ) : (
                <>
                <div className="media-library-search">
                  <label>
                    <Search size={17} />
                    <input
                      aria-label="Buscar na biblioteca"
                      placeholder={
                        tab === "GIF" ? "Buscar GIFs" : "Buscar figurinhas"
                      }
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    aria-label="Mostrar favoritos"
                    aria-pressed={favorites}
                    title="Favoritos"
                    onClick={() => setFavorites(!favorites)}
                  >
                    <Star size={18} />
                  </button>
                  <button
                    type="button"
                    aria-label={
                      tab === "GIF" ? "Adicionar GIF" : "Criar figurinha"
                    }
                    title="Adicionar à biblioteca"
                    onClick={() => setCreating(!creating)}
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {creating && (
                  <div className="media-library-create">
                    <label>
                      Nome
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={80}
                        placeholder={
                          tab === "GIF" ? "Meu GIF" : "Minha figurinha"
                        }
                      />
                    </label>
                    <input
                      ref={input}
                      className="sr-only"
                      type="file"
                      accept={
                        tab === "GIF"
                          ? "image/gif"
                          : "image/png,image/jpeg,image/webp,image/gif"
                      }
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file) return;
                        void run(async () => {
                          await saveChatMedia(
                            file,
                            tab as ChatMedia["kind"],
                            name || file.name,
                          );
                          setItems(
                            await api<ChatMedia[]>("/chat-media", {
                              cache: "no-store",
                            }),
                          );
                          setCreating(false);
                          setName("");
                        });
                      }}
                    />
                    <button
                      type="button"
                      className="secondary"
                      disabled={busy}
                      onClick={() => input.current?.click()}
                    >
                      Escolher imagem
                    </button>
                    <small>
                      Salva na sua conta. PNG transparente preserva o recorte da
                      figurinha.
                    </small>
                  </div>
                )}
                <div
                  className="media-library-grid"
                  role="tabpanel"
                  aria-busy={busy}
                >
                  {available.map((item) => (
                    <article key={item.id}>
                      <button
                        type="button"
                        className="media-select"
                        aria-label={item.name}
                        title={item.name}
                        disabled={busy || disabled || (Boolean(onMedia) && directSend === null)}
                        onClick={() =>
                          void run(async () => {
                            const file = await chatMediaFile(item);
                            if (onMedia && directSend) await onMedia(file, item.kind);
                            else onFile?.(file);
                            setAnchor(undefined);
                          })
                        }
                      >
                        <img
                          src={
                            item.src ??
                            `/api/backend/chat-media/${item.id}/file`
                          }
                          alt={item.name}
                          loading="lazy"
                        />
                        <span>{item.name}</span>
                      </button>
                      <div className="media-item-actions">
                        <button
                          type="button"
                          aria-label={`Favoritar ${item.name}`}
                          aria-pressed={item.favorite}
                          disabled={busy}
                          onClick={() =>
                            void run(async () => {
                              if (item.src) {
                                await saveChatMedia(
                                  await chatMediaFile(item),
                                  item.kind,
                                  item.name,
                                );
                                setNotice("Salvo nos seus favoritos.");
                              } else
                                await api(`/chat-media/${item.id}`, {
                                  method: "PATCH",
                                  body: JSON.stringify({
                                    favorite: !item.favorite,
                                  }),
                                });
                              setItems(
                                await api<ChatMedia[]>("/chat-media", {
                                  cache: "no-store",
                                }),
                              );
                            })
                          }
                        >
                          <Star size={15} />
                        </button>
                        {!item.src && (
                          <button
                            type="button"
                            aria-label={`Remover ${item.name}`}
                            disabled={busy}
                            onClick={() =>
                              void run(async () => {
                                await api(`/chat-media/${item.id}`, {
                                  method: "DELETE",
                                });
                                setItems((previous) =>
                                  previous.filter((m) => m.id !== item.id),
                                );
                              })
                            }
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
                {!available.length && (
                  <p className="media-empty">
                    {favorites
                      ? "Seus favoritos aparecerão aqui."
                      : "Crie sua primeira figurinha pelo botão +."}
                  </p>
                )}
                <small className="media-library-credit">
                  {tab === "GIF"
                    ? "Coleção original Enturma · Seus GIFs"
                    : `Sua biblioteca pessoal · Toque para ${onMedia && directSend ? 'enviar' : 'anexar'}`}
                </small>
                </>
                )}
              </>
            )}
            {error && <p role="alert">{error}</p>}
            {notice && <p role="status">{notice}</p>}
            </div>
          </div>
        </MessageActionPopover>
      )}
    </>
  );
}
