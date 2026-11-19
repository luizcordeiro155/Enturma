/** Profile cosmetics: what exists, what a profile has on, and how much room the art needs. */
export type CosmeticLayer = "frame" | "avatar" | "effect";
export type CosmeticChoice = Partial<Record<CosmeticLayer, string>>;
export type CosmeticDetails = {
  cosmeticFrame?: string;
  cosmeticAvatar?: string;
  cosmeticEffect?: string;
};
export type Reach = { top: number; side: number; bottom: number };
type Drawing = CanvasRenderingContext2D;
export type CosmeticPack = {
  name: string;
  /** Room the frame needs around the card, at the size the art was drawn. */
  reach: Reach;
  /** The dark band the frame is drawn on, top to bottom. */
  mat: [string, string];
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

/** The shelves of the editor, in the order they are shown. */
export const COSMETIC_GROUPS = [
  "Bichinhos",
  "Estações",
  "Datas comemorativas",
  "Cursos e casa",
  "Culturas",
  "Dinossauros",
  "Terror e fantasia",
] as const;

/**
 * Shown in this order in the editor; the level that opens each one comes from the server.
 * `colors` are the two profile colours (primary, accent) that go well with the pack: putting
 * the pack on applies them, and the student stays free to change them.
 */
export const COSMETIC_PACKS = [
  {
    id: "gato",
    name: "Gatinhos",
    blurb: "Gatos no topo do perfil, novelo de lã e um que dorme na almofada.",
    colors: ["#f08a4b", "#6a3d9a"],
    group: "Bichinhos",
  },
  {
    id: "cachorro",
    name: "Cachorrinhos",
    blurb: "Dois cachorros abanando o rabo, coleira, ossinhos e bolinha.",
    colors: ["#3f8fd6", "#e09a2b"],
    group: "Bichinhos",
  },
  {
    id: "coelhinho",
    name: "Coelhinho",
    blurb: "Coelho de cachecol azul, trevos e uma horta de cenouras.",
    colors: ["#4a9be0", "#3fae72"],
    group: "Bichinhos",
  },
  {
    id: "coelhinha",
    name: "Coelhinha",
    blurb: "Coelha de laço, fita rosa, margaridas e morangos.",
    colors: ["#ff7fb0", "#8b63d9"],
    group: "Bichinhos",
  },
  {
    id: "primavera",
    name: "Primavera",
    blurb:
      "Tulipas, borboletas que dão a volta no perfil e um passarinho que canta.",
    colors: ["#3fae72", "#f06a9b"],
    group: "Estações",
  },
  {
    id: "verao",
    name: "Verão",
    blurb:
      "Sol de óculos escuros, coqueiro, mar com veleiro e um golfinho que salta.",
    colors: ["#ff8f2e", "#12a3b8"],
    group: "Estações",
  },
  {
    id: "outono",
    name: "Outono",
    blurb: "Galhos de bordo, folhas caindo, esquilo com bolota e um ouriço.",
    colors: ["#d9632a", "#7a2e1e"],
    group: "Estações",
  },
  {
    id: "inverno",
    name: "Inverno",
    blurb: "Neve no topo do perfil, pinguim de gorro, boneco de neve e flocos.",
    colors: ["#3f8fd6", "#6a5fcf"],
    group: "Estações",
  },
  {
    id: "abobora",
    name: "Noite das Abóboras",
    blurb: "Morcegos, abóboras acesas, teia e um fantasminha curioso.",
    colors: ["#7a35a8", "#f07a1c"],
    group: "Datas comemorativas",
  },
  {
    id: "pascoa",
    name: "Páscoa",
    blurb:
      "Coelho com ovo pintado, pintinho saindo da casca e ovo de chocolate.",
    colors: ["#8a5cf6", "#f7a531"],
    group: "Datas comemorativas",
  },
  {
    id: "carnaval",
    name: "Carnaval",
    blurb: "Máscara de plumas, pandeiro, serpentinas, bandeirinhas e confete.",
    colors: ["#8e2de2", "#f2811c"],
    group: "Datas comemorativas",
  },
  {
    id: "natal",
    name: "Natal",
    blurb:
      "Guirlanda de pinheiro com luzes, rena de nariz vermelho e presentes.",
    colors: ["#c9302c", "#1a7a44"],
    group: "Datas comemorativas",
  },
  {
    id: "ano-novo",
    name: "Ano Novo",
    blurb:
      "Relógio à meia-noite, rolha que estoura, brinde e fogos de artifício.",
    colors: ["#28348f", "#c8901f"],
    group: "Datas comemorativas",
  },
  {
    id: "enturma",
    name: "Enturma",
    blurb:
      "Livro aberto com capelo, aviões de papel, louros e a chama da sequência.",
    colors: ["#7fa82a", "#1f5a43"],
    group: "Cursos e casa",
  },
  {
    id: "programacao",
    name: "Programação",
    blurb:
      "Notebook fazendo deploy, pato de borracha, histórico de git e um bug teimoso.",
    colors: ["#16a34a", "#1e3a5f"],
    group: "Cursos e casa",
  },
  {
    id: "games",
    name: "Games",
    blurb: "Controle, criatura em pixel, moedas, corações e barra de XP.",
    colors: ["#7c3aed", "#0891b2"],
    group: "Cursos e casa",
  },
  {
    id: "medicina",
    name: "Medicina",
    blurb:
      "Batimento cardíaco em volta do perfil, estetoscópio, DNA e cápsulas.",
    colors: ["#0d9488", "#be123c"],
    group: "Cursos e casa",
  },
  {
    id: "rosas",
    name: "Jardim de Rosas",
    blurb: "Roseira trepadeira com espinhos, rosas abrindo e pétalas ao vento.",
    colors: ["#be123c", "#1f5a34"],
    group: "Cursos e casa",
  },
  {
    id: "sakura",
    name: "Sakura",
    blurb: "Cerejeira em flor, lua cheia e um passarinho que pousa no galho.",
    colors: ["#e86a9a", "#6d4bc4"],
    group: "Culturas",
  },
  {
    id: "dragao",
    name: "Dragão Imperial",
    blurb: "Um dragão chinês dá a volta no perfil, pousa e cospe fogo.",
    colors: ["#c81d1d", "#3d1670"],
    group: "Culturas",
  },
  {
    id: "samurai",
    name: "Samurai",
    blurb:
      "Elmo com máscara, sol vermelho, corda sagrada e a katana que volta à bainha.",
    colors: ["#b3202a", "#2a2238"],
    group: "Culturas",
  },
  {
    id: "jdm",
    name: "Noite JDM",
    blurb: "Cupê esportivo chega de lado, néon, cidade à noite e conta-giros.",
    colors: ["#d91a72", "#0f8fc4"],
    group: "Culturas",
  },
  {
    id: "dino-fofinho",
    name: "Dino Fofinho",
    blurb:
      "Filhote de tiranossauro, tricerátops, pterodáctilo e um ovo chocando.",
    colors: ["#3fae72", "#e09a2b"],
    group: "Dinossauros",
  },
  {
    id: "dino-selvagem",
    name: "Dino Selvagem",
    blurb: "Tiranossauro que ruge, raptor à espreita, samambaias e âmbar.",
    colors: ["#4f7a2e", "#a84a16"],
    group: "Dinossauros",
  },
  {
    id: "mecha",
    name: "Mecha",
    blurb:
      "Robô que pousa com propulsores, drones, mira travando e painel de status.",
    colors: ["#2458d6", "#c9420f"],
    group: "Terror e fantasia",
  },
  {
    id: "masmorra",
    name: "Masmorra",
    blurb: "Tochas, correntes, slime, baú que se abre e poções borbulhando.",
    colors: ["#5a3fc4", "#b3801f"],
    group: "Terror e fantasia",
  },
  {
    id: "grimorio",
    name: "Grimório Arcano",
    blurb:
      "Livro de feitiços, círculo de runas, coruja, velas e bola de cristal.",
    colors: ["#6a3de8", "#128f88"],
    group: "Terror e fantasia",
  },
  {
    id: "tinta",
    name: "Tinta Sombria",
    blurb:
      "Tinta escorrendo, criaturas de nanquim, olhos que se abrem e mãos na poça.",
    colors: ["#8a7a52", "#1a1814"],
    group: "Terror e fantasia",
  },
  {
    id: "pesadelo",
    name: "Pesadelo",
    blurb:
      "Preto e branco: figura de capuz, corvos, árvores secas e olhos no escuro.",
    colors: ["#4a4a54", "#101014"],
    group: "Terror e fantasia",
  },
] as const;

export const COSMETIC_FIELDS = {
  frame: "cosmeticFrame",
  avatar: "cosmeticAvatar",
  effect: "cosmeticEffect",
} as const;
export const COSMETIC_LAYERS = ["frame", "avatar", "effect"] as const;

// Each pack is its own chunk: a profile only downloads the art it shows.
const loaders: Record<string, () => Promise<{ default: unknown }>> = {
  gato: () => import("./packs/gato"),
  cachorro: () => import("./packs/cachorro"),
  coelhinho: () => import("./packs/coelhinho"),
  coelhinha: () => import("./packs/coelhinha"),
  primavera: () => import("./packs/primavera"),
  verao: () => import("./packs/verao"),
  outono: () => import("./packs/outono"),
  inverno: () => import("./packs/inverno"),
  abobora: () => import("./packs/abobora"),
  pascoa: () => import("./packs/pascoa"),
  carnaval: () => import("./packs/carnaval"),
  natal: () => import("./packs/natal"),
  "ano-novo": () => import("./packs/ano-novo"),
  enturma: () => import("./packs/enturma"),
  programacao: () => import("./packs/programacao"),
  games: () => import("./packs/games"),
  medicina: () => import("./packs/medicina"),
  rosas: () => import("./packs/rosas"),
  sakura: () => import("./packs/sakura"),
  dragao: () => import("./packs/dragao"),
  samurai: () => import("./packs/samurai"),
  jdm: () => import("./packs/jdm"),
  "dino-fofinho": () => import("./packs/dino-fofinho"),
  "dino-selvagem": () => import("./packs/dino-selvagem"),
  mecha: () => import("./packs/mecha"),
  masmorra: () => import("./packs/masmorra"),
  grimorio: () => import("./packs/grimorio"),
  tinta: () => import("./packs/tinta"),
  pesadelo: () => import("./packs/pesadelo"),
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
