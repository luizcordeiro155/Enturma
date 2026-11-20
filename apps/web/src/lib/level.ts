/** What a profile knows about a student's level. Older answers carry only the first two. */
export type LevelStats = {
  totalXp: number;
  level: number;
  xpIntoLevel?: number;
  xpForNextLevel?: number;
  xpToday?: number;
  currentStreak?: number;
};

const SIZE = 250;
const round = (value: number) => Math.round(value * 10) / 10;

/**
 * The level as a bar: where it stands, what is left, and where today's XP began, so the part
 * earned today can be drawn (and animated) apart from the rest.
 */
export function levelProgress(stats: LevelStats) {
  const size =
    stats.xpForNextLevel && stats.xpForNextLevel > 0
      ? stats.xpForNextLevel
      : SIZE;
  const into = Math.min(
    size,
    Math.max(0, stats.xpIntoLevel ?? stats.totalXp % size),
  );
  const today = Math.max(0, stats.xpToday ?? 0);
  // More XP today than fits in this level means the level was reached today.
  const leveledUp = today > into;
  return {
    level: stats.level,
    into,
    size,
    left: size - into,
    percent: round((into / size) * 100),
    today,
    from: leveledUp ? 0 : round(((into - today) / size) * 100),
    leveledUp,
  };
}
