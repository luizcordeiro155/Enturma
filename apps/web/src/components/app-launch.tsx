"use client";
import dynamic from "next/dynamic";
import { BookOpen } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
const LaunchPlayer = dynamic(() => import("./motion/launch-player"), {
  ssr: false,
  loading: () => <BookOpen size={76} strokeWidth={1.5} />,
});
export function LaunchSplash({
  ride = false,
  children,
}: {
  ride?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="enturma-launch-scene" role="status">
      <LaunchPlayer ride={ride} />
      <strong>{ride ? "Seu próximo trajeto começa junto." : "enturma."}</strong>
      <span>
        {ride ? "Caronas da sua comunidade" : "Sua faculdade. Seu universo."}
      </span>
      {children}
    </div>
  );
}
export function AppLaunch() {
  const path = usePathname();
  const launched = useRef(false);
  const rideVisited = useRef(false);
  const layer = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<"app" | "ride" | null>(null);
  useEffect(() => {
    const protectedPage =
      /^\/(home|rooms|profile|settings|friends|notebooks|caronas|forum|portfolio|onboarding|admin)(\/|$)/.test(
        path,
      );
    if (!protectedPage) return;
    const ride = path.startsWith("/caronas") && !rideVisited.current;
    const boot = !launched.current;
    if (!boot && !ride) return;
    let active = true;
    let animation: Animation | undefined;
    let timeout: ReturnType<typeof setTimeout>;
    const close = () => {
      if (!active) return;
      const element = layer.current;
      if (
        element?.animate &&
        !matchMedia("(prefers-reduced-motion: reduce)").matches &&
        document.documentElement.dataset.reducedMotion !== "true"
      ) {
        animation = element.animate(
          [
            { opacity: 1, transform: "scale(1)" },
            { opacity: 0, transform: "scale(1.025)" },
          ],
          { duration: 360, easing: "ease-out", fill: "forwards" },
        );
        animation.finished
          .then(() => {
            if (active) setScene(null);
          })
          .catch(() => {});
      } else setScene(null);
    };
    const timer = setTimeout(() => {
      launched.current = true;
      if (ride) rideVisited.current = true;
      setScene(ride ? "ride" : "app");
      if (ride)
        timeout = setTimeout(
          close,
          matchMedia("(prefers-reduced-motion: reduce)").matches ? 200 : 1900,
        );
      else
        void api("/users/me", { cache: "no-store" })
          .then(() => {
            timeout = setTimeout(close, 150);
          })
          .catch(() => close());
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
      clearTimeout(timeout);
      animation?.cancel();
      setScene(null);
    };
  }, [path]);
  if (!scene) return null;
  return (
    <div ref={layer} className="enturma-launch-overlay">
      <LaunchSplash ride={scene === "ride"} />
      <button className="enturma-launch-skip" onClick={() => setScene(null)}>
        Continuar
      </button>
    </div>
  );
}
