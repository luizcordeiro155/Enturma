import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import type { Room, Message } from "@enturma/contracts";
import { api, session, base } from "../../src/api";
import { Screen, Field, Button, ErrorMessage, styles } from "../../src/ui";
export default function RoomPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [room, setRoom] = useState<Room>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    let socket: WebSocket | undefined;
    let retry: ReturnType<typeof setTimeout>;
    let attempt = 0;
    async function connect() {
      try {
        const r = await api<Room>(`/study-rooms/${id}`);
        const m = await api<Message[]>(`/study-rooms/${id}/messages`);
        if (!active) return;
        setRoom(r);
        setMessages(m);
        const c = await session();
        socket = new WebSocket(
          base.replace(/^http/, "ws").replace(/\/api\/v1$/, "/ws"),
        );
        socket.onopen = () => {
          socket?.send(JSON.stringify({ token: c?.accessToken, roomId: id }));
          attempt = 0;
        };
        socket.onmessage = (e) => {
          const data = JSON.parse(e.data);
          if (data.type === "snapshot") {
            setRoom(data.room);
            setMessages(data.messages);
          }
        };
        socket.onclose = () => {
          if (active && attempt < 6)
            retry = setTimeout(connect, Math.min(30000, 1000 * 2 ** attempt++));
        };
      } catch (e) {
        if (active) setError((e as Error).message);
      }
    }
    void connect();
    return () => {
      active = false;
      clearTimeout(retry);
      socket?.close();
    };
  }, [id]);
  return (
    <Screen title={room?.subjectName ?? "Sua turma"}>
      <Text style={styles.text}>{room?.title}</Text>
      <ErrorMessage message={error} />
      {[...messages].reverse().map((m) => (
        <View key={m.id} style={styles.row}>
          <Text style={styles.label}>{m.name}</Text>
          <Text style={styles.text}>
            {m.deletedAt ? "Mensagem removida" : m.body}
          </Text>
        </View>
      ))}
      <Field
        label="Mensagem"
        value={body}
        onChangeText={setBody}
        multiline
        maxLength={4000}
      />
      <Button
        title="Enviar"
        disabled={!body.trim() || room?.status === "ENDED"}
        onPress={async () => {
          try {
            await api(`/study-rooms/${id}/messages`, {
              method: "POST",
              body: JSON.stringify({ body, replyTo: null }),
            });
            setBody("");
            setMessages(await api<Message[]>(`/study-rooms/${id}/messages`));
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      />
    </Screen>
  );
}
