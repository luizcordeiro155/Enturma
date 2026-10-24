"use client";
/* eslint-disable @next/next/no-img-element -- bounded authenticated media and local GIF assets */
import { useEffect, useRef, useState } from "react";
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
  disabled = false,
}: {
  onEmoji: (emoji: string) => void;
  onFile?: (file: File) => void;
  disabled?: boolean;
}) {
  const [anchor, setAnchor] = useState<MessageActionAnchor>();
  const [tab, setTab] = useState<Tab>("EMOJI");
  const [items, setItems] = useState<ChatMedia[]>([]);
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const mediaEnabled = Boolean(onFile);
  useEffect(() => {
    if (!anchor || !mediaEnabled) return;
    let active = true;
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
        {(["EMOJI", ...(onFile ? ["STICKER", "GIF"] : [])] as Tab[]).map(
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
          onDismiss={() => setAnchor(undefined)}
        >
          <div className="media-library">
            <header>
              <div role="tablist" aria-label="Tipo de mídia">
                {(
                  ["EMOJI", ...(onFile ? ["STICKER", "GIF"] : [])] as Tab[]
                ).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    role="tab"
                    aria-selected={tab === kind}
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
            {tab === "EMOJI" ? (
              <EmojiPicker
                onSelect={(emoji) => {
                  onEmoji(emoji);
                  setAnchor(undefined);
                }}
              />
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
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            onFile?.(await chatMediaFile(item));
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
                    : "Sua biblioteca pessoal · Toque para anexar"}
                </small>
              </>
            )}
            {error && <p role="alert">{error}</p>}
            {notice && <p role="status">{notice}</p>}
          </div>
        </MessageActionPopover>
      )}
    </>
  );
}
