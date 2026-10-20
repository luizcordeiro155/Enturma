"use client";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { MonitorCog, Moon, Sun } from "lucide-react";
import type { ExperiencePreference } from "@enturma/contracts";
type Theme = ExperiencePreference["theme"];
const options = [
  { value: "LIGHT", label: "Claro", Icon: Sun },
  { value: "DARK", label: "Escuro", Icon: Moon },
  { value: "SYSTEM", label: "Sistema", Icon: MonitorCog },
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
  const thumb = useRef<HTMLSpanElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const press = useRef<ReturnType<typeof setTimeout>>(undefined);
  const leave = useRef<ReturnType<typeof setTimeout>>(undefined);
  const origin = useRef({ x: 0, y: 0 });
  const consumed = useRef(false);
  const previous = useRef(value);
  const id = useId();
  const index = options.findIndex((option) => option.value === value);
  const selected = options[index];
  const Icon = selected.Icon;
  useEffect(
    () => () => {
      clearTimeout(press.current);
      clearTimeout(leave.current);
    },
    [],
  );
  useLayoutEffect(() => {
    const before = options.findIndex(
      (option) => option.value === previous.current,
    );
    previous.current = value;
    if (
      !open ||
      !thumb.current ||
      before === index ||
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.reducedMotion === "true"
    )
      return;
    const animation = thumb.current.animate(
      [
        { transform: `translateX(${before * 100}%)` },
        { transform: `translateX(${index * 100}%)` },
      ],
      { duration: 340, easing: "cubic-bezier(.16,1,.3,1)" },
    );
    return () => animation.cancel();
  }, [index, value, open]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const reduced =
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.reducedMotion === "true";
    const animation = reduced
      ? undefined
      : panel.current?.animate(
          [
            { opacity: 0, transform: "translateY(-6px) scale(.9)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 220, easing: "cubic-bezier(.16,1,.3,1)" },
        );
    document.addEventListener("pointerdown", outside);
    return () => {
      animation?.cancel();
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);
  function focusChoice() {
    setOpen(true);
    requestAnimationFrame(() =>
      panel.current
        ?.querySelector<HTMLButtonElement>(`[data-value="${value}"]`)
        ?.focus(),
    );
  }
  return (
    <div
      ref={root}
      className="theme-picker"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") {
          clearTimeout(leave.current);
          setOpen(true);
        }
      }}
      onPointerLeave={(event) => {
        clearTimeout(press.current);
        if (event.pointerType === "mouse")
          leave.current = setTimeout(() => setOpen(false), 280);
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
          [
            "ArrowDown",
            "ArrowUp",
            "ArrowLeft",
            "ArrowRight",
            "Home",
            "End",
          ].includes(event.key)
        ) {
          event.preventDefault();
          if (!open || event.target === trigger.current) {
            focusChoice();
            return;
          }
          const buttons = Array.from(
            panel.current?.querySelectorAll<HTMLButtonElement>(
              "[role=menuitemradio]",
            ) ?? [],
          );
          const current = buttons.indexOf(
            document.activeElement as HTMLButtonElement,
          );
          buttons[
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? 2
                : (current +
                    (["ArrowUp", "ArrowLeft"].includes(event.key) ? -1 : 1) +
                    3) %
                  3
          ]?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        className="icon-control theme-quick-toggle"
        type="button"
        aria-label={`Tema ${selected.label.toLowerCase()}. Alternar tema`}
        title="Toque para alternar. Segure ou use as setas para escolher."
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onContextMenu={(event) => {
          event.preventDefault();
          consumed.current = true;
          focusChoice();
        }}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          consumed.current = false;
          origin.current = { x: event.clientX, y: event.clientY };
          clearTimeout(press.current);
          press.current = setTimeout(() => {
            consumed.current = true;
            setOpen(true);
          }, 480);
        }}
        onPointerMove={(event) => {
          if (
            event.buttons &&
            Math.hypot(
              event.clientX - origin.current.x,
              event.clientY - origin.current.y,
            ) > 10
          ) {
            clearTimeout(press.current);
            consumed.current = true;
          }
        }}
        onPointerUp={() => clearTimeout(press.current)}
        onPointerCancel={() => {
          clearTimeout(press.current);
          consumed.current = true;
        }}
        onClick={() => {
          if (consumed.current) {
            consumed.current = false;
            return;
          }
          const dark =
            value === "DARK" ||
            (value === "SYSTEM" &&
              matchMedia("(prefers-color-scheme: dark)").matches);
          onChange(dark ? "LIGHT" : "DARK");
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
          className="theme-switch-panel"
        >
          <span
            ref={thumb}
            className="theme-switch-thumb"
            aria-hidden="true"
            style={{ transform: `translateX(${index * 100}%)` }}
          />
          {options.map(({ value: theme, label, Icon: Choice }) => (
            <button
              key={theme}
              type="button"
              role="menuitemradio"
              data-value={theme}
              aria-checked={value === theme}
              aria-label={label}
              title={label}
              onClick={() => onChange(theme)}
            >
              <Choice size={20} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
