import { useCallback, useEffect, useRef, useState } from "react";
import {
  Text,
  View,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import type { Room, Message } from "@enturma/contracts";
import { api, base, session } from "../../src/api";
import { useRealtime } from "../../src/realtime";
import { Button, ErrorMessage, useStyles } from "../../src/ui";
import { NativeCallStage, useNativeCall } from "../../src/native-call";
export default function RoomPage() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [room, setRoom] = useState<Room>(),
    [messages, setMessages] = useState<Message[]>([]),
    [draft, setDraft] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [token, setToken] = useState(""),
    [reply, setReply] = useState<Message>(),
    [pendingImage, setPendingImage] = useState<ImagePicker.ImagePickerAsset>();
  const call = useNativeCall();
  const list = useRef<FlatList<Message>>(null);
  const nearBottom = useRef(true);
  const load = useCallback(async () => {
    try {
      const [r, m, c] = await Promise.all([
        api<Room>(`/study-rooms/${id}`),
        api<Message[]>(`/study-rooms/${id}/messages`),
        session(),
      ]);
      setRoom(r);
      setMessages(m);
      setToken(c?.accessToken ?? "");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);
  useEffect(() => {
    void load();
  }, [load]);
  useRealtime((e) => {
    if (e.type === "snapshot") {
      setRoom(e.room as Room);
      setMessages(e.messages as Message[]);
    }
  }, id);
  async function send(attachmentId?: string) {
    setBusy(true);
    try {
      await api(`/study-rooms/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({
          body: draft,
          replyTo: reply?.id ?? null,
          attachmentId: attachmentId ?? null,
        }),
      });
      setDraft("");
      setReply(undefined);
      await load();
      list.current?.scrollToOffset({ offset: 0, animated: false });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function image() {
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      if (picked.canceled) return;
      const asset = picked.assets[0];
      if ((asset.fileSize ?? 0) > 8 * 1024 * 1024)
        throw Error("Escolha uma imagem de até 8 MB.");
      setPendingImage(asset);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function submit() {
    if (!pendingImage) {
      await send();
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", {
        uri: pendingImage.uri,
        name: pendingImage.fileName ?? "imagem.jpg",
        type: pendingImage.mimeType ?? "image/jpeg",
      } as unknown as Blob);
      const file = await api<{ id: string }>(
        `/study-rooms/${id}/messages/attachments`,
        { method: "POST", body: form },
      );
      await send(file.id);
      setPendingImage(undefined);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const ended = room?.status === "ENDED";
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
      style={{
        flex: 1,
        backgroundColor: styles.screen.backgroundColor,
        paddingBottom: call.roomId ? 90 : 0,
      }}
    >
      <View style={{ padding: 14, gap: 8 }}>
        <Text style={styles.label}>{room?.title ?? "Sua turma"}</Text>
        <Text style={styles.muted}>
          {room?.subjectName} · {room?.members?.length ?? 0} participantes
        </Text>
        <ErrorMessage message={error} />
        {call.roomId === id ? (
          <NativeCallStage />
        ) : (
          <Button
            title="Entrar na chamada"
            disabled={ended}
            onPress={() => void call.join(id)}
          />
        )}
      </View>
      <FlatList
        ref={list}
        inverted
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 14, gap: 12 }}
        onScroll={(e) => {
          nearBottom.current = e.nativeEvent.contentOffset.y < 100;
        }}
        onContentSizeChange={() => {
          if (nearBottom.current)
            list.current?.scrollToOffset({ offset: 0, animated: false });
        }}
        renderItem={({ item: m }) => (
          <View
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: styles.screen.backgroundColor,
              borderWidth: 1,
              borderColor: styles.row.borderColor,
              gap: 6,
            }}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: "/user/[id]",
                  params: { id: m.userId },
                })
              }
            >
              <Text style={styles.label}>{m.name}</Text>
            </Pressable>
            <Text selectable style={styles.text}>
              {m.deletedAt ? "Mensagem removida" : m.body}
            </Text>
            {m.attachmentId && !m.deletedAt && (
              <Image
                accessibilityLabel={m.attachmentName ?? "Imagem compartilhada"}
                source={{
                  uri: `${base}/study-rooms/${id}/messages/attachments/${m.attachmentId}`,
                  headers: { Authorization: `Bearer ${token}` },
                }}
                style={{ width: "100%", height: 200, resizeMode: "contain" }}
              />
            )}
            <Text style={styles.muted}>
              {new Date(m.createdAt).toLocaleTimeString("pt-BR")}
              {m.editedAt ? " · editada" : ""}
            </Text>
            <View style={{ flexDirection: "row", gap: 22 }}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setReply(m)}
                style={{ padding: 8 }}
              >
                <Text style={styles.text}>Responder</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  void api(
                    `/study-rooms/${id}/messages/${m.id}/reactions?emoji=${encodeURIComponent("👍")}`,
                    { method: "POST" },
                  )
                    .then(load)
                    .catch((e) => setError(e.message))
                }
                style={{ padding: 8 }}
              >
                <Text>
                  👍 {m.reactions?.reduce((n, r) => n + r.count, 0) || ""}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      />
      {!ended && (
        <View
          style={{
            padding: 12,
            gap: 8,
            borderTopWidth: 1,
            borderColor: "#d3ddd6",
          }}
        >
          {reply && (
            <Pressable onPress={() => setReply(undefined)}>
              <Text style={styles.text}>
                Respondendo a {reply.name} · cancelar
              </Text>
            </Pressable>
          )}
          {pendingImage && (
            <View style={{ gap: 6 }}>
              <Image
                source={{ uri: pendingImage.uri }}
                style={{ height: 100, width: 150, resizeMode: "contain" }}
              />
              <Button
                title="Remover imagem"
                onPress={() => setPendingImage(undefined)}
              />
            </View>
          )}
          <TextInput
            accessibilityLabel="Mensagem para a turma"
            placeholder="Compartilhe uma ideia…"
            placeholderTextColor={styles.muted.color}
            value={draft}
            onChangeText={setDraft}
            multiline
            maxLength={4000}
            style={[styles.input, { maxHeight: 130, minHeight: 48 }]}
          />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Button
              title="Imagem"
              disabled={busy}
              onPress={() => void image()}
            />
            <Button
              title={busy ? "Enviando…" : "Enviar"}
              disabled={busy || (!draft.trim() && !pendingImage)}
              onPress={() => void submit()}
            />
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
