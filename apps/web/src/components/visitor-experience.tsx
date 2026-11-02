"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { ArrowRight, X } from "lucide-react";
import dynamic from "next/dynamic";
import { EnturmaAppIcon } from "./enturma-app-icon";
import { isDesktop, isMobileApp } from "./desktop-updates";
import { playMotion } from "@/lib/motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  VisitorContext,
  canExploreAsVisitor,
  visitorDestination,
} from "@/lib/visitor-context";
import { Shell } from "./shell";
const Dashboard = dynamic(() =>
  import("./dashboard").then((module) => module.Dashboard),
);
const Forum = dynamic(() => import("./forum").then((module) => module.Forum));
const Rooms = dynamic(() =>
  import("./study-rooms-discovery").then(
    (module) => module.StudyRoomsDiscovery,
  ),
);
const Rides = dynamic(() =>
  import("./ride-mobility-experience").then(
    (module) => module.RideMobilityExperience,
  ),
);
const Settings = dynamic(() =>
  import("./profile").then((module) => module.ProfileView),
);

export function VisitorLink({ className }: { className?: string }) {
  const [web, setWeb] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setWeb(!isDesktop() && !isMobileApp()), 0);
    return () => clearTimeout(timer);
  }, []);
  return web ? (
    <Link className={className} href="/visitante">
      Explorar como visitante <ArrowRight size={16} />
    </Link>
  ) : null;
}

/** Uses the real dashboard. Private routes and APIs still require a session. */
export function VisitorExperience() {
  const router = useRouter();
  const search = useSearchParams();
  const requestedPath = search.get("path") || "/home";
  const path = canExploreAsVisitor(requestedPath) ? requestedPath : "/home";
  const pathname = path.split("?")[0];
  const [target, setTarget] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const origin = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (isDesktop() || isMobileApp()) window.location.replace("/home");
  }, []);
  useEffect(() => {
    if (!target || !dialog.current) return;
    const element = dialog.current;
    element.showModal();
    const animation = playMotion(element, [
      { opacity: 0, transform: "translateY(16px) scale(.97)" },
      { opacity: 1, transform: "none" },
    ]);
    return () => {
      animation?.cancel();
      element.close();
      origin.current?.focus({ preventScroll: true });
    };
  }, [target]);
  function restrict(event: MouseEvent<HTMLDivElement>) {
    const identity = (event.target as HTMLElement).closest<HTMLElement>(
      ".identity-trigger",
    );
    if (identity) {
      event.preventDefault();
      event.stopPropagation();
      origin.current = identity;
      setTarget("/profile");
      return;
    }
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>(
      "a[href]",
    );
    if (!link || link.origin !== location.origin) return;
    if (
      /^\/(?:login|register|start|download|privacidade|termos)(?:\/|$)/.test(
        link.pathname,
      )
    )
      return;
    event.preventDefault();
    const destination =
      link.pathname === "/visitante"
        ? new URLSearchParams(link.search).get("path") || "/home"
        : link.pathname + link.search;
    if (canExploreAsVisitor(destination)) {
      router.push(visitorDestination(destination));
      return;
    }
    origin.current = link;
    setTarget(link.pathname);
  }
  function dismiss() {
    setTarget(null);
    router.push("/visitante");
    document.getElementById("content")?.scrollIntoView({ behavior: "auto" });
  }
  return (
    <>
      <VisitorContext.Provider
        value={{
          active: true,
          path,
          requestLogin: (destination) => {
            origin.current = document.activeElement as HTMLElement;
            setTarget(destination);
          },
        }}
      >
        <div onClickCapture={restrict} data-visitor="true">
          {pathname === "/forum" || pathname.startsWith("/forum/") ? (
            <Forum
              key={path}
              visitor
              id={pathname.split("/")[2]}
              initialCategory={
                new URLSearchParams(path.split("?")[1]).get("category") || ""
              }
            />
          ) : pathname === "/rooms" ? (
            <Rooms visitor />
          ) : pathname === "/caronas" ? (
            <Shell visitor>
              <Rides visitor />
            </Shell>
          ) : pathname === "/settings" ? (
            <Settings settings visitor />
          ) : (
            <Dashboard visitor />
          )}
        </div>
      </VisitorContext.Provider>
      {target && (
        <dialog
          ref={dialog}
          className="visitor-gate"
          aria-labelledby="visitor-gate-title"
          onCancel={dismiss}
        >
          <button
            className="icon-control visitor-close"
            aria-label="Voltar ao início"
            onClick={dismiss}
          >
            <X size={20} />
          </button>
          <EnturmaAppIcon size={64} />
          <h2 id="visitor-gate-title">Faça parte da turma.</h2>
          <p>
            Entre ou crie sua conta para participar. Suas conversas, matérias e
            preferências ficam no seu espaço.
          </p>
          <Link
            className="button wide"
            href={`/register?next=${encodeURIComponent(target)}`}
          >
            Criar minha conta <ArrowRight size={18} />
          </Link>
          <Link
            className="button secondary wide"
            href={`/login?next=${encodeURIComponent(target)}`}
          >
            Já tenho uma conta
          </Link>
          <button className="text-button" onClick={dismiss}>
            Continuar explorando o início
          </button>
        </dialog>
      )}
    </>
  );
}
