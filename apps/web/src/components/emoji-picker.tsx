"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Clock,
  Smile,
  Hand,
  Leaf,
  Coffee,
  Trophy,
  Car,
  Lightbulb,
  Heart,
  Flag,
  Sparkles,
  Search,
} from "lucide-react";
import { playMotion } from "@/lib/motion";

type Emoji = {
  unicode: string;
  label: string;
  tags?: string[];
  group?: number;
  order?: number;
  skins?: Emoji[];
};
const groups = [
  "Rostos e emoções",
  "Pessoas e corpo",
  "Tons de pele",
  "Animais e natureza",
  "Comidas e bebidas",
  "Viagens e lugares",
  "Atividades",
  "Objetos",
  "Símbolos",
  "Bandeiras",
];
const icons = [
  Smile,
  Hand,
  Hand,
  Leaf,
  Coffee,
  Car,
  Trophy,
  Lightbulb,
  Heart,
  Flag,
];
export const MOTION_EMOJIS = [
  "👋",
  "❤️",
  "😂",
  "🎉",
  "🔥",
  "👏",
  "🥳",
  "💡",
  "🚀",
  "🤔",
  "😍",
  "👍",
];
const normalize = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const RECENT = "enturma-recent-emojis:v1";
let dataset: Promise<Emoji[]> | undefined;
const load = () =>
  (dataset ??= import("emojibase-data/pt/compact.json").then((m) =>
    (m.default as Emoji[])
      .filter((e) => e.group !== undefined)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  ));

export function AnimatedEmoji({
  value,
  large = false,
}: {
  value: string;
  large?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !MOTION_EMOJIS.includes(value)) return;
    let animation: Animation | undefined;
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      animation = playMotion(
        el,
        value === "❤️" || value === "😍"
          ? [
              { transform: "scale(1)" },
              { transform: "scale(1.22)", offset: 0.25 },
              { transform: "scale(.96)", offset: 0.5 },
              { transform: "scale(1.14)", offset: 0.7 },
              { transform: "scale(1)" },
            ]
          : [
              { transform: "translateY(0) rotate(0)" },
              { transform: "translateY(-5px) rotate(-14deg)" },
              { transform: "translateY(-2px) rotate(12deg)" },
              { transform: "translateY(0) rotate(0)" },
            ],
        { duration: 950, iterations: 2 },
      );
      observer.disconnect();
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      animation?.cancel();
    };
  }, [value]);
  return (
    <span
      ref={ref}
      className={large ? "emoji-glyph emoji-large" : "emoji-glyph"}
    >
      {value}
    </span>
  );
}

const graphemes = new Intl.Segmenter("pt", { granularity: "grapheme" });
export function emojiOnly(text: string) {
  const trimmed = text.trim();
  const parts = Array.from(graphemes.segment(trimmed), (p) => p.segment);
  return parts.length > 0 &&
    parts.length <= 3 &&
    parts.every((p) =>
      /\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20e3/u.test(p),
    )
    ? parts
    : null;
}
export function EmojiText({ text }: { text: string }) {
  const parts = emojiOnly(text);
  if (parts)
    return (
      <span className="emoji-message">
        {parts.map((p, i) => (
          <AnimatedEmoji key={`${i}-${p}`} value={p} large />
        ))}
      </span>
    );
  return <>{text}</>;
}

export function EmojiPicker({
  onSelect,
  disabled = false,
}: {
  onSelect: (emoji: string) => void;
  disabled?: boolean;
}) {
  const [emojis, setEmojis] = useState<Emoji[]>([]);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<number | "recent" | "animated">(0);
  const [tone, setTone] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const grid = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    load()
      .then((data) => {
        if (active) {
          setEmojis(data);
          setError(false);
          try {
            const saved = JSON.parse(localStorage.getItem(RECENT) || "[]");
            const valid = new Set(
              data
                .flatMap((e) => [e, ...(e.skins ?? [])])
                .map((e) => e.unicode),
            );
            if (Array.isArray(saved))
              setRecent(saved.filter((v) => valid.has(v)).slice(0, 32));
          } catch {
            /* Optional recents. */
          }
        }
      })
      .catch(() => {
        dataset = undefined;
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  const matches = useMemo(() => {
    const all = query.trim()
      ? emojis.flatMap((e) => [e, ...(e.skins ?? [])])
      : emojis;
    const q = normalize(query.trim());
    return all.filter((e) =>
      q
        ? normalize(
            `${e.label} ${(e.tags ?? []).join(" ")} ${e.unicode}`,
          ).includes(q)
        : group === "recent"
          ? recent.includes(e.unicode) ||
            e.skins?.some((s) => recent.includes(s.unicode))
          : group === "animated"
            ? MOTION_EMOJIS.includes(e.unicode)
            : e.group === group,
    );
  }, [emojis, query, group, recent]);
  const select = (value: string) => {
    const updated = [value, ...recent.filter((e) => e !== value)].slice(0, 32);
    setRecent(updated);
    try {
      localStorage.setItem(RECENT, JSON.stringify(updated));
    } catch {
      /* No storage. */
    }
    onSelect(value);
  };
  return (
    <section className="enturma-emoji-picker" aria-label="Escolher emoji">
      <nav className="emoji-categories" aria-label="Categorias de emojis">
        <button
          type="button"
          title="Recentes"
          aria-label="Recentes"
          aria-pressed={group === "recent"}
          onClick={() => {
            setGroup("recent");
            setQuery("");
          }}
        >
          <Clock size={19} />
        </button>
        {groups.map((name, i) => {
          const Icon = icons[i];
          return i === 2 ? null : (
            <button
              key={name}
              type="button"
              title={name}
              aria-label={name}
              aria-pressed={group === i}
              onClick={() => {
                setGroup(i);
                setQuery("");
                grid.current?.scrollTo(0, 0);
              }}
            >
              <Icon size={19} />
            </button>
          );
        })}
        <button
          type="button"
          title="Animados"
          aria-label="Animados"
          aria-pressed={group === "animated"}
          onClick={() => {
            setGroup("animated");
            setQuery("");
          }}
        >
          <Sparkles size={19} />
        </button>
      </nav>
      <label className="emoji-search">
        <Search size={18} />
        <span className="sr-only">Pesquisar emoji</span>
        <input
          type="search"
          placeholder="Pesquisar emoji"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            grid.current?.scrollTo(0, 0);
          }}
        />
      </label>
      <div className="emoji-picker-heading">
        <strong>
          {query
            ? "Resultados"
            : group === "recent"
              ? "Recentes"
              : group === "animated"
                ? "Animados do Enturma"
                : groups[group]}
        </strong>
        <label>
          <span className="sr-only">Tom de pele</span>
          <select
            aria-label="Tom de pele"
            value={tone}
            onChange={(e) => setTone(Number(e.target.value))}
          >
            {[
              "Original",
              "Clara",
              "Morena clara",
              "Morena",
              "Morena escura",
              "Escura",
            ].map((label, i) => (
              <option key={label} value={i}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error ? (
        <p role="alert">
          Não foi possível carregar os emojis.{" "}
          <button type="button" onClick={() => setAttempt((v) => v + 1)}>
            Tentar novamente
          </button>
        </p>
      ) : !emojis.length ? (
        <p role="status">Carregando emojis…</p>
      ) : (
        <div
          ref={grid}
          className="emoji-grid"
          onKeyDown={(event) => {
            if (
              ![
                "ArrowLeft",
                "ArrowRight",
                "ArrowUp",
                "ArrowDown",
                "Home",
                "End",
              ].includes(event.key)
            )
              return;
            const buttons = Array.from(
              event.currentTarget.querySelectorAll<HTMLButtonElement>("button"),
            );
            const index = buttons.indexOf(
              document.activeElement as HTMLButtonElement,
            );
            if (index < 0) return;
            const columns = Math.max(
              1,
              Math.round(
                event.currentTarget.clientWidth / buttons[0].offsetWidth,
              ),
            );
            const next =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? buttons.length - 1
                  : index +
                    (event.key === "ArrowLeft"
                      ? -1
                      : event.key === "ArrowRight"
                        ? 1
                        : event.key === "ArrowUp"
                          ? -columns
                          : columns);
            event.preventDefault();
            buttons[Math.max(0, Math.min(buttons.length - 1, next))]?.focus();
          }}
        >
          {(group === "recent" && !query
            ? recent.map((value) => ({
                unicode: value,
                label:
                  emojis
                    .flatMap((e) => [e, ...(e.skins ?? [])])
                    .find((e) => e.unicode === value)?.label ?? value,
              }))
            : matches.map((e) =>
                !query && tone && e.skins?.[tone - 1] ? e.skins[tone - 1] : e,
              )
          ).map((e) => (
            <button
              type="button"
              key={e.unicode}
              disabled={disabled}
              title={e.label}
              aria-label={e.label}
              onClick={() => select(e.unicode)}
            >
              {group === "animated" ? (
                <AnimatedEmoji value={e.unicode} />
              ) : (
                e.unicode
              )}
            </button>
          ))}
        </div>
      )}
      {!!emojis.length && !matches.length && (
        <p className="emoji-empty">
          {group === "recent"
            ? "Seus próximos emojis aparecem aqui."
            : "Nenhum emoji encontrado."}
        </p>
      )}
      {group === "animated" && (
        <small className="emoji-hint">
          Envie um emoji sozinho para vê-lo ganhar movimento.
        </small>
      )}
    </section>
  );
}
