import {
  createContext,
  lazy,
  Suspense,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import type { Room } from "livekit-client";
import { api } from "./api";

type Call = {
  room: Room | null;
  roomId: string | null;
  error: string;
  join: (id: string) => Promise<void>;
  leave: () => Promise<void>;
};

const Context = createContext<Call | null>(null);
const LazyCallStage = lazy(() => import("./native-call-stage"));

export function NativeCallProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const generation = useRef(0);
  const joining = useRef(false);
  const roomRef = useRef<Room | null>(null);
  const cleanupDisconnectRef = useRef<(() => void) | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      generation.current++;
      cleanupDisconnectRef.current?.();
      const active = roomRef.current;
      roomRef.current = null;
      if (active) {
        void import("./native-call-runtime")
          .then((runtime) => runtime.disposeRoom(active))
          .catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (!roomId || roomId.startsWith("ride:")) return;
    const ping = () =>
      void api(`/study-rooms/${roomId}/heartbeat`, { method: "POST" }).catch(
        (e: Error & { status?: number }) => {
          if (e.status === 403 || e.status === 409) void leave();
        },
      );
    ping();
    const t = setInterval(ping, 30000);
    return () => clearInterval(t);
  }, [roomId]);

  async function leave() {
    generation.current++;
    cleanupDisconnectRef.current?.();
    cleanupDisconnectRef.current = null;
    const active = roomRef.current;
    roomRef.current = null;
    setRoom(null);
    setRoomId(null);

    if (active) {
      try {
        const runtime = await import("./native-call-runtime");
        await runtime.disposeRoom(active);
      } catch {
        try {
          await active.disconnect();
        } catch {}
      }
    }
  }

  async function join(id: string) {
    if (roomId === id || joining.current) return;
    joining.current = true;
    setError("");

    try {
      await leave();
      const attempt = generation.current;

      const [credentials, runtime] = await Promise.all([
        api<{ url: string; token: string }>(
          id.startsWith("ride:")
            ? `/matches/${id.slice(5)}/voice`
            : `/study-rooms/${id}/voice`,
          { method: "POST" },
        ),
        import("./native-call-runtime"),
      ]);

      if (attempt !== generation.current) return;

      const nextRoom = await runtime.createRoom();

      roomRef.current = nextRoom;
      setRoom(nextRoom);
      cleanupDisconnectRef.current = await runtime.observeDisconnect(
        nextRoom,
        () => {
          setRoomId(null);
          setRoom(null);
          roomRef.current = null;
        },
      );

      await runtime.connectRoom(nextRoom, credentials.url, credentials.token);

      if (attempt !== generation.current) {
        await runtime.disposeRoom(nextRoom);
        return;
      }

      setRoomId(id);
      try {
        await nextRoom.localParticipant.setMicrophoneEnabled(true);
      } catch {
        setError("Microfone indisponível. Você entrou para ouvir.");
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível iniciar a chamada neste aparelho.",
      );
      await leave();
    } finally {
      joining.current = false;
    }
  }

  return (
    <Context.Provider value={{ room, roomId, error, join, leave }}>
      {children}
      <NativeCallBar />
    </Context.Provider>
  );
}

export function useNativeCall() {
  const c = useContext(Context);
  if (!c) throw Error("Call provider ausente");
  return c;
}

function NativeCallBar() {
  const { roomId, leave, room } = useNativeCall();
  const router = useRouter();
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false);

  useEffect(() => {
    setIsMicrophoneEnabled(room?.localParticipant.isMicrophoneEnabled ?? false);
  }, [room]);

  if (!roomId || !room) return null;

  return (
    <View
      style={{
        position: "absolute",
        bottom: 82,
        left: 10,
        right: 10,
        borderRadius: 14,
        padding: 10,
        backgroundColor: "#183f36",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          router.push(
            roomId.startsWith("ride:")
              ? { pathname: "/ride/[id]", params: { id: roomId.slice(5) } }
              : { pathname: "/rooms/[id]", params: { id: roomId } },
          )
        }
        style={{ flex: 1, padding: 8 }}
      >
        <Text style={{ color: "#fff" }}>● Chamada em andamento</Text>
        <Text style={{ color: "#d8ef79", fontSize: 12 }}>Voltar à sala</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Alternar microfone"
        onPress={() => {
          const next = !isMicrophoneEnabled;
          void room.localParticipant
            .setMicrophoneEnabled(next)
            .then(() =>
              setIsMicrophoneEnabled(
                room.localParticipant.isMicrophoneEnabled,
              ),
            )
            .catch((e: Error) => Alert.alert("Microfone", e.message));
        }}
        style={{ padding: 10 }}
      >
        <Text style={{ color: "#fff" }}>
          {isMicrophoneEnabled ? "Mic ligado" : "Mic mudo"}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => void leave()}
        style={{ padding: 10 }}
      >
        <Text style={{ color: "#ffbdbd" }}>Sair</Text>
      </Pressable>
    </View>
  );
}

export function NativeCallStage() {
  const { room, roomId, error } = useNativeCall();

  if (!roomId || !room) {
    return error ? (
      <Text accessibilityRole="alert" style={{ color: "#b42318" }}>
        {error}
      </Text>
    ) : null;
  }

  return (
    <Suspense
      fallback={
        <View style={{ paddingVertical: 18 }}>
          <Text>Preparando chamada…</Text>
        </View>
      }
    >
      <LazyCallStage room={room} error={error} />
    </Suspense>
  );
}
