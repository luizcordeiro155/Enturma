import { useCallback, useState } from "react";
import { Text, View, Alert } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { api } from "../src/api";
import { Screen, Field, Button, ErrorMessage, useStyles } from "../src/ui";
import { useRealtime } from "../src/realtime";
type Friend = {
  id: string;
  userId: string;
  name: string;
  username: string;
  status: string;
  recipient: string;
};
export default function Friends() {
  const styles = useStyles(),
    router = useRouter();
  const [items, setItems] = useState<Friend[]>([]),
    [me, setMe] = useState(""),
    [username, setUsername] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const [rows, user] = await Promise.all([
        api<Friend[]>("/friends"),
        api<{ id: string }>("/users/me"),
      ]);
      setItems(rows);
      setMe(user.id);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  useRealtime((event) => {
    if (event.type === "friends_changed" || event.type === "notifications_changed")
      void load();
  });
  async function action(path: string, method = "POST", body?: object) {
    setBusy(true);
    try {
      await api(path, {
        method,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      setUsername("");
      setError("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen title="Amigos">
      <ErrorMessage message={error} />
      <Field
        label="Adicionar pelo @usuário"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <Button
        title="Enviar convite"
        disabled={busy || !username.trim()}
        onPress={() => void action("/friends", "POST", { username })}
      />
      {items.map((f) => (
        <View key={f.id} style={styles.row}>
          <Text style={styles.label}>{f.name}</Text>
          <Text style={styles.muted}>
            @{f.username} ·{" "}
            {f.status === "ACCEPTED"
              ? "Amizade confirmada"
              : "Convite pendente"}
          </Text>
          <Button
            title="Ver perfil"
            onPress={() =>
              router.push({ pathname: "/user/[id]", params: { id: f.userId } })
            }
          />
          {f.status === "PENDING" && f.recipient === me && (
            <Button
              title="Aceitar convite"
              disabled={busy}
              onPress={() => void action(`/friends/${f.id}/accept`)}
            />
          )}
          <Button
            title={
              f.status === "ACCEPTED" ? "Remover amizade" : "Cancelar convite"
            }
            disabled={busy}
            onPress={() =>
              Alert.alert("Confirmar", "Deseja remover este vínculo?", [
                { text: "Voltar", style: "cancel" },
                {
                  text: "Remover",
                  style: "destructive",
                  onPress: () => void action(`/friends/${f.id}`, "DELETE"),
                },
              ])
            }
          />
        </View>
      ))}
      {!items.length && (
        <Text style={styles.muted}>
          Seus amigos e convites aparecerão aqui.
        </Text>
      )}
    </Screen>
  );
}
