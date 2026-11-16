"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export type SettingsSectionItem = { id: string; label: string; icon: LucideIcon };

function prefersReducedMotion() {
  return (
    document.documentElement.dataset.reducedMotion === "true" ||
    (typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  );
}

/** Section menu: a side rail on wide screens, sticky chips on phones; follows the scroll. */
export function SettingsNav({ items }: { items: SettingsSectionItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top);
          else visible.delete(entry.target.id);
        }
        const first = items.find((item) => visible.has(item.id));
        if (first) setActive(first.id);
      },
      { rootMargin: "-18% 0px -62% 0px" },
    );
    for (const item of items) {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    const chip = document.querySelector<HTMLElement>(`.settings-nav a[href="#${active}"]`);
    const rail = chip?.parentElement?.parentElement;
    if (chip && rail && rail.scrollWidth > rail.clientWidth)
      rail.scrollTo({
        left: chip.offsetLeft - rail.clientWidth / 2 + chip.clientWidth / 2,
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
  }, [active]);

  return (
    <nav className="settings-nav" aria-label="Seções das configurações">
      <ul>
        {items.map(({ id, label, icon: Icon }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              aria-current={active === id ? "true" : undefined}
              onClick={(event) => {
                const target = document.getElementById(id);
                if (!target) return;
                event.preventDefault();
                target.scrollIntoView({
                  behavior: prefersReducedMotion() ? "auto" : "smooth",
                  block: "start",
                });
                history.replaceState(null, "", `#${id}`);
                setActive(id);
              }}
            >
              <Icon size={17} aria-hidden="true" />
              <span>{label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** A titled settings block. Blocks that bring their own card and heading pass `bare`. */
export function SettingsSection({
  id,
  icon: Icon,
  title,
  description,
  bare = false,
  index = 0,
  children,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  bare?: boolean;
  index?: number;
  children: ReactNode;
}) {
  const Heading = bare ? "p" : "h2";
  return (
    <section
      id={id}
      data-settings-section={id}
      className={`settings-section${bare ? " settings-section-bare" : ""}`}
      style={{ "--settings-order": index } as React.CSSProperties}
      aria-labelledby={bare ? undefined : `${id}-title`}
    >
      <header className="settings-section-head">
        <span className="settings-section-icon" aria-hidden="true">
          <Icon size={18} />
        </span>
        <div>
          <Heading id={`${id}-title`} className="settings-section-title">
            {title}
          </Heading>
          {description ? <p>{description}</p> : null}
        </div>
      </header>
      <div className="settings-section-body">
        {children}
      </div>
    </section>
  );
}
