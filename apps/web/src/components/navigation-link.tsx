"use client";
import Link, { useLinkStatus } from "next/link";
import { useEffect, useRef, type ComponentProps } from "react";
import { reducedMotion } from "@/lib/motion";

function Pending() {
  const { pending } = useLinkStatus();
  const dot = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!pending || reducedMotion()) return;
    const animation = dot.current?.animate(
      [
        { opacity: 0.35, scale: ".8" },
        { opacity: 1, scale: "1" },
      ],
      { duration: 450, iterations: Infinity, direction: "alternate" },
    );
    return () => animation?.cancel();
  }, [pending]);
  return pending ? (
    <span ref={dot} className="navigation-pending-dot" role="status">
      <span className="sr-only">Abrindo página…</span>
    </span>
  ) : null;
}
export function NavigationLink({
  children,
  ...props
}: Omit<ComponentProps<typeof Link>, "key">) {
  return (
    <Link prefetch={true} {...props}>
      {children}
      <Pending />
    </Link>
  );
}
