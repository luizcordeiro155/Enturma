"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Check, MonitorCog, Moon, Sun } from "lucide-react";
import type { ExperiencePreference } from "@enturma/contracts";

type Theme = ExperiencePreference["theme"];
const options = [
  {
    value: "LIGHT",
    label: "Claro",
    detail: "Mais luz para o seu dia",
    Icon: Sun,
  },
  {
    value: "DARK",
    label: "Escuro",
    detail: "Conforto para se concentrar",
    Icon: Moon,
  },
  {
    value: "SYSTEM",
    label: "Sistema",
    detail: "Acompanha seu dispositivo",
    Icon: MonitorCog,
  },
] as const;

export function ThemePicker({
  value,
  onChange,
}: {
  value: Theme;
  onChange: (theme: Theme) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const id = useId();
  const selected = options.find((option) => option.value === value)!;
  const Icon = selected.Icon;

  useEffect(() => () => clearTimeout(leaveTimer.current), []);
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const node = panel.current;
      if (!node) return;
      node.style.transform = "none";
      const rect = node.getBoundingClientRect();
      const shift =
        rect.left < 12
          ? 12 - rect.left
          : rect.right > innerWidth - 12
            ? innerWidth - 12 - rect.right
            : 0;
      node.style.transform = `translateX(${shift}px)`;
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const reduced =
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.reducedMotion === "true";
    const animations = reduced
      ? []
      : Array.from(
          panel.current?.querySelectorAll<HTMLElement>("[data-theme-reveal]") ??
            [],
        ).map((element, index) =>
          element.animate(
            [
              { opacity: 0, transform: "translateY(-8px) scale(.96)" },
              { opacity: 1, transform: "translateY(0) scale(1)" },
            ],
            {
              duration: 240,
              delay: index * 35,
              easing: "cubic-bezier(.2,.8,.2,1)",
              fill: "backwards",
            },
          ),
        );
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => {
      animations.forEach((animation) => animation.cancel());
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);

  return (
    <div
      ref={root}
      className="theme-picker"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") {
          clearTimeout(leaveTimer.current);
          setOpen(true);
        }
      }}
      onPointerLeave={(event) => {
        if (
          event.pointerType === "mouse" &&
          !root.current?.contains(document.activeElement)
        )
          leaveTimer.current = setTimeout(() => setOpen(false), 220);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node))
          setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setOpen(false);
          trigger.current?.focus();
        }
        if (
          open &&
          ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)
        ) {
          event.preventDefault();
          const buttons = Array.from(
            panel.current?.querySelectorAll<HTMLButtonElement>(
              "[role=menuitemradio]",
            ) ?? [],
          );
          const index = buttons.indexOf(
            document.activeElement as HTMLButtonElement,
          );
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? 2
                : (index + (event.key === "ArrowUp" ? -1 : 1) + 3) % 3;
          buttons[next]?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        className="icon-control"
        type="button"
        aria-label={`Tema ${selected.label.toLowerCase()}. Escolher tema`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => {
          setOpen(true);
          requestAnimationFrame(() =>
            panel.current
              ?.querySelector<HTMLButtonElement>(`[data-value="${value}"]`)
              ?.focus(),
          );
        }}
      >
        <Icon size={20} />
      </button>
      {open && (
        <div
          ref={panel}
          id={id}
          role="menu"
          aria-label="Escolher tema"
          className="theme-picker-panel"
        >
          <header data-theme-reveal>
            <strong>Seu jeito de ver o Enturma</strong>
            <small>Escolha a luz que combina com você.</small>
          </header>
          {options.map(({ value: theme, label, detail, Icon: OptionIcon }) => (
            <button
              key={theme}
              data-theme-reveal
              data-value={theme}
              type="button"
              role="menuitemradio"
              aria-checked={value === theme}
              onClick={() => {
                onChange(theme);
                setOpen(false);
                trigger.current?.focus();
              }}
            >
              <span
                className={`theme-picker-scene theme-picker-scene-${theme.toLowerCase()}`}
                aria-hidden="true"
              >
                <OptionIcon size={22} />
                <i />
                <i />
              </span>
              <span>
                <strong>{label}</strong>
                <small>{detail}</small>
              </span>
              {value === theme && <Check size={17} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
