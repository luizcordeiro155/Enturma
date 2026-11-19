/** Profile cosmetics: what exists, what a profile has on, and how much room the art needs. */
export type CosmeticLayer = "frame" | "avatar" | "effect" | "theme";
export type CosmeticChoice = Partial<Record<CosmeticLayer, string>>;
export type CosmeticDetails = {
  cosmeticFrame?: string;
  cosmeticAvatar?: string;
  cosmeticEffect?: string;
  cosmeticTheme?: string;
};
export type Reach = { top: number; side: number; bottom: number };
type Drawing = CanvasRenderingContext2D;
export type CosmeticPack = {
  name: string;
  /** Room the frame needs around the card, at the size the art was drawn. */
  reach: Reach;
  /** The dark band the frame is drawn on, top to bottom. */
  mat: [string, string];
  /** The pack's own colours for the card: background, banner, avatar and button. */
  theme: Record<string, string>;
  ready?: boolean;
  init(): void;
  reset(): void;
  update(dt: number, t: number, still: boolean): void;
  drawFrame(ctx: Drawing, t: number, still: boolean): void;
  drawAvatar(ctx: Drawing, t: number, still: boolean): void;
  drawEffect(ctx: Drawing, t: number, still: boolean): void;
};
export type CardShape = { w: number; h: number; r: number };
type AvatarShape = { x: number; y: number; r: number };
type PackFactory = (card: CardShape, avatar: AvatarShape) => CosmeticPack;

/** Shown in this order in the editor; the level that opens each one comes from the server. */
export const COSMETIC_PACKS = [
  {
    id: "sakura",
    name: "Sakura",
    blurb: "Cerejeira em flor, lua cheia e um passarinho que pousa no galho.",
  },
  {
    id: "abobora",
    name: "Noite das Abóboras",
    blurb: "Morcegos, abóboras acesas, teia e um fantasminha curioso.",
  },
  {
    id: "dragao",
    name: "Dragão Imperial",
    blurb: "Um dragão chinês dá a volta no perfil, pousa e cospe fogo.",
  },
] as const;

export const COSMETIC_FIELDS = {
  frame: "cosmeticFrame",
  avatar: "cosmeticAvatar",
  effect: "cosmeticEffect",
  theme: "cosmeticTheme",
} as const;
export const COSMETIC_LAYERS = ["frame", "avatar", "effect", "theme"] as const;

// Each pack is its own chunk: a profile only downloads the art it shows.
const loaders: Record<string, () => Promise<{ default: unknown }>> = {
  sakura: () => import("./packs/sakura"),
  abobora: () => import("./packs/abobora"),
  dragao: () => import("./packs/dragao"),
};

export async function loadPack(id: string): Promise<PackFactory> {
  return (await loaders[id]()).default as PackFactory;
}

export function chosenCosmetics(details?: CosmeticDetails): CosmeticChoice {
  const chosen: CosmeticChoice = {};
  for (const layer of COSMETIC_LAYERS) {
    const id = details?.[COSMETIC_FIELDS[layer]];
    if (id && Object.hasOwn(loaders, id)) chosen[layer] = id;
  }
  return chosen;
}

/** The art was drawn for a wide card; narrower cards get it proportionally smaller. */
export function stageScale(width: number) {
  return Math.round(Math.max(0.5, Math.min(0.9, width / 760)) * 1000) / 1000;
}

/**
 * Room the card leaves for its frame. On a phone the profile keeps the full width, as profile
 * sheets do: the frame shows above and below it and runs off the sides of the screen.
 */
export function framePadding(
  reach: Reach,
  scale: number,
  narrow = false,
): Reach {
  return {
    top: Math.round(reach.top * scale),
    side: narrow ? 0 : Math.round(reach.side * scale),
    bottom: Math.round(reach.bottom * scale),
  };
}
