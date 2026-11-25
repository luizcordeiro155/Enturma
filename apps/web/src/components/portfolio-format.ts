import type { JourneyEntry } from "@/lib/portfolio-journey";
import type { Project } from "@/lib/portfolio-projects";
import type { PortfolioAsset } from "./portfolio-attachments";

export type Portfolio = {
  id: string;
  name: string;
  username: string;
  bio?: string;
  accentColor?: string;
  hasAvatar?: boolean;
  hasBanner?: boolean;
  assets: PortfolioAsset[];
  publicProfile: boolean;
  headline: string;
  summary: string;
  goal?: string;
  /** The area the portfolio is shaped for; absent when the server is older than areas. */
  track?: string;
  /** Owner only: the area the student chose, what the course alone would give, and the course. */
  trackChoice?: string | null;
  courseTrack?: string;
  course?: string | null;
  /** Owner only: the connected GitHub account, or null when there is none. */
  github?: { login: string; auto: boolean } | null;
  skills: string[];
  projects: Project[];
  /** Visitors only: the timeline records the student chose to show. */
  journey?: JourneyEntry[];
  subjects: { name: string }[];
  achievements: { name: string; description: string; tier: string }[];
  stats: { totalXp: number; currentStreak: number };
  studyMinutes: number;
};

/** "446.73" minutes reads as "7 h 27 min"; short sessions stay in minutes. */
export function formatStudyTime(minutes: number) {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function formatDays(days: number) {
  const value = Math.max(0, Math.round(Number(days) || 0));
  return `${value} ${value === 1 ? "dia" : "dias"}`;
}
