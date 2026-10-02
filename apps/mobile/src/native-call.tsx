import { createContext, useContext, useEffect, useState, useRef } from "react";
import { Platform, View, Text, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import {
  AudioSession,
  RoomContext,
  VideoTrack,
  useTracks,
  isTrackReference,
  useLocalParticipant,
} from "@livekit/react-native";
import { Room, RoomEvent, Track } from "livekit-client";
import { api } from "./api";
import { useStyles } from "./ui";
type Call = {
  room: Room;
  roomId: string | null;
  error: string;
  join: (id: string) => Promise<void>;
  leave: () => Promise<void>;
};
const Context = createContext<Call | null>(null);
export function NativeCallProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [room] = useState(
    () =>
      new Room({ adaptiveStream: { pixelDensity: "screen" }, dynacast: true }),
  );
  const generation = useRef(0);
  const joining = useRef(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const disconnect = () => {
      setRoomId(null);
      void AudioSession.stopAudioSession();
    };
    room.on(RoomEvent.Disconnected, disconnect);
    return () => {
      generation.current++;
      room.off(RoomEvent.Disconnected, disconnect);
      void room.disconnect();
      void AudioSession.stopAudioSession();
    };
  }, [room]);
  useEffect(() => {
    if (!roomId || roomId.startsWith("ride:")) return;
    const ping = () =>
      void api(`/study-rooms/${roomId}/heartbeat`, { method: "POST" }).catch(
        (e: Error & { status?: number }) => {
          if (e.status === 403 || e.status === 409) void room.disconnect();
        },
      );
    ping();
    const t = setInterval(ping, 30000);
    return () => clearInterval(t);
  }, [roomId]);
  async function leave() {
    generation.current++;
    await room.disconnect();
    setRoomId(null);
    await AudioSession.stopAudioSession();
  }
  async function join(id: string) {
    if (roomId === id || joining.current) return;
    joining.current = true;
    setError("");
    try {
      await leave();
      const attempt = generation.current;
      const c = await api<{ url: string; token: string }>(
        id.startsWith("ride:")
          ? `/matches/${id.slice(5)}/voice`
          : `/study-rooms/${id}/voice`,
        { method: "POST" },
      );
      if (attempt !== generation.current) return;
      await AudioSession.startAudioSession();
      await room.connect(c.url, c.token);
      if (attempt !== generation.current) {
        await room.disconnect();
        return;
      }
      setRoomId(id);
      try {
        await room.localParticipant.setMicrophoneEnabled(true);
      } catch {
        setError("Microfone indisponível. Você entrou para ouvir.");
      }
    } catch (e) {
      setError((e as Error).message);
      await leave();
    } finally {
      joining.current = false;
    }
  }
  return (
    <Context.Provider value={{ room, roomId, error, join, leave }}>
      <RoomContext.Provider value={room}>
        {children}
        <NativeCallBar />
      </RoomContext.Provider>
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
  const { isMicrophoneEnabled } = useLocalParticipant();
  if (!roomId) return null;
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
        onPress={() =>
          void room.localParticipant
            .setMicrophoneEnabled(!isMicrophoneEnabled)
            .catch((e) => Alert.alert("Microfone", e.message))
        }
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
  const styles = useStyles();
  const { room, roomId, error } = useNativeCall();
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  return (
    <View style={{ gap: 12 }}>
      {tracks.filter(isTrackReference).map((t) => (
        <VideoTrack
          key={t.publication.trackSid}
          trackRef={t}
          style={{
            height: t.source === Track.Source.ScreenShare ? 240 : 180,
            borderRadius: 12,
          }}
        />
      ))}
      {roomId && (
        <View style={{ flexDirection: "row", gap: 18 }}>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              void room.localParticipant
                .setCameraEnabled(!room.localParticipant.isCameraEnabled)
                .catch((e) => Alert.alert("Câmera", e.message))
            }
            style={{ padding: 14 }}
          >
            <Text style={styles.text}>Câmera</Text>
          </Pressable>
          {Platform.OS === "android" && (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                void room.localParticipant
                  .setScreenShareEnabled(
                    !room.localParticipant.isScreenShareEnabled,
                  )
                  .catch((e) => Alert.alert("Compartilhamento", e.message))
              }
              style={{ padding: 14 }}
            >
              <Text style={styles.text}>Compartilhar tela</Text>
            </Pressable>
          )}
        </View>
      )}
      {error ? <Text accessibilityRole="alert">{error}</Text> : null}
    </View>
  );
}
