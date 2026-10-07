"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
const VoiceSession = dynamic(() => import("./voice-session"), { ssr: false });
type Session = {
  roomId: string;
  endpoint?: string;
  title: string;
  href?: string;
  initialCamera?: boolean;
};
type Context = {
  session: Session | null;
  host: HTMLDivElement | null;
  start: (s: Session) => void;
  leave: () => void;
  dock: React.RefObject<HTMLDivElement | null>;
};
const CallContext = createContext<Context | null>(null);
export function CallSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const dock = useRef<HTMLDivElement>(null);
  const path = usePathname();
  useEffect(() => {
    const node = document.createElement("div");
    node.className = "persistent-call-host";
    dock.current?.appendChild(node);
    const timer = setTimeout(() => setHost(node), 0);
    return () => {
      clearTimeout(timer);
      node.remove();
    };
  }, []);
  const current = useRef<Session | null>(null);
  const leave = useCallback(() => {
    if (current.current)
      window.dispatchEvent(
        new CustomEvent("enturma-call-left", {
          detail: { roomId: current.current.roomId },
        }),
      );
    current.current = null;
    setSession(null);
  }, []);
  const start = useCallback(
    (s: Session) => {
      if (current.current?.roomId === s.roomId) return;
      if (current.current) leave();
      current.current = s;
      setSession(s);
    },
    [leave],
  );
  useEffect(() => {
    if (path === "/login" || path === "/register" || path === "/") {
      const timer = setTimeout(leave, 0);
      return () => clearTimeout(timer);
    }
  }, [path, leave]);
  const context = useMemo(
    () => ({ session, host, start, leave, dock }),
    [session, host, start, leave],
  );
  return (
    <CallContext.Provider value={context}>
      {children}
      <aside
        className={`global-call-dock ${session ? "has-call" : ""}`}
        aria-label="Chamada em andamento"
      >
        {session && (
          <header>
            <Link
              href={
                session.href ??
                (session.endpoint
                  ? "/caronas/matches"
                  : `/rooms/${session.roomId}?panel=call`)
              }
            >
              Você está em chamada — {session.title}
            </Link>
            <button className="text-button" onClick={leave}>
              Sair
            </button>
          </header>
        )}
        <div ref={dock} />
      </aside>
      {host && session
        ? createPortal(
            <VoiceSession
              key={session.roomId}
              roomId={session.roomId}
              endpoint={session.endpoint}
              initialCamera={session.initialCamera}
              ended={false}
              onLeave={leave}
            />,
            host,
          )
        : null}
    </CallContext.Provider>
  );
}
export function useCallSession() {
  const value = useContext(CallContext);
  if (!value) throw Error("CallSessionProvider ausente");
  return value;
}
export function CallMount({
  roomId,
  ended,
  endpoint,
  title = "Sala de estudo",
}: {
  roomId: string;
  ended: boolean;
  endpoint?: string;
  title?: string;
}) {
  const { session, host, start, leave, dock } = useCallSession();
  const mount = useRef<HTMLDivElement>(null);
  const active = session?.roomId === roomId;
  useLayoutEffect(() => {
    const slot = mount.current;
    const home = dock.current;
    if (active && host && slot) {
      slot.appendChild(host);
      return () => {
        home?.appendChild(host);
      };
    }
  }, [active, host, dock]);
  useEffect(() => {
    if (ended && active) {
      const timer = setTimeout(leave, 0);
      return () => clearTimeout(timer);
    }
  }, [ended, active, leave]);
  return (
    <div className="call-mount">
      <div ref={mount} />
      {!active && (
        <div className="call-entry">
          <div>
            <strong>Converse em companhia</strong>
            <p>
              Continue ouvindo e compartilhando mesmo ao navegar pelo Enturma.
            </p>
          </div>
          <button
            disabled={ended}
            onClick={() => {
              if (
                session &&
                !confirm("Sair da chamada atual para entrar nesta sala?")
              )
                return;
              start({ roomId, endpoint, title });
            }}
          >
            Entrar na chamada
          </button>
        </div>
      )}
    </div>
  );
}
