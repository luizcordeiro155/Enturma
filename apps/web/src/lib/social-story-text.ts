import type { StoryOverlay } from "./social";

/** Typefaces a Story text can use. The faces themselves are loaded with the text layer. */
export const STORY_FONTS = [
  { id: "CLASSIC", label: "Clássica" },
  { id: "EDITORIAL", label: "Editorial" },
  { id: "HAND", label: "Manuscrita" },
  { id: "POSTER", label: "Cartaz" },
  { id: "MONO", label: "Máquina" },
  { id: "ROUND", label: "Redonda" },
] as const;
export type StoryFont = (typeof STORY_FONTS)[number]["id"];

/** How a text stands out from the photo behind it. */
export const STORY_LOOKS = [
  { id: "PLAIN", label: "Sem destaque" },
  { id: "FILL", label: "Destaque cheio" },
  { id: "SOFT", label: "Destaque suave" },
  { id: "OUTLINE", label: "Contorno" },
] as const;
export type StoryLook = (typeof STORY_LOOKS)[number]["id"];

export const STORY_ALIGNS = [
  { id: "LEFT", label: "À esquerda" },
  { id: "CENTER", label: "Centralizado" },
  { id: "RIGHT", label: "À direita" },
] as const;
export type StoryAlign = (typeof STORY_ALIGNS)[number]["id"];

export const STORY_COLORS = [
  { value: "#ffffff", label: "Branco" },
  { value: "#111111", label: "Preto" },
  { value: "#d8ef79", label: "Verde-limão" },
  { value: "#1f8a70", label: "Verde" },
  { value: "#ff5a5f", label: "Vermelho" },
  { value: "#ff9f1c", label: "Laranja" },
  { value: "#ffd23f", label: "Amarelo" },
  { value: "#3a86ff", label: "Azul" },
  { value: "#8338ec", label: "Roxo" },
  { value: "#ff66c4", label: "Rosa" },
] as const;

export const STORY_STICKERS = [
  "📚",
  "🎓",
  "✨",
  "💡",
  "💚",
  "🔥",
  "🎉",
  "❤️",
  "😂",
  "👏",
  "📌",
  "☕",
  "🧠",
  "🏆",
  "🚀",
  "✅",
] as const;

/** Sizes and positions are fractions of the Story frame, so every screen shows the same layout. */
export const STORY_LIMITS = {
  items: 12,
  text: 280,
  min: 0.04,
  max: 0.96,
  minSize: 0.035,
  maxSize: 0.22,
} as const;

const DEFAULT_SIZE = 0.075;
const WORD = "\\p{L}\\p{M}\\p{N}_";

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));
const finite = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const round = (value: number, places = 4) => Number(value.toFixed(places));
const oneOf = <T extends string>(
  list: readonly { id: T }[],
  value: unknown,
  fallback: T,
): T => (list.some((entry) => entry.id === value) ? (value as T) : fallback);

export function newStoryText(
  text = "",
  patch: Partial<StoryOverlay> = {},
): StoryOverlay {
  return {
    text,
    x: 0.5,
    y: 0.42,
    size: DEFAULT_SIZE,
    font: "CLASSIC",
    color: "#ffffff",
    style: "PLAIN",
    align: "CENTER",
    rotation: 0,
    ...patch,
  };
}

const SPOTS = [0.42, 0.56, 0.28, 0.7, 0.16, 0.84];

/** A height for a new text where it does not land on top of one already there. */
export function freeStorySpot(items: readonly StoryOverlay[]): number {
  const taken = (y: number) =>
    items.some(
      (item) => Math.abs(item.x - 0.5) < 0.2 && Math.abs(item.y - y) < 0.07,
    );
  return SPOTS.find((y) => !taken(y)) ?? SPOTS[items.length % SPOTS.length];
}

/** Degrees kept within -180..180, so a full turn is the same as no turn. */
function turn(degrees: number) {
  const wrapped = ((((degrees + 180) % 360) + 360) % 360) - 180;
  return wrapped === -180 ? 180 : Math.round(wrapped);
}

/** Every value a text can carry, valid. Texts from before styles keep the soft highlight they had. */
export function styledStoryText(item: StoryOverlay): Required<StoryOverlay> {
  const legacy = item.style === undefined;
  return {
    text: item.text,
    x: clamp(finite(item.x, 0.5), STORY_LIMITS.min, STORY_LIMITS.max),
    y: clamp(finite(item.y, 0.42), STORY_LIMITS.min, STORY_LIMITS.max),
    size: clamp(
      finite(item.size, legacy ? 0.052 : DEFAULT_SIZE),
      STORY_LIMITS.minSize,
      STORY_LIMITS.maxSize,
    ),
    font: oneOf(STORY_FONTS, item.font, "CLASSIC"),
    color: /^#[0-9a-f]{6}$/i.test(item.color ?? "")
      ? item.color!.toLowerCase()
      : "#ffffff",
    style: oneOf(STORY_LOOKS, item.style, legacy ? "SOFT" : "PLAIN"),
    align: oneOf(STORY_ALIGNS, item.align, "CENTER"),
    rotation: turn(finite(item.rotation, 0)),
  };
}

/** What is saved with the Story: no empty texts, nothing past the limits. */
export function cleanStoryTexts(
  items: readonly StoryOverlay[],
): StoryOverlay[] {
  return items
    .map((item) => ({
      ...styledStoryText(item),
      text: (item.text ?? "").trim().slice(0, STORY_LIMITS.text),
    }))
    .filter((item) => item.text)
    .slice(0, STORY_LIMITS.items);
}

const SNAP = 0.012;

/** Move by a drag measured in pixels of the frame; near the middle it settles on the centre. */
export function dragStoryText(
  start: StoryOverlay,
  dx: number,
  dy: number,
  frame: { width: number; height: number },
) {
  let x = clamp(
    start.x + dx / Math.max(1, frame.width),
    STORY_LIMITS.min,
    STORY_LIMITS.max,
  );
  let y = clamp(
    start.y + dy / Math.max(1, frame.height),
    STORY_LIMITS.min,
    STORY_LIMITS.max,
  );
  const centerX = Math.abs(x - 0.5) <= SNAP,
    centerY = Math.abs(y - 0.5) <= SNAP;
  if (centerX) x = 0.5;
  if (centerY) y = 0.5;
  return { item: { ...start, x: round(x), y: round(y) }, centerX, centerY };
}

/** Move by a fraction of the frame, exactly: keys place a text without the pull of the centre. */
export function nudgeStoryText(
  start: StoryOverlay,
  dx: number,
  dy: number,
): StoryOverlay {
  return {
    ...start,
    x: round(clamp(start.x + dx, STORY_LIMITS.min, STORY_LIMITS.max)),
    y: round(clamp(start.y + dy, STORY_LIMITS.min, STORY_LIMITS.max)),
  };
}

/** Pinch or handle: scale the size and turn the text; almost level settles on level. */
export function transformStoryText(
  start: StoryOverlay,
  scale: number,
  degrees: number,
) {
  const base = styledStoryText(start);
  const rotation = turn(base.rotation + degrees);
  return {
    ...start,
    size: round(
      clamp(
        base.size * (Number.isFinite(scale) ? scale : 1),
        STORY_LIMITS.minSize,
        STORY_LIMITS.maxSize,
      ),
    ),
    rotation: Math.abs(rotation) <= 3 ? 0 : rotation,
  };
}

/** Black or white, whichever reads better over the colour. */
export function inkOn(color: string): "#111111" | "#ffffff" {
  const hex = /^#([0-9a-f]{6})$/i.exec(color)?.[1];
  if (!hex) return "#111111";
  const [r, g, b] = [0, 2, 4].map((at) => {
    const channel = parseInt(hex.slice(at, at + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.3 ? "#111111" : "#ffffff";
}

export type StoryToken = {
  kind: "@" | "#";
  query: string;
  start: number;
  end: number;
};

/** The @mention or #hashtag being typed at the caret; e-mails are left alone. */
export function tokenAt(value: string, caret: number): StoryToken | null {
  const match = new RegExp(`(?:^|[\\s(])([@#])([${WORD}]*)$`, "u").exec(
    value.slice(0, caret),
  );
  if (!match) return null;
  const after =
    new RegExp(`^[${WORD}]*`, "u").exec(value.slice(caret))?.[0].length ?? 0;
  return {
    kind: match[1] as "@" | "#",
    query: match[2],
    start: caret - match[2].length - 1,
    end: caret + after,
  };
}

/** Start a mention or hashtag at the caret, spaced from the word before it. */
export function insertToken(value: string, caret: number, sign: "@" | "#") {
  const before = value.slice(0, caret),
    lead = before && !/\s$/.test(before) ? " " : "";
  return {
    value: before + lead + sign + value.slice(caret),
    caret: caret + lead.length + 1,
  };
}

/** Swap the token being typed for the chosen person or tag and leave the caret after it. */
export function replaceToken(
  value: string,
  token: StoryToken,
  replacement: string,
) {
  const rest = value.slice(token.end),
    spaced = /^\s/.test(rest) ? rest : ` ${rest}`;
  return {
    value: value.slice(0, token.start) + replacement + spaced,
    caret: token.start + replacement.length + 1,
  };
}

export type StoryTextPart =
  | { kind: "text"; value: string }
  | { kind: "@" | "#"; value: string; name: string };

/** A text cut into plain stretches, @mentions and #hashtags, in order. */
export function storyTextParts(text: string): StoryTextPart[] {
  const parts: StoryTextPart[] = [];
  let offset = 0;
  for (const match of text.matchAll(
    new RegExp(`(?<![${WORD}@#])[@#][\\p{L}\\p{N}_]{1,40}`, "gu"),
  )) {
    if (match.index! > offset)
      parts.push({ kind: "text", value: text.slice(offset, match.index) });
    parts.push({
      kind: match[0][0] as "@" | "#",
      value: match[0],
      name: match[0].slice(1).toLowerCase(),
    });
    offset = match.index! + match[0].length;
  }
  if (offset < text.length)
    parts.push({ kind: "text", value: text.slice(offset) });
  return parts;
}
