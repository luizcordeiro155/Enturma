"use client";
import { useEffect, useRef } from "react";
export function TypingIndicator({ names }: { names: string[] }) {
  const dots = useRef<HTMLSpanElement>(null);
  const visible = names.length > 0;
  useEffect(() => {
    if (
      !visible ||
      document.hidden ||
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.reducedMotion === "true"
    )
      return;
    const animations = Array.from(dots.current?.children ?? []).map(
      (dot, index) =>
        (dot as HTMLElement).animate(
          [
            { transform: "translateY(0)", opacity: 0.4 },
            { transform: "translateY(-3px)", opacity: 1 },
            { transform: "translateY(0)", opacity: 0.4 },
          ],
          { duration: 1000, delay: index * 130, iterations: Infinity },
        ),
    );
    const pause = () =>
      animations.forEach((animation) =>
        document.hidden ? animation.pause() : animation.play(),
      );
    document.addEventListener("visibilitychange", pause);
    return () => {
      animations.forEach((animation) => animation.cancel());
      document.removeEventListener("visibilitychange", pause);
    };
  }, [visible]);
  // Do not reserve a phantom row below the history while nobody is typing.
  if (!visible) return null;

  const label = `${names.slice(0, 2).join(" e ")}${names.length > 2 ? " e outras pessoas" : ""} ${names.length === 1 ? "está digitando…" : "estão digitando…"}`;
  return (
    <div className="conversation-typing" role="status" aria-live="polite">
      <span className="conversation-typing-dots" ref={dots} aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="conversation-typing-label" title={label}>{label}</span>
    </div>
  );
}
