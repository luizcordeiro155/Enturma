import storyboard from "./intro-storyboard.json";

export type IntroQuality = "high" | "optimized" | "low";
export type IntroPerson = { name: string; avatarUrl?: string };
export type IntroFeature = {
  id: string;
  title: string;
  description: string;
  href: string;
};
// These entries describe shipped routes; the scanner reads this manifest, never GitHub at runtime.
export const INTRO_FEATURES: IntroFeature[] = [
  {
    id: "subjects",
    title: "Matérias",
    description: "Organize o seu semestre",
    href: "/home#minhas-materias",
  },
  {
    id: "community",
    title: "Comunidade",
    description: "Compartilhe o que você aprende",
    href: "/forum",
  },
  {
    id: "rooms",
    title: "Salas de estudo",
    description: "Aprenda em boa companhia",
    href: "/rooms/new",
  },
  {
    id: "notebooks",
    title: "Cadernos IA",
    description: "Estude a partir dos seus materiais",
    href: "/notebooks",
  },
  {
    id: "rides",
    title: "Caronas",
    description: "Encontre companhia no caminho",
    href: "/caronas",
  },
  {
    id: "calls",
    title: "Chamadas",
    description: "Converse, mostre e colabore",
    href: "/friends",
  },
];
export type IntroProps = {
  user: IntroPerson | null;
  /** Only pass profiles the current viewer is allowed to see. Empty uses feature nodes. */
  students: IntroPerson[];
  subjects: string[];
  semester?: string;
  features: IntroFeature[];
  theme: "light" | "dark";
  quality: IntroQuality;
};
export const INTRO_STORAGE_KEY = "enturma-intro:v0.3";
export const INTRO_FRAMES = storyboard.durationInFrames;
export const INTRO_SCENE_FRAMES = storyboard.sceneFrames;
export const INTRO_NARRATION_FILE = storyboard.audioFile;
export const INTRO_CUES = storyboard.cues;
export const INTRO_BOOK_PAGES = INTRO_CUES.filter((cue) => cue.scene === 8);
const durationSeconds = INTRO_FRAMES / storyboard.fps;
export const INTRO_DURATION_LABEL = `${Math.floor(durationSeconds / 60)} min ${String(durationSeconds % 60).padStart(2, "0")} s`;
export function introTime(frame: number) {
  const seconds = Math.floor(frame / storyboard.fps);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
export function introNarrationAt(frame: number) {
  const position = Math.max(0, Math.min(INTRO_FRAMES - 1, frame));
  return [...INTRO_CUES].reverse().find((cue) => cue.fromFrame <= position)!
    .text;
}
export function introQuality(
  reduced: boolean,
  memory: number | undefined,
  cores: number,
  width: number,
): IntroQuality {
  if (reduced || (memory !== undefined && memory <= 2) || cores <= 2)
    return "low";
  return width < 900 || (memory !== undefined && memory <= 4) || cores <= 4
    ? "optimized"
    : "high";
}
export function introDimensions(width: number) {
  if (width < 480) return { width: 600, height: 860, layout: "portrait" };
  if (width < 760) return { width: 960, height: 600, layout: "landscape" };
  if (width > 1400) return { width: 1600, height: 640, layout: "ultrawide" };
  return { width: 1200, height: 675, layout: "desktop" };
}
