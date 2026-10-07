"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, PhoneOff, Video } from "lucide-react";
import { api, post } from "@/lib/api";
import { useLiveRefresh } from "@/lib/live-updates";
import { useCallSession, CallMount } from "./call-session-provider";
import { Avatar } from "./user-identity";
import { playMotion } from "@/lib/motion";
import { callDevice } from "@/lib/call-device";
import { useCallRingtone } from "@/lib/call-ringtone";

type PrivateCall = {
  id: string;
  friendshipId: string;
  callerId: string;
  calleeId: string;
  callerDevice: string;
  calleeDevice?: string;
  callerName: string;
  calleeName: string;
  callerAvatar: boolean;
  calleeAvatar: boolean;
  state: string;
  video: boolean;
  updatedAt: string;
  expiresAt: string;
};
const activeStates = new Set([
  "DIALING",
  "RINGING",
  "ACCEPTED",
  "CONNECTING",
  "CONNECTED",
]);
const mediaStates = new Set(["ACCEPTED", "CONNECTING", "CONNECTED"]);
const labels: Record<string, string> = {
  DIALING: "Ligando…",
  RINGING: "Chamando…",
  ACCEPTED: "Chamada aceita",
  CONNECTING: "Conectando áudio…",
  CONNECTED: "Em chamada",
  DECLINED: "Chamada recusada",
  CANCELLED: "Chamada cancelada",
  NO_ANSWER: "Não atendeu",
  ENDED: "Chamada encerrada",
};
type Calls = {
  call: PrivateCall | null;
  me?: string;
  ready: boolean;
  busy: boolean;
  error: string;
  action: (operation: string) => Promise<void>;
  invite: (friendshipId: string, video: boolean) => Promise<void>;
};
const PrivateCallsContext = createContext<Calls | null>(null);

export function PrivateCallsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [call, setCall] = useState<PrivateCall | null>(null);
  const [me, setMe] = useState<string>();
  const [sessionRevision, setSessionRevision] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const ignored = useRef(new Set<string>());
  const latest = useRef<PrivateCall | null>(null);
  const viewer = useRef<string | undefined>(undefined);
  const started = useRef<string | null>(null);
  const { session, start, leave } = useCallSession();
  const currentMedia = useRef(session);
  useEffect(() => {
    currentMedia.current = session;
  }, [session]);
  const path = usePathname();
  const router = useRouter();
  const enabled = !["/", "/login", "/register"].includes(path);

  const apply = useCallback(
    (value: PrivateCall | Record<string, never>) => {
      if (!value.id || ignored.current.has(value.id)) return;
      if (
        !viewer.current ||
        ![value.callerId, value.calleeId].includes(viewer.current)
      )
        return;
      if (latest.current && latest.current.updatedAt > value.updatedAt) return;
      // Terminal records are history, never a restorable call controller.
      if (!activeStates.has(value.state)) {
        ignored.current.add(value.id);
        if (latest.current?.id === value.id) {
          latest.current = null;
          started.current = null;
          setCall(null);
          if (currentMedia.current?.roomId === value.id) leave();
        }
        return;
      }
      latest.current = value as PrivateCall;
      setCall(value as PrivateCall);
    },
    [leave],
  );
  const refresh = useCallback(async () => {
    if (!enabled || !me) return;
    try {
      apply(await api<PrivateCall>("/calls/private", { cache: "no-store" }));
      setReady(true);
    } catch (cause) {
      setError((cause as Error).message);
    }
  }, [enabled, me, apply]);
  useLiveRefresh("private_call_changed", refresh, 5000);
  useEffect(() => {
    if (!enabled) {
      viewer.current = undefined;
      const frame = requestAnimationFrame(() => {
        latest.current = null;
        started.current = null;
        ignored.current.clear();
        setMe(undefined);
        setReady(false);
        setCall(null);
        setError("");
      });
      return () => cancelAnimationFrame(frame);
    }
    const controller = new AbortController();
    const identify = () => {
      void api<{ id: string }>("/users/me", {
        cache: "no-store",
        signal: controller.signal,
      })
        .then((user) => {
          if (controller.signal.aborted) return;
          viewer.current = user.id;
          setMe(user.id);
        })
        .catch(() => {});
    };
    identify();
    const ready = () => {
      if (!viewer.current) identify();
    };
    window.addEventListener("enturma-live-ready", ready);
    return () => {
      controller.abort();
      window.removeEventListener("enturma-live-ready", ready);
    };
  }, [enabled, sessionRevision]);
  useEffect(() => {
    const changed = () => {
      leave();
      viewer.current = undefined;
      latest.current = null;
      started.current = null;
      ignored.current.clear();
      setCall(null);
      setMe(undefined);
      setReady(false);
      setSessionRevision((value) => value + 1);
    };
    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("enturma-session")
        : null;
    if (channel) channel.onmessage = changed;
    window.addEventListener("enturma-session-changed", changed);
    return () => {
      channel?.close();
      window.removeEventListener("enturma-session-changed", changed);
    };
  }, [leave]);
  useEffect(() => {
    if (!me) return;
    const timer = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timer);
  }, [me, refresh]);

  const action = useCallback(
    async (operation: string) => {
      const current = latest.current;
      if (!current) return;
      setBusy(true);
      setError("");
      try {
        apply(
          await post<PrivateCall>(`/calls/private/${current.id}/${operation}`, {
            deviceId: callDevice(),
          }),
        );
      } catch (cause) {
        setError((cause as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [apply],
  );
  const incoming =
    !!call &&
    call.calleeId === me &&
    ["DIALING", "RINGING"].includes(call.state);
  useCallRingtone(incoming);
  const callId = call?.id;
  useEffect(() => {
    if (!incoming || !callId) return;
    const controller = new AbortController();
    void api<PrivateCall>(`/calls/private/${callId}/ring`, {
      method: "POST",
      signal: controller.signal,
    })
      .then(apply)
      .catch(() => {});
    return () => controller.abort();
  }, [incoming, callId, apply]);
  useEffect(() => {
    if (incoming) {
      const element = dialog.current;
      element?.showModal();
      const animation =
        element &&
        playMotion(element, [
          { opacity: 0, transform: "translateY(12px) scale(.98)" },
          { opacity: 1, transform: "none" },
        ]);
      return () => {
        animation?.cancel();
        element?.close();
      };
    }
    dialog.current?.close();
  }, [incoming]);
  useEffect(() => {
    if (!call || !me) return;
    if (
      mediaStates.has(call.state) &&
      started.current !== call.id &&
      (me === call.callerId ? call.callerDevice : call.calleeDevice) ===
        callDevice()
    ) {
      started.current = call.id;
      start({
        roomId: call.id,
        title: me === call.callerId ? call.calleeName : call.callerName,
        href: `/calls/${call.id}`,
        endpoint: `/calls/private/${call.id}/voice`,
        initialCamera: call.video,
      });
      if (path !== `/calls/${call.id}`) router.push(`/calls/${call.id}`);
    }
    if (!activeStates.has(call.state) && session?.roomId === call.id) leave();
  }, [call, me, session?.roomId, start, leave, path, router]);
  useEffect(() => {
    const ended = (event: Event) => {
      const id = (event as CustomEvent).detail?.roomId;
      const current = latest.current;
      if (
        id &&
        current &&
        id === current.id &&
        activeStates.has(current.state)
      ) {
        ignored.current.add(id);
        latest.current = null;
        started.current = null;
        setCall(null);
        void post<PrivateCall>(`/calls/private/${id}/end`).catch(() => {});
      }
    };
    window.addEventListener("enturma-call-left", ended);
    return () => window.removeEventListener("enturma-call-left", ended);
  }, [apply]);
  const invite = useCallback(
    async (friendshipId: string, video: boolean) => {
      if (session || (latest.current && activeStates.has(latest.current.state)))
        throw Error("Encerre sua chamada atual antes de ligar.");
      const created = await post<PrivateCall>("/calls/private", {
        friendshipId,
        video,
        deviceId: callDevice(),
      });
      apply(created);
      router.push(`/calls/${created.id}`);
    },
    [session, apply, router],
  );
  const peer = call
    ? {
        id: incoming || call.calleeId === me ? call.callerId : call.calleeId,
        name: call.calleeId === me ? call.callerName : call.calleeName,
        hasAvatar: call.calleeId === me ? call.callerAvatar : call.calleeAvatar,
        username: "",
      }
    : null;
  return (
    <PrivateCallsContext.Provider
      value={{ call, invite, me, ready, busy, error, action }}
    >
      {children}
      {enabled &&
        call &&
        peer &&
        activeStates.has(call.state) &&
        !mediaStates.has(call.state) &&
        !incoming &&
        path !== `/calls/${call.id}` && (
          <aside className="private-call-status" role="status">
            <Avatar user={peer} />
            <div>
              <Link href={`/calls/${call.id}`}>
                <strong>{peer.name}</strong>
              </Link>
              <p>{labels[call.state]}</p>
            </div>
            <button
              disabled={busy}
              onClick={() => void action("cancel")}
              aria-label="Cancelar chamada"
            >
              <PhoneOff size={20} />
            </button>
            {error && <p role="alert">{error}</p>}
          </aside>
        )}
      <dialog
        ref={dialog}
        className="incoming-private-call"
        aria-labelledby="incoming-call-title"
        onCancel={(event) => {
          event.preventDefault();
          void action("decline");
        }}
      >
        {peer && (
          <>
            <Avatar user={peer} />
            <h2 id="incoming-call-title">{peer.name}</h2>
            <p>Chamada de {call?.video ? "vídeo" : "voz"} recebida</p>
            {session && <p>Ao atender, sua chamada atual será encerrada.</p>}
            <div className="actions">
              <button
                className="secondary"
                disabled={busy}
                onClick={() => void action("decline")}
              >
                <PhoneOff size={20} /> Recusar
              </button>
              <button disabled={busy} onClick={() => void action("accept")}>
                <Phone size={20} /> Atender
              </button>
            </div>
            {error && <p role="alert">{error}</p>}
          </>
        )}
      </dialog>
    </PrivateCallsContext.Provider>
  );
}

export function PrivateCallButtons({ friendshipId }: { friendshipId: string }) {
  const calls = useContext(PrivateCallsContext);
  const [online, setOnline] = useState<boolean>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const refresh = () =>
      void api<{ online: boolean }>(`/friends/${friendshipId}/presence`, {
        cache: "no-store",
        signal: controller.signal,
      })
        .then((result) => setOnline(result.online))
        .catch(() => {});
    refresh();
    const timer = setInterval(refresh, 15000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [friendshipId]);
  async function dial(video: boolean) {
    setBusy(true);
    setError("");
    try {
      await calls?.invite(friendshipId, video);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="private-call-buttons">
      <small>
        {online === undefined
          ? "Verificando presença…"
          : online
            ? "Online"
            : "Offline"}
      </small>
      <button
        type="button"
        disabled={busy || online !== true}
        onClick={() => void dial(false)}
        aria-label="Ligar por voz"
      >
        <Phone size={20} />
      </button>
      <button
        type="button"
        disabled={busy || online !== true}
        onClick={() => void dial(true)}
        aria-label="Ligar por vídeo"
      >
        <Video size={20} />
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
/** A route of its own: Back minimizes the live session; hangup destroys it. */
export function PrivateCallPage({ id }: { id: string }) {
  const context = useContext(PrivateCallsContext);
  const { session } = useCallSession();
  const router = useRouter();
  const root = useRef<HTMLElement>(null);
  const returnTo = useRef("/friends");
  const call = context?.call?.id === id ? context.call : null;
  useEffect(() => {
    const orbit = root.current?.querySelector<HTMLElement>(".call-orbit");
    const animation =
      orbit &&
      playMotion(
        orbit,
        [
          { transform: "scale(.6)", opacity: 0.45 },
          { transform: "scale(1.4)", opacity: 0 },
        ],
        { duration: 1800, iterations: Infinity, easing: "ease-out" },
      );
    return () => animation?.cancel();
  }, [call?.id, call?.state]);
  useEffect(() => {
    if (call) returnTo.current = `/friends?chat=${call.friendshipId}`;
    else if (context?.ready) router.replace(returnTo.current);
  }, [call, context?.ready, router]);
  useEffect(() => {
    const animation =
      root.current &&
      playMotion(
        root.current,
        [
          { opacity: 0, transform: "scale(.96)", filter: "blur(6px)" },
          { opacity: 1, transform: "scale(1)", filter: "blur(0)" },
        ],
        { duration: 320, easing: "cubic-bezier(.16,1,.3,1)" },
      );
    return () => animation?.cancel();
  }, []);
  const peer = call
    ? {
        id: call.callerId === context?.me ? call.calleeId : call.callerId,
        name: call.callerId === context?.me ? call.calleeName : call.callerName,
        hasAvatar:
          call.callerId === context?.me ? call.calleeAvatar : call.callerAvatar,
        username: "",
      }
    : null;
  return (
    <main ref={root} className="private-call-page" aria-label="Ligação privada">
      <header>
        <Link
          href={call ? `/friends?chat=${call.friendshipId}` : "/friends"}
          aria-label="Voltar à conversa"
        >
          <ArrowLeft size={24} />
        </Link>
        <span>enturma · chamada {call?.video ? "de vídeo" : "de voz"}</span>
      </header>
      {peer && call ? (
        <>
          {mediaStates.has(call.state) && session?.roomId === id ? (
            <CallMount
              roomId={id}
              endpoint={`/calls/private/${id}/voice`}
              ended={false}
              title={peer.name}
            />
          ) : (
            <div className="private-call-waiting">
              <div className="call-orbit" aria-hidden="true" />
              <Avatar user={peer} />
              <h1>{peer.name}</h1>
              <p role="status">{labels[call.state]}</p>
              {mediaStates.has(call.state) ? (
                <p>Chamada aberta em outro dispositivo.</p>
              ) : (
                <button
                  className="call-cancel"
                  disabled={context?.busy}
                  onClick={() =>
                    void context?.action(
                      call.callerId === context.me ? "cancel" : "decline",
                    )
                  }
                  aria-label="Cancelar chamada"
                >
                  <PhoneOff size={28} />
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <p role="status">{context?.error || "Preparando chamada…"}</p>
      )}
      {context?.error && call && <p role="alert">{context.error}</p>}
    </main>
  );
}
