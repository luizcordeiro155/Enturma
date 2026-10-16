"use client";

import { useEffect, useRef } from "react";
import {
  BookOpen,
  Check,
  GraduationCap,
  Mail,
  ShieldCheck,
} from "lucide-react";

/** Small WAAPI scene: pauses in background, cleans up, and follows real state. */
export function AcademicMotion({
  state,
}: {
  state: "select" | "email" | "review" | "approved" | "confirm";
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const scene = root.current;
    if (!scene || typeof scene.animate !== "function") return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let animations: Animation[] = [];
    function start() {
      animations.forEach((a) => a.cancel());
      animations = [];
      if (
        !scene ||
        reduced.matches ||
        document.documentElement.dataset.reducedMotion === "true"
      )
        return;
      scene.querySelectorAll<HTMLElement>("[data-orbit]").forEach((node, i) => {
        animations.push(
          node.animate(
            [
              { transform: `translateY(0) rotate(${i * 3 - 3}deg)` },
              {
                transform: `translateY(${i % 2 ? -12 : 10}px) rotate(${3 - i * 3}deg)`,
              },
              { transform: `translateY(0) rotate(${i * 3 - 3}deg)` },
            ],
            {
              duration: 3200 + i * 400,
              iterations: Infinity,
              easing: "ease-in-out",
            },
          ),
        );
      });
      const core = scene.querySelector(".academic-motion-core");
      if (core)
        animations.push(
          core.animate(
            [
              { transform: "scale(.8) rotate(-12deg)", opacity: 0 },
              { transform: "scale(1.06) rotate(3deg)", opacity: 1 },
              { transform: "scale(1) rotate(0)" },
            ],
            { duration: 650, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" },
          ),
        );
      if (state === "approved")
        scene
          .querySelectorAll<HTMLElement>(".academic-spark")
          .forEach((node, i) => {
            const angle = (i / 16) * Math.PI * 2;
            animations.push(
              node.animate(
                [
                  { transform: "translate(0,0) scale(0)", opacity: 0 },
                  {
                    transform: `translate(${Math.cos(angle) * 65}px,${Math.sin(angle) * 65}px) scale(1)`,
                    opacity: 1,
                    offset: 0.25,
                  },
                  {
                    transform: `translate(${Math.cos(angle) * 135}px,${Math.sin(angle) * 135}px) scale(.25)`,
                    opacity: 0,
                  },
                ],
                {
                  duration: 1050,
                  delay: 100,
                  fill: "both",
                  easing: "ease-out",
                },
              ),
            );
          });
      if (document.hidden) animations.forEach((a) => a.pause());
    }
    const visibility = () =>
      animations.forEach((a) => (document.hidden ? a.pause() : a.play()));
    start();
    reduced.addEventListener("change", start);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      animations.forEach((a) => a.cancel());
      reduced.removeEventListener("change", start);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [state]);
  const Icon =
    state === "approved"
      ? Check
      : state === "email" || state === "confirm"
        ? Mail
        : state === "review"
          ? ShieldCheck
          : BookOpen;
  return (
    <div
      ref={root}
      className={`academic-motion academic-motion-${state}`}
      aria-hidden="true"
    >
      <div className="academic-orbit-ring" />
      <div className="academic-motion-card academic-orbit-a" data-orbit>
        <GraduationCap size={28} />
        <span>Sua faculdade</span>
      </div>
      <div className="academic-motion-card academic-orbit-b" data-orbit>
        <ShieldCheck size={24} />
        <span>Sua comunidade</span>
      </div>
      <div className="academic-motion-core">
        <Icon size={64} strokeWidth={1.6} />
      </div>
      {state === "approved" &&
        Array.from({ length: 16 }, (_, i) => (
          <i key={i} className="academic-spark" />
        ))}
      <span className="academic-motion-caption">
        {state === "approved"
          ? "IDENTIDADE CONFIRMADA"
          : "ENCONTRE A SUA TURMA"}
      </span>
    </div>
  );
}
