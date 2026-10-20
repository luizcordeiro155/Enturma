"use client";
import { useEffect, useRef } from "react";
import { Star } from "lucide-react";

export function StarRating({
  value,
  onChange,
  disabled = false,
  label = "Avaliação",
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  label?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const previous = useRef(value);
  useEffect(() => {
    const before = previous.current;
    previous.current = value;
    if (
      value <= before ||
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.reducedMotion === "true"
    )
      return;
    const animations = Array.from(
      root.current?.querySelectorAll<HTMLElement>("button") ?? [],
    )
      .slice(before, value)
      .map((node, i) =>
        node.animate(
          [
            { transform: "scale(.8) rotate(-15deg)" },
            { transform: "scale(1.2) rotate(7deg)", offset: 0.55 },
            { transform: "scale(1) rotate(0)" },
          ],
          { duration: 360, delay: i * 35, easing: "cubic-bezier(.16,1,.3,1)" },
        ),
      );
    return () => animations.forEach((a) => a.cancel());
  }, [value]);
  function choose(x: number) {
    const rect = root.current?.getBoundingClientRect();
    if (!rect || disabled) return;
    onChange(
      Math.max(1, Math.min(5, Math.ceil(((x - rect.left) / rect.width) * 5))),
    );
  }
  return (
    <div
      className="interactive-star-rating"
      role="radiogroup"
      aria-label={label}
      ref={root}
      onPointerDown={(e) => {
        if (disabled || e.button !== 0) return;
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        choose(e.clientX);
      }}
      onPointerMove={(e) => {
        if (dragging.current) choose(e.clientX);
      }}
      onPointerUp={(e) => {
        dragging.current = false;
        if (e.currentTarget.hasPointerCapture(e.pointerId))
          e.currentTarget.releasePointerCapture(e.pointerId);
      }}
      onPointerCancel={() => {
        dragging.current = false;
      }}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
          tabIndex={(value || 1) === n ? 0 : -1}
          disabled={disabled}
          data-filled={n <= value}
          onClick={() => onChange(n)}
          onKeyDown={(e) => {
            if (
              [
                "ArrowLeft",
                "ArrowDown",
                "ArrowRight",
                "ArrowUp",
                "Home",
                "End",
              ].includes(e.key)
            ) {
              e.preventDefault();
              const next =
                e.key === "Home"
                  ? 1
                  : e.key === "End"
                    ? 5
                    : Math.max(
                        1,
                        Math.min(
                          5,
                          n +
                            (["ArrowLeft", "ArrowDown"].includes(e.key)
                              ? -1
                              : 1),
                        ),
                      );
              onChange(next);
              root.current?.querySelectorAll("button")[next - 1]?.focus();
            }
          }}
        >
          <Star size={36} fill={n <= value ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}
