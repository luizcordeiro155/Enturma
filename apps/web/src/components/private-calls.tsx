"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { Phone, PhoneOff, Video, X } from "lucide-react";
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
  const dialog = useRef<HTMLDialogElement>(null);
  const ignored = useRef(new Set<string>());
  const latest = useRef<PrivateCall | null>(null);
  const viewer = useRef<string | undefined>(undefined);
  const started = useRef<string | null>(null);
  const { session, start, leave } = useCallSession();
  const path = usePathname();
  const enabled = !["/", "/login", "/register"].includes(path);

  const apply = useCallback((value: PrivateCall | Record<string, never>) => {
    if (!value.id || ignored.current.has(value.id)) return;
    if (
      !viewer.current ||
      ![value.callerId, value.calleeId].includes(viewer.current)
    )
      return;
    if (latest.current && latest.current.updatedAt > value.updatedAt) return;
    latest.current = value as PrivateCall;
    setCall(value as PrivateCall);
  }, []);
  const refresh = useCallback(async () => {
    if (!enabled || !me) return;
    apply(await api<PrivateCall>("/calls/private", { cache: "no-store" }));
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
    if (me) void refresh().catch(() => {});
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
        href: `/friends?chat=${call.friendshipId}`,
        endpoint: `/calls/private/${call.id}/voice`,
        initialCamera: call.video,
      });
    }
    if (!activeStates.has(call.state) && session?.roomId === call.id) leave();
  }, [call, me, session?.roomId, start, leave]);
  useEffect(() => {
    const ended = (event: Event) => {
      const id = (event as CustomEvent).detail?.roomId;
      const current = latest.current;
      if (id && current && id === current.id && activeStates.has(current.state))
        void post<PrivateCall>(`/calls/private/${id}/end`)
          .then(apply)
          .catch(() => {});
    };
    window.addEventListener("enturma-call-left", ended);
    return () => window.removeEventListener("enturma-call-left", ended);
  }, [apply]);
  const invite = useCallback(
    async (friendshipId: string, video: boolean) => {
      if (session || (latest.current && activeStates.has(latest.current.state)))
        throw Error("Encerre sua chamada atual antes de ligar.");
      apply(
        await post<PrivateCall>("/calls/private", {
          friendshipId,
          video,
          deviceId: callDevice(),
        }),
      );
    },
    [session, apply],
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
    <PrivateCallsContext.Provider value={{ call, invite }}>
      {children}
      {enabled && call && peer && !mediaStates.has(call.state) && !incoming && (
        <aside className="private-call-status" role="status">
          <Avatar user={peer} />
          <div>
            <strong>{peer.name}</strong>
            <p>{labels[call.state]}</p>
          </div>
          {activeStates.has(call.state) ? (
            <button
              disabled={busy}
              onClick={() => void action("cancel")}
              aria-label="Cancelar chamada"
            >
              <PhoneOff size={20} />
            </button>
          ) : (
            <button
              aria-label="Fechar aviso de chamada"
              onClick={() => {
                ignored.current.add(call.id);
                latest.current = null;
                setCall(null);
              }}
            >
              <X size={20} />
            </button>
          )}
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
export function PrivateCallView({ friendshipId }: { friendshipId: string }) {
  const context = useContext(PrivateCallsContext);
  const { session } = useCallSession();
  const call = context?.call;
  if (
    !call ||
    session?.roomId !== call.id ||
    call.friendshipId !== friendshipId ||
    !mediaStates.has(call.state)
  )
    return null;
  return (
    <CallMount
      roomId={call.id}
      endpoint={`/calls/private/${call.id}/voice`}
      title="Conversa privada"
      ended={false}
    />
  );
}
