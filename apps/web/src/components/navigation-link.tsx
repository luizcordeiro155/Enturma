"use client";
import Link, { useLinkStatus } from "next/link";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { prepareSessionNavigation } from "@/lib/api";
import { reducedMotion } from "@/lib/motion";

function Pending({ preparing }: { preparing: boolean }) {
  const status = useLinkStatus();
  const pending = preparing || status.pending;
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
  const router = useRouter();
  const [preparing, setPreparing] = useState(false);
  const href = typeof props.href === "string" ? props.href : "";
  const privateLink = /^\/(home|rooms|friends|profile|settings|notebooks|caronas|forum|portfolio|challenges|learn|onboarding)(\/|$)/.test(href);
  return (
    <Link {...props} prefetch={privateLink ? false : props.prefetch ?? true}
      onNavigate={privateLink ? (event) => {
        event.preventDefault();
        if (preparing) return;
        setPreparing(true);
        // Never cache an expired-session redirect in a prefetched route. The
        // server still validates authorization before serving the destination.
        void prepareSessionNavigation().catch(() => false).finally(() => {
          router.push(href);
          setPreparing(false);
        });
      } : props.onNavigate}>
      {children}
      <Pending preparing={preparing} />
    </Link>
  );
}
