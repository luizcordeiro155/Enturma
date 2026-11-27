"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const SECTIONS = [
  ["apresentacao", "Apresentação"],
  ["competencias", "Competências"],
  ["projetos", "Projetos"],
  ["jornada", "Jornada"],
] as const;

/** The section being read: the last one whose top already crossed the reading line. */
export function sectionAt(
  tops: readonly { id: string; top: number }[],
  line: number,
): string | undefined {
  let current = tops[0]?.id;
  for (const entry of tops) if (entry.top <= line) current = entry.id;
  return current;
}

function prefersReducedMotion() {
  return (
    document.documentElement.dataset.reducedMotion === "true" ||
    (typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  );
}

/** The editor is a long page: its sections stay one tap away and show where the reader is. */
export function PortfolioSections() {
  const [active, setActive] = useState<string>(SECTIONS[0][0]);
  const nav = useRef<HTMLElement>(null);
  const rail = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const bar = nav.current;
    if (!bar) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const style = getComputedStyle(bar);
      const box = bar.getBoundingClientRect();
      // The status-bar mask (portfolio-mobile.css) exists only while the row is pinned:
      // in the normal flow it would cover the cards right above it.
      const stuck =
        style.position === "sticky" &&
        box.top <= (parseFloat(style.top) || 0) + 1;
      if (stuck) bar.dataset.stuck = "true";
      else delete bar.dataset.stuck;
      const tops = SECTIONS.flatMap(([id]) => {
        const element = document.getElementById(id);
        return element
          ? [{ id, top: element.getBoundingClientRect().top }]
          : [];
      });
      const current = sectionAt(tops, Math.max(box.bottom, 0) + 32);
      if (current) setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    document.addEventListener("scroll", schedule, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
    };
  }, []);

  // Keep the open section's chip in view by moving the row only, never the page.
  useEffect(() => {
    const row = rail.current;
    const chip = row?.querySelector<HTMLElement>('a[aria-current="true"]');
    if (!row || !chip || row.scrollWidth <= row.clientWidth) return;
    row.scrollTo?.({
      left:
        chip.offsetLeft -
        row.offsetLeft -
        (row.clientWidth - chip.clientWidth) / 2,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [active]);

  return (
    <nav
      ref={nav}
      className="portfolio-sections"
      aria-label="Seções do portfólio"
    >
      <ul ref={rail}>
        {SECTIONS.map(([id, label]) => (
          <li key={id}>
            <a
              href={`#${id}`}
              aria-current={active === id ? "true" : undefined}
            >
              {label}
            </a>
          </li>
        ))}
        <li>
          <Link href="/portfolio/curriculo">Currículo</Link>
        </li>
      </ul>
    </nav>
  );
}
