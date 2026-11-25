import {
  BookOpen,
  BriefcaseBusiness,
  Code2,
  Cog,
  FlaskConical,
  GraduationCap,
  HeartPulse,
  Megaphone,
  Palette,
  Scale,
  type LucideIcon,
} from "lucide-react";
import type { TrackId } from "@/lib/portfolio-tracks";

const ICONS: Record<TrackId, LucideIcon> = {
  TECH: Code2,
  HEALTH: HeartPulse,
  LAW: Scale,
  BUSINESS: BriefcaseBusiness,
  ENGINEERING: Cog,
  DESIGN: Palette,
  COMMUNICATION: Megaphone,
  EDUCATION: BookOpen,
  SCIENCE: FlaskConical,
  GENERAL: GraduationCap,
};

/** The symbol of a portfolio's area. Decoration: the area's name is always written beside it. */
export function TrackIcon({ track, size }: { track: TrackId; size: number }) {
  const Icon = ICONS[track];
  return <Icon size={size} aria-hidden="true" />;
}
