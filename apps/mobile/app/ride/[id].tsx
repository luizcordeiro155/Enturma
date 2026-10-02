import { useCallback, useState } from "react";
import { Text, View, Alert } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useNativeCall, NativeCallStage } from "../../src/native-call";
import { api } from "../../src/api";
import { useRealtime } from "../../src/realtime";
import { Screen, Field, Button, ErrorMessage, useStyles } from "../../src/ui";
export default function RideChat() {
  const call = useNativeCall();
  const { id } = useLocalSearchParams<{ id: string }>(),
    styles = useStyles(),
    router = useRouter();
  const [messages, setMessages] = useState<
      { id: string; name: string; body: string }[]
    >([]),
    [body, setBody] = useState(""),
    [point, setPoint] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [closed, setClosed] = useState(false);
  const load = useCallback(async () => {
    try {
      const [rows, matches] = await Promise.all([
        api<typeof messages>(`/matches/${id}/messages`),
        api<{ id: string; meetingPoint?: string; closedAt?: string }[]>(
          "/matches",
        ),
      ]);
      setMessages([...rows].reverse());
      const m = matches.find((m) => m.id === id);
      setClosed(!!m?.closedAt);
      if (m?.meetingPoint) setPoint(m.meetingPoint);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  useRealtime(
    (e) => {
      if (e.type === "rides_changed") void load();
    },
    undefined,
    "rides",
  );
  async function action(path: string, method = "POST", data?: object) {
    setBusy(true);
    try {
      await api(path, {
        method,
        ...(data ? { body: JSON.stringify(data) } : {}),
      });
      setError("");
      if (method === "DELETE") router.back();
      else {
        setBody("");
        await load();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen title="Conversa da carona">
      <ErrorMessage message={error} />
      {!closed && (
        <Button
          title="Entrar na chamada"
          onPress={() => void call.join(`ride:${id}`)}
        />
      )}{" "}
      {call.roomId === `ride:${id}` && <NativeCallStage />}
      <Field
        label="Ponto de encontro"
        value={point}
        onChangeText={setPoint}
        editable={!closed}
      />
      <Button
        title="Salvar ponto"
        disabled={busy || closed || !point.trim()}
        onPress={() =>
          void action(`/matches/${id}/meeting-point`, "PUT", { point })
        }
      />
      {messages.map((m) => (
        <View key={m.id} style={styles.row}>
          <Text style={styles.label}>{m.name}</Text>
          <Text style={styles.text}>{m.body}</Text>
        </View>
      ))}
      {!closed ? (
        <>
          <Field
            label="Mensagem"
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={2000}
          />
          <Button
            title="Enviar"
            disabled={busy || !body.trim()}
            onPress={() =>
              void action(`/matches/${id}/messages`, "POST", { body })
            }
          />
          <Button
            title="Encerrar conversa"
            disabled={busy}
            onPress={() => void action(`/matches/${id}/close`)}
          />
        </>
      ) : (
        <Text style={styles.muted}>Conversa encerrada.</Text>
      )}
      <Button
        title="Apagar conversa para os dois"
        disabled={busy}
        onPress={() =>
          Alert.alert(
            "Apagar conversa",
            "Esta ação remove o histórico para os dois participantes.",
            [
              { text: "Voltar", style: "cancel" },
              {
                text: "Apagar",
                style: "destructive",
                onPress: () =>
                  void action(`/matches/${id}/conversation`, "DELETE"),
              },
            ],
          )
        }
      />
    </Screen>
  );
}
