"use client";

import { useEffect, useRef, useState } from "react";
import { Flame } from "lucide-react";
import { levelProgress, type LevelStats } from "@/lib/level";
import { reducedMotion } from "@/lib/motion";
import "./level-meter.css";

const still = () => {
  try {
    return reducedMotion();
  } catch {
    // no media queries to ask (a test, an old webview): show the final state
    return true;
  }
};

/** Counts a number up to its new value in step with the bar, once the bar is being watched. */
function useCount(target: number, from: number, run: number, live: boolean) {
  const [shown, setShown] = useState(target);
  useEffect(() => {
    if (!live) {
      // not on screen yet: hold where the rise will start from
      const hold = requestAnimationFrame(() => setShown(from));
      return () => cancelAnimationFrame(hold);
    }
    if (still() || from === target) {
      const settle = requestAnimationFrame(() => setShown(target));
      return () => cancelAnimationFrame(settle);
    }
    const begin = requestAnimationFrame(() => setShown(from));
    // in step with the bar: the same wait, the same time, the same ease
    const started = performance.now() + 350;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - started) / 1500));
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      setShown(Math.round(from + (target - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(begin);
      cancelAnimationFrame(frame);
    };
    // one count per run of the bar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, live]);
  return still() ? target : shown;
}

/**
 * The level on a profile: an emblem with the number, a bar for the XP inside the level, and
 * what is left for the next one. XP earned today is drawn as its own brighter stretch that
 * rises when the profile opens, and again each time the XP goes up while it is open.
 */
export function LevelMeter({
  stats,
  streak,
}: {
  stats: LevelStats;
  /** "3 dias de sequência", when the profile shows it. */
  streak?: string;
}) {
  const p = levelProgress(stats);
  // What the bar showed last, to start the next rise from there.
  const [last, setLast] = useState({
    totalXp: stats.totalXp,
    level: p.level,
    percent: p.percent,
  });
  const [rise, setRise] = useState({
    run: 0,
    from: p.today > 0 ? p.from : 0,
    fromXp: p.today > 0 && !p.leveledUp ? p.into - p.today : 0,
    gained: 0,
  });
  if (last.totalXp !== stats.totalXp) {
    const up = stats.totalXp > last.totalXp;
    const sameLevel = p.level === last.level;
    setLast({ totalXp: stats.totalXp, level: p.level, percent: p.percent });
    setRise({
      run: rise.run + 1,
      from: up && sameLevel ? last.percent : 0,
      fromXp: up && sameLevel ? Math.round((last.percent / 100) * p.size) : 0,
      gained: up ? stats.totalXp - last.totalXp : 0,
    });
  }
  // The rise waits until the meter can be seen: on screen, and with the app's opening out of
  // the way. XP going up is something to be watched.
  const root = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);
  useEffect(() => {
    const node = root.current;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let frame = 0;
    const go = () => {
      if (document.querySelector(".enturma-launch-overlay")) {
        timer = setTimeout(go, 150);
        return;
      }
      frame = requestAnimationFrame(() => setLive(true));
    };
    const watcher =
      node && typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              if (!entries.some((entry) => entry.isIntersecting)) return;
              watcher?.disconnect();
              go();
            },
            { threshold: 0.6 },
          )
        : undefined;
    if (watcher && node) watcher.observe(node);
    else go();
    return () => {
      watcher?.disconnect();
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, []);
  const count = useCount(p.into, rise.fromXp, rise.run, live);
  const moving = p.percent > rise.from;
  return (
    <div
      ref={root}
      className="level-meter"
      data-live={live || undefined}
      data-today={p.today > 0 || undefined}
      data-leveled-up={p.leveledUp || undefined}
      style={
        {
          "--level-from": `${rise.from}%`,
          "--level-to": `${p.percent}%`,
          // how much of the filled bar was already there before this rise
          "--level-cover": `${p.percent > 0 ? Math.round((rise.from / p.percent) * 1000) / 10 : 0}%`,
        } as React.CSSProperties
      }
    >
      <div className="level-emblem" aria-hidden="true" key={`e${p.level}`}>
        <small>Nv</small>
        <strong>{p.level}</strong>
      </div>
      <div className="level-body">
        <div className="level-head">
          <strong>Nível {p.level}</strong>
          {p.leveledUp ? (
            <span className="level-chip level-chip-up">
              Subiu de nível hoje
            </span>
          ) : null}
          {p.today > 0 ? (
            <span className="level-chip">+{p.today} XP hoje</span>
          ) : null}
        </div>
        <div
          className="level-track"
          role="progressbar"
          aria-label={`Progresso do nível ${p.level}`}
          aria-valuemin={0}
          aria-valuemax={p.size}
          aria-valuenow={p.into}
          aria-valuetext={`${p.into} de ${p.size} XP`}
        >
          {/* a new key restarts the rise */}
          <span className="level-base" />
          {moving ? <span className="level-gain" key={`g${rise.run}`} /> : null}
          {rise.gained > 0 ? (
            <span className="level-pop" role="status" key={`p${rise.run}`}>
              +{rise.gained} XP
            </span>
          ) : null}
        </div>
        <p className="level-foot">
          <span>
            <b>{count}</b> de {p.size} XP
          </span>
          <span>
            Faltam {p.left} XP para o nível {p.level + 1}
          </span>
        </p>
        {streak ? (
          <p className="level-streak">
            <Flame size={14} aria-hidden="true" /> {streak}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** The level as a small badge beside the @: the number inside a ring that shows the progress. */
export function LevelBadge({ stats }: { stats: LevelStats }) {
  const p = levelProgress(stats);
  return (
    <span
      className="level-badge"
      aria-label={`Nível ${p.level}, ${p.into} de ${p.size} XP`}
      title={`Nível ${p.level}: faltam ${p.left} XP para o próximo`}
      style={{ "--level-to": `${p.percent}%` } as React.CSSProperties}
    >
      <small aria-hidden="true">Nv</small>
      <strong aria-hidden="true">{p.level}</strong>
    </span>
  );
}
