"use client";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  ALargeSmall,
  AlignCenter,
  AlignLeft,
  AlignRight,
  AtSign,
  Check,
  Copy,
  Hash,
  Highlighter,
  Palette,
  Scaling,
  Smile,
  Trash2,
  Type,
} from "lucide-react";
import { api } from "@/lib/api";
import type { SocialPerson, StoryOverlay } from "@/lib/social";
import {
  STORY_ALIGNS,
  STORY_COLORS,
  STORY_FONTS,
  STORY_LIMITS,
  STORY_LOOKS,
  STORY_STICKERS,
  cleanStoryTexts,
  dragStoryText,
  freeStorySpot,
  insertToken,
  newStoryText,
  nudgeStoryText,
  replaceToken,
  styledStoryText,
  tokenAt,
  transformStoryText,
} from "@/lib/social-story-text";
import { Avatar } from "../user-identity";
import { SocialDialog } from "./social-dialog";
import type { SocialHashtag } from "./social-hashtag";
import { StoryTextContent, storyTextStyle } from "./story-decorations";

type Tool = "font" | "color" | "look" | "align" | "size" | "sticker";
type Gesture = {
  index: number;
  mode: "move" | "handle" | "pinch";
  start: StoryOverlay;
  x: number;
  y: number;
  moved: boolean;
  wasSelected: boolean;
  distance: number;
  angle: number;
  center: { x: number; y: number };
};
type Suggestions =
  | { key: string; kind: "@"; people: SocialPerson[] }
  | { key: string; kind: "#"; tags: SocialHashtag[] };

const ALIGN_ICONS = {
  LEFT: AlignLeft,
  CENTER: AlignCenter,
  RIGHT: AlignRight,
} as const;
const degrees = (radians: number) => (radians * 180) / Math.PI;

/**
 * Full-screen place to write over a Story: add texts, drag them, pinch to resize and turn,
 * choose font, colour and highlight, and mark people and subjects.
 */
export function StoryTextStudio({
  items,
  change,
  close,
  ratio,
  background,
  write: writeAt,
}: {
  items: StoryOverlay[];
  change: (items: StoryOverlay[]) => void;
  close: () => void;
  /** Width over height of the Story frame the texts sit on. */
  ratio: number;
  background?: ReactNode;
  /** Index of a text to open already in writing, as when it was just added. */
  write?: number;
}) {
  const opening = writeAt !== undefined && items[writeAt] ? writeAt : null;
  const [selected, setSelected] = useState<number | null>(opening);
  const [typing, setTyping] = useState(opening !== null);
  const [tool, setTool] = useState<Tool>("font");
  const [guide, setGuide] = useState({ x: false, y: false });
  const [caret, setCaret] = useState(
    opening === null ? 0 : items[opening].text.length,
  );
  const [found, setFound] = useState<Suggestions>();
  const canvas = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<Gesture | null>(null);
  const emptyTap = useRef(false);
  const pendingCaret = useRef<number | null>(
    opening === null ? null : items[opening].text.length,
  );

  const current = selected === null ? undefined : items[selected];
  const look = current ? styledStoryText(current) : undefined;
  const full = items.length >= STORY_LIMITS.items;

  function update(index: number, patch: Partial<StoryOverlay>) {
    change(
      items.map((item, at) => (at === index ? { ...item, ...patch } : item)),
    );
  }
  function add(item: StoryOverlay, write: boolean) {
    if (full) return;
    change([...items, item]);
    setSelected(items.length);
    setTyping(write);
    setTool("font");
    if (write) pendingCaret.current = item.text.length;
  }
  function remove(index: number) {
    change(items.filter((_, at) => at !== index));
    setSelected(null);
    setTyping(false);
  }
  function write(index: number, at?: number) {
    setSelected(index);
    setTyping(true);
    pendingCaret.current = at ?? items[index]?.text.length ?? 0;
  }
  function finishTyping() {
    if (selected !== null && items[selected]) {
      const text = items[selected].text.trim();
      if (!text) {
        remove(selected);
        return;
      }
      if (text !== items[selected].text) update(selected, { text });
    }
    setTyping(false);
  }
  function mark(sign: "@" | "#") {
    if (typing && selected !== null && current) {
      const next = insertToken(
        current.text,
        field.current?.selectionStart ?? current.text.length,
        sign,
      );
      if (next.value.length > STORY_LIMITS.text) return;
      update(selected, { text: next.value });
      pendingCaret.current = next.caret;
      setCaret(next.caret);
    } else if (selected !== null && current) {
      const next = insertToken(current.text, current.text.length, sign);
      if (next.value.length > STORY_LIMITS.text) return;
      update(selected, { text: next.value });
      write(selected, next.caret);
      setCaret(next.caret);
    } else {
      add(newStoryText(sign, { y: freeStorySpot(items) }), true);
      setCaret(1);
    }
  }
  function done() {
    change(cleanStoryTexts(items));
    close();
  }

  // The field takes the focus when writing starts, and the caret goes where an edit left it.
  useEffect(() => {
    if (!typing) return;
    const input = field.current,
      at = pendingCaret.current;
    if (!input) return;
    pendingCaret.current = null;
    input.focus({ preventScroll: true });
    if (at !== null) input.setSelectionRange(at, at);
  }, [typing, selected, current?.text]);

  const token = typing && current ? tokenAt(current.text, caret) : null;
  const tokenKey = token ? `${token.kind}${token.query}` : "";
  useEffect(() => {
    if (!tokenKey) return;
    let alive = true;
    const kind = tokenKey[0] as "@" | "#",
      query = tokenKey.slice(1);
    const timer = setTimeout(() => {
      const request =
        kind === "@"
          ? api<SocialPerson[]>(
              `/social/people/mentions?q=${encodeURIComponent(query)}`,
              {
                cache: "no-store",
              },
            ).then((people): Suggestions => ({
              key: tokenKey,
              kind,
              people: (Array.isArray(people) ? people : [])
                .filter((person) => person.username)
                .slice(0, 8),
            }))
          : api<SocialHashtag[]>(
              query
                ? `/social/hashtags?q=${encodeURIComponent(query.toLowerCase())}`
                : "/social/hashtags",
              { cache: "no-store" },
            ).then((tags): Suggestions => ({
              key: tokenKey,
              kind,
              tags: (Array.isArray(tags) ? tags : []).slice(0, 8),
            }));
      request
        .then((result) => {
          if (alive) setFound(result);
        })
        .catch(() => {
          if (alive) setFound(undefined);
        });
    }, 250);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [tokenKey]);
  const suggestions = token && found?.key === tokenKey ? found : undefined;
  function choose(replacement: string) {
    if (!token || selected === null || !current) return;
    const next = replaceToken(current.text, token, replacement);
    if (next.value.length > STORY_LIMITS.text) return;
    update(selected, { text: next.value });
    pendingCaret.current = next.caret;
    setCaret(next.caret);
  }

  function down(event: PointerEvent<HTMLDivElement>) {
    if (typing) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const target = event.target as HTMLElement;
    const element = target.closest<HTMLElement>("[data-story-item]");
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    event.currentTarget.setPointerCapture?.(event.pointerId);
    if (pointers.current.size === 2) {
      // A second finger anywhere on the frame resizes and turns the text in hand.
      const index = gesture.current?.index ?? selected;
      if (index === null || index === undefined || !items[index]) return;
      const [a, b] = [...pointers.current.values()];
      emptyTap.current = false;
      gesture.current = {
        index,
        mode: "pinch",
        start: items[index],
        x: a.x,
        y: a.y,
        moved: true,
        wasSelected: true,
        distance: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)),
        angle: Math.atan2(b.y - a.y, b.x - a.x),
        center: a,
      };
      setSelected(index);
      return;
    }
    if (!element) {
      gesture.current = null;
      emptyTap.current = true;
      return;
    }
    const index = Number(element.dataset.storyItem);
    if (!items[index]) return;
    const box = element.getBoundingClientRect();
    const center = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    emptyTap.current = false;
    gesture.current = {
      index,
      mode: target.closest("[data-story-handle]") ? "handle" : "move",
      start: items[index],
      x: event.clientX,
      y: event.clientY,
      moved: false,
      wasSelected: selected === index,
      distance: Math.max(
        1,
        Math.hypot(event.clientX - center.x, event.clientY - center.y),
      ),
      angle: Math.atan2(event.clientY - center.y, event.clientX - center.x),
      center,
    };
    setSelected(index);
    element.focus({ preventScroll: true });
    event.preventDefault();
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const active = gesture.current;
    if (!active || !pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (active.mode === "pinch") {
      const [a, b] = [...pointers.current.values()];
      if (!b) return;
      const next = transformStoryText(
        active.start,
        Math.hypot(b.x - a.x, b.y - a.y) / active.distance,
        degrees(Math.atan2(b.y - a.y, b.x - a.x) - active.angle),
      );
      update(active.index, { size: next.size, rotation: next.rotation });
      return;
    }
    if (active.mode === "handle") {
      active.moved = true;
      const next = transformStoryText(
        active.start,
        Math.hypot(
          event.clientX - active.center.x,
          event.clientY - active.center.y,
        ) / active.distance,
        degrees(
          Math.atan2(
            event.clientY - active.center.y,
            event.clientX - active.center.x,
          ) - active.angle,
        ),
      );
      update(active.index, { size: next.size, rotation: next.rotation });
      return;
    }
    const dx = event.clientX - active.x,
      dy = event.clientY - active.y;
    if (!active.moved && Math.hypot(dx, dy) < 4) return;
    active.moved = true;
    const bounds = canvas.current!.getBoundingClientRect();
    const next = dragStoryText(active.start, dx, dy, bounds);
    update(active.index, { x: next.item.x, y: next.item.y });
    setGuide({ x: next.centerX, y: next.centerY });
  }
  function up(event: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.delete(event.pointerId);
    const active = gesture.current;
    if (pointers.current.size) {
      // One finger left after a pinch: it goes on moving the same text.
      const [rest] = [...pointers.current.values()];
      if (active && items[active.index])
        gesture.current = {
          ...active,
          mode: "move",
          start: items[active.index],
          x: rest.x,
          y: rest.y,
          moved: true,
        };
      return;
    }
    gesture.current = null;
    setGuide({ x: false, y: false });
    if (active?.mode === "move" && !active.moved && active.wasSelected)
      write(active.index);
    else if (!active && emptyTap.current) setSelected(null);
    emptyTap.current = false;
  }
  function cancel() {
    pointers.current.clear();
    gesture.current = null;
    emptyTap.current = false;
    setGuide({ x: false, y: false });
  }
  function itemKey(event: KeyboardEvent<HTMLElement>, index: number) {
    const item = items[index],
      step = event.shiftKey ? 0.05 : 0.01;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const turned = (by: number) =>
      styledStoryText({
        ...item,
        rotation: styledStoryText(item).rotation + by,
      }).rotation;
    if (moves[event.key]) {
      const next = nudgeStoryText(item, ...moves[event.key]);
      update(index, { x: next.x, y: next.y });
      setSelected(index);
    } else if (event.key === "+" || event.key === "=") {
      update(index, { size: transformStoryText(item, 1.08, 0).size });
      setSelected(index);
    } else if (event.key === "-" || event.key === "_") {
      update(index, { size: transformStoryText(item, 1 / 1.08, 0).size });
      setSelected(index);
    } else if (event.key === "[" || event.key === "]") {
      update(index, { rotation: turned(event.key === "[" ? -5 : 5) });
      setSelected(index);
    } else if (event.key === "Enter" || event.key === "F2") write(index);
    else if (event.key === "Delete" || event.key === "Backspace") remove(index);
    else if (event.key === "Escape" && selected !== null) setSelected(null);
    else return;
    event.preventDefault();
    event.stopPropagation();
  }

  const group = (name: Tool) => ({
    "data-group": name,
    "data-open": tool === name ? "true" : "false",
  });
  const toggle = (name: Tool, label: string, icon: ReactNode) => (
    <button
      type="button"
      className="story-studio-switch"
      aria-pressed={tool === name}
      onPointerDown={(event) => event.preventDefault()}
      onClick={() => setTool(name)}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <SocialDialog title="Textos do Story" close={done} variant="studio">
      <div className="story-studio" data-typing={typing ? "true" : "false"}>
        <button
          type="button"
          className="story-studio-done"
          onPointerDown={(event) => event.preventDefault()}
          onClick={typing ? finishTyping : done}
        >
          <Check size={18} aria-hidden="true" />
          {typing ? "Pronto" : "Concluir"}
        </button>
        <div className="story-studio-stage">
          <div
            ref={canvas}
            className="story-studio-canvas"
            role="group"
            aria-label="Tela do Story"
            style={
              {
                "--story-ratio": ratio,
                aspectRatio: String(ratio),
              } as CSSProperties
            }
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={cancel}
          >
            <div className="story-studio-backdrop" aria-hidden="true">
              {background}
            </div>
            <div className="social-story-decorations story-studio-layer">
              {items.map((item, index) =>
                typing && index === selected ? null : (
                  <span
                    key={index}
                    className="story-text story-studio-item"
                    role="button"
                    tabIndex={0}
                    data-story-item={index}
                    aria-pressed={selected === index}
                    aria-label={`Texto ${index + 1}: ${item.text}`}
                    {...storyTextStyle(item)}
                    onClick={() => setSelected(index)}
                    onDoubleClick={() => write(index)}
                    onKeyDown={(event) => itemKey(event, index)}
                  >
                    <StoryTextContent text={item.text} />
                    {selected === index && (
                      <i
                        className="story-studio-handle"
                        data-story-handle
                        aria-hidden="true"
                      >
                        <Scaling size={14} />
                      </i>
                    )}
                  </span>
                ),
              )}
            </div>
            {guide.x && (
              <i
                className="story-studio-guide"
                data-axis="x"
                aria-hidden="true"
              />
            )}
            {guide.y && (
              <i
                className="story-studio-guide"
                data-axis="y"
                aria-hidden="true"
              />
            )}
            {typing && current && (
              <div
                className="story-studio-typing social-story-decorations"
                onPointerDown={(event) => {
                  if (event.target === event.currentTarget) {
                    event.preventDefault();
                    finishTyping();
                  }
                }}
              >
                <label
                  className="story-text story-studio-field"
                  data-value={`${current.text || "Escreva aqui"}​`}
                  {...(() => {
                    const { style, ...rest } = storyTextStyle(current);
                    return {
                      ...rest,
                      style: {
                        "--story-size": (style as Record<string, string>)[
                          "--story-size"
                        ],
                        "--story-ink": (style as Record<string, string>)[
                          "--story-ink"
                        ],
                        "--story-on": (style as Record<string, string>)[
                          "--story-on"
                        ],
                      } as CSSProperties,
                    };
                  })()}
                >
                  <textarea
                    ref={field}
                    aria-label="Texto do Story"
                    rows={1}
                    value={current.text}
                    maxLength={STORY_LIMITS.text}
                    placeholder="Escreva aqui"
                    enterKeyHint="enter"
                    autoCapitalize="sentences"
                    spellCheck
                    onChange={(event) => {
                      update(selected!, { text: event.target.value });
                      setCaret(
                        event.target.selectionStart ??
                          event.target.value.length,
                      );
                    }}
                    onSelect={(event) =>
                      setCaret(event.currentTarget.selectionStart ?? 0)
                    }
                    onKeyDown={(event) => {
                      if (event.key !== "Escape") return;
                      event.preventDefault();
                      event.stopPropagation();
                      finishTyping();
                    }}
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="story-studio-tools">
          {suggestions && (
            <div
              className="story-studio-suggestions"
              role="listbox"
              aria-label={
                suggestions.kind === "@"
                  ? "Pessoas para mencionar"
                  : "Hashtags para usar"
              }
            >
              {suggestions.kind === "@"
                ? suggestions.people.map((person) => (
                    <button
                      type="button"
                      role="option"
                      aria-selected="false"
                      key={person.id}
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={() => choose(`@${person.username}`)}
                    >
                      <Avatar user={person} />
                      <span>
                        <strong>@{person.username}</strong>
                        <small>{person.name}</small>
                      </span>
                    </button>
                  ))
                : suggestions.tags.map((entry) => (
                    <button
                      type="button"
                      role="option"
                      aria-selected="false"
                      key={entry.tag}
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={() => choose(`#${entry.tag}`)}
                    >
                      <span>
                        <strong>#{entry.tag}</strong>
                        <small>
                          {entry.posts}{" "}
                          {entry.posts === 1 ? "publicação" : "publicações"}
                        </small>
                      </span>
                    </button>
                  ))}
              {(suggestions.kind === "@"
                ? suggestions.people
                : suggestions.tags
              ).length === 0 && (
                <p role="status">
                  {suggestions.kind === "@"
                    ? token?.query
                      ? "Ninguém encontrado com esse nome."
                      : "Digite o nome ou o usuário de quem quer mencionar."
                    : "Continue digitando para criar essa hashtag."}
                </p>
              )}
            </div>
          )}

          {current && look ? (
            <>
              <div className="story-studio-options">
                <div role="radiogroup" aria-label="Fonte" {...group("font")}>
                  {STORY_FONTS.map((font) => (
                    <button
                      type="button"
                      role="radio"
                      key={font.id}
                      className="story-studio-font"
                      data-font={font.id}
                      aria-checked={look.font === font.id}
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={() => update(selected!, { font: font.id })}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
                <div
                  role="radiogroup"
                  aria-label="Cor do texto"
                  {...group("color")}
                >
                  {STORY_COLORS.map((color) => (
                    <button
                      type="button"
                      role="radio"
                      key={color.value}
                      className="story-studio-swatch"
                      aria-label={color.label}
                      aria-checked={look.color === color.value}
                      style={{ "--swatch": color.value } as CSSProperties}
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={() => update(selected!, { color: color.value })}
                    />
                  ))}
                  <label className="story-studio-swatch story-studio-custom">
                    <span>Outra cor</span>
                    <input
                      type="color"
                      aria-label="Outra cor"
                      value={look.color}
                      onChange={(event) =>
                        update(selected!, { color: event.target.value })
                      }
                    />
                  </label>
                </div>
                <div
                  role="radiogroup"
                  aria-label="Destaque do texto"
                  {...group("look")}
                >
                  {STORY_LOOKS.map((entry) => (
                    <button
                      type="button"
                      role="radio"
                      key={entry.id}
                      className="story-studio-look"
                      aria-checked={look.style === entry.id}
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={() => update(selected!, { style: entry.id })}
                    >
                      <i
                        className="story-text"
                        data-look={entry.id}
                        data-font="CLASSIC"
                        aria-hidden="true"
                      >
                        Aa
                      </i>
                      <span>{entry.label}</span>
                    </button>
                  ))}
                </div>
                <div
                  role="radiogroup"
                  aria-label="Alinhamento"
                  {...group("align")}
                >
                  {STORY_ALIGNS.map((entry) => {
                    const Icon = ALIGN_ICONS[entry.id];
                    return (
                      <button
                        type="button"
                        role="radio"
                        key={entry.id}
                        className="story-studio-align"
                        aria-label={entry.label}
                        aria-checked={look.align === entry.id}
                        onPointerDown={(event) => event.preventDefault()}
                        onClick={() => update(selected!, { align: entry.id })}
                      >
                        <Icon size={18} aria-hidden="true" />
                        <span aria-hidden="true">{entry.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="story-studio-sliders" {...group("size")}>
                  <label>
                    <span>Tamanho</span>
                    <input
                      type="range"
                      aria-label="Tamanho do texto"
                      min={STORY_LIMITS.minSize}
                      max={STORY_LIMITS.maxSize}
                      step={0.005}
                      value={look.size}
                      onChange={(event) =>
                        update(selected!, { size: Number(event.target.value) })
                      }
                    />
                  </label>
                  <label>
                    <span>Giro</span>
                    <input
                      type="range"
                      aria-label="Giro do texto"
                      min={-180}
                      max={180}
                      step={1}
                      value={look.rotation}
                      onChange={(event) =>
                        update(selected!, {
                          rotation: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                </div>
              </div>
              <div
                className="story-studio-bar"
                role="toolbar"
                aria-label="Ferramentas do texto"
              >
                {toggle("font", "Fonte", <Type size={18} aria-hidden="true" />)}
                {toggle(
                  "color",
                  "Cor",
                  <Palette size={18} aria-hidden="true" />,
                )}
                {toggle(
                  "look",
                  "Destaque",
                  <Highlighter size={18} aria-hidden="true" />,
                )}
                {toggle(
                  "align",
                  "Alinhar",
                  <AlignCenter size={18} aria-hidden="true" />,
                )}
                {toggle(
                  "size",
                  "Tamanho",
                  <ALargeSmall size={18} aria-hidden="true" />,
                )}
                <button
                  type="button"
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => mark("@")}
                >
                  <AtSign size={18} aria-hidden="true" />
                  <span>Mencionar</span>
                </button>
                <button
                  type="button"
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => mark("#")}
                >
                  <Hash size={18} aria-hidden="true" />
                  <span>Hashtag</span>
                </button>
                <button
                  type="button"
                  aria-label="Duplicar texto"
                  disabled={full}
                  onClick={() => {
                    const base = styledStoryText(current);
                    const copy = {
                      ...current,
                      y: Math.min(
                        STORY_LIMITS.max,
                        Number((base.y + 0.08).toFixed(4)),
                      ),
                    };
                    add(copy, false);
                  }}
                >
                  <Copy size={18} aria-hidden="true" />
                  <span>Duplicar</span>
                </button>
                <button
                  type="button"
                  className="story-studio-remove"
                  aria-label="Remover texto"
                  onClick={() => remove(selected!)}
                >
                  <Trash2 size={18} aria-hidden="true" />
                  <span>Remover</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="story-studio-options">
                <div role="group" aria-label="Adesivos" {...group("sticker")}>
                  {STORY_STICKERS.map((sticker) => (
                    <button
                      type="button"
                      key={sticker}
                      className="story-studio-sticker"
                      aria-label={`Adicionar adesivo ${sticker}`}
                      disabled={full}
                      onClick={() =>
                        add(
                          newStoryText(sticker, {
                            size: 0.16,
                            y: freeStorySpot(items),
                          }),
                          false,
                        )
                      }
                    >
                      {sticker}
                    </button>
                  ))}
                </div>
              </div>
              <p className="story-studio-hint">
                {full
                  ? `Você chegou ao limite de ${STORY_LIMITS.items} textos neste Story.`
                  : items.length
                    ? "Toque em um texto para selecionar e de novo para editar. Arraste para mover; com dois dedos, gire e mude o tamanho."
                    : "Escreva um texto, mencione alguém ou marque um assunto. Depois é só arrastar para o lugar."}
              </p>
              <div
                className="story-studio-bar"
                role="toolbar"
                aria-label="Adicionar ao Story"
              >
                <button
                  type="button"
                  disabled={full}
                  onClick={() =>
                    add(newStoryText("", { y: freeStorySpot(items) }), true)
                  }
                >
                  <Type size={18} aria-hidden="true" />
                  <span>Texto</span>
                </button>
                <button type="button" disabled={full} onClick={() => mark("@")}>
                  <AtSign size={18} aria-hidden="true" />
                  <span>Mencionar</span>
                </button>
                <button type="button" disabled={full} onClick={() => mark("#")}>
                  <Hash size={18} aria-hidden="true" />
                  <span>Hashtag</span>
                </button>
                <button
                  type="button"
                  aria-pressed={tool === "sticker"}
                  disabled={full}
                  onClick={() =>
                    setTool(tool === "sticker" ? "font" : "sticker")
                  }
                >
                  <Smile size={18} aria-hidden="true" />
                  <span>Adesivo</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </SocialDialog>
  );
}
