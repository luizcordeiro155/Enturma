"use client";
import { useEffect, useRef, useState } from "react";
import "./rotating-line.css";

export type RotatingEntry = {
  /** What the line is, not what it says: the same id updates in place. */
  id: string;
  text: string;
  tone?: "online";
};

/**
 * One line of text that gives way to the next every few seconds: the line in view rises
 * out as the next one rises in. A single line just stays. Screen readers get every line
 * at once, so nothing is announced over and over.
 */
export function RotatingLine({
  lines,
  interval = 4500,
}: {
  lines: RotatingEntry[];
  interval?: number;
}) {
  const [activeId, setActiveId] = useState(lines[0]?.id);
  const [leaving, setLeaving] = useState<RotatingEntry>();
  // The first line is simply there; only a change of line moves.
  const [moved, setMoved] = useState(false);
  const latest = useRef(lines);
  useEffect(() => {
    latest.current = lines;
  });
  const current = lines.find((line) => line.id === activeId) ?? lines[0];
  const ids = lines.map((line) => line.id).join("|");
  const currentId = current?.id;
  useEffect(() => {
    if (ids.split("|").length < 2) return;
    const timer = setInterval(() => {
      const all = latest.current;
      const at = all.findIndex((line) => line.id === currentId);
      const next = all[(at + 1) % all.length];
      if (!next || next.id === currentId) return;
      setLeaving(all[at] ?? undefined);
      setActiveId(next.id);
      setMoved(true);
    }, interval);
    return () => clearInterval(timer);
  }, [ids, currentId, interval]);
  // The outgoing line is taken away when its animation ends, and after a moment in any
  // case: an animation that never runs (a hidden tab, a row not laid out) ends nothing.
  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => setLeaving(undefined), 700);
    return () => clearTimeout(timer);
  }, [leaving]);
  if (!current) return null;
  return (
    <span className="rotating-line">
      <span className="sr-only">
        {lines.map((line) => line.text).join(" · ")}
      </span>
      {leaving && leaving.id !== current.id ? (
        <span
          key={"out-" + leaving.id}
          data-line="out"
          data-tone={leaving.tone}
          aria-hidden="true"
          onAnimationEnd={() => setLeaving(undefined)}
        >
          {leaving.text}
        </span>
      ) : null}
      <span
        key={"in-" + current.id}
        data-line="in"
        data-tone={current.tone}
        data-moved={moved || undefined}
        aria-hidden="true"
      >
        {current.text}
      </span>
    </span>
  );
}
