"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { Radio } from "lucide-react";
import { api } from "@/lib/api";
import type { SocialPerson } from "@/lib/social";
import type { SocialLive } from "@/lib/social-live";
import { useLiveRefresh } from "@/lib/live-updates";
import { Avatar } from "../user-identity";
const LiveDialog = dynamic(
  () =>
    import("./social-live-dialog").then((module) => module.SocialLiveDialog),
  { ssr: false },
);
type Context = {
  enabled: boolean;
  items: SocialLive[];
  open: (id?: string) => void;
};
const LiveContext = createContext<Context>({
  enabled: false,
  items: [],
  open: () => {},
});
export function useSocialLives() {
  return useContext(LiveContext);
}
export function SocialLiveProvider({
  enabled,
  me,
  children,
}: {
  enabled: boolean;
  me: SocialPerson;
  children: ReactNode;
}) {
  const [items, setItems] = useState<SocialLive[]>([]),
    [opened, setOpened] = useState<string | null>(null);
  const running = useRef(false),
    mounted = useRef(true);
  const refresh = useCallback(async () => {
    if (!enabled || running.current || document.hidden || !navigator.onLine)
      return;
    running.current = true;
    try {
      const rows = await api<SocialLive[]>("/social/live", {
        cache: "no-store",
      });
      if (mounted.current) setItems(rows);
    } catch {
      /* No credentials or stale live metadata are exposed by an unavailable list. */
    } finally {
      running.current = false;
    }
  }, [enabled]);
  useEffect(() => {
    mounted.current = true;
    const timer = setTimeout(() => void refresh(), 0);
    const poll = setInterval(() => void refresh(), 15000);
    const resume = () => void refresh();
    window.addEventListener("online", resume);
    document.addEventListener("visibilitychange", resume);
    return () => {
      mounted.current = false;
      clearTimeout(timer);
      clearInterval(poll);
      window.removeEventListener("online", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [refresh]);
  useLiveRefresh("social_changed", refresh, 15000);
  function open(id?: string) {
    if (enabled)
      setOpened(
        id ?? items.find((live) => live.authorId === me.id)?.id ?? "new",
      );
  }
  return (
    <LiveContext.Provider value={{ enabled, items, open }}>
      {children}
      {opened && (
        <LiveDialog
          key={opened}
          initialId={opened === "new" ? undefined : opened}
          me={me}
          close={() => {
            setOpened(null);
            void refresh();
          }}
          changed={() => void refresh()}
        />
      )}
    </LiveContext.Provider>
  );
}
export function SocialLiveTray() {
  const { enabled, items, open } = useSocialLives();
  if (!enabled) return null;
  return (
    <>
      <button
        type="button"
        className="social-story social-live-create"
        onClick={() => open()}
      >
        <span className="social-story-ring">
          <Radio size={28} />
        </span>
        <small>Iniciar live</small>
      </button>
      {items
        .filter((live) => live.state === "LIVE")
        .map((live) => (
          <button
            type="button"
            key={live.id}
            className="social-story social-live-ring"
            onClick={() => open(live.id)}
            aria-label={`Assistir live de ${live.name}`}
          >
            <span className="social-story-ring">
              <Avatar user={{ ...live, id: live.authorId }} />
              <b>AO VIVO</b>
            </span>
            <small>{live.username}</small>
          </button>
        ))}
    </>
  );
}
