import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { api } from "../src/api";
import { useRealtime } from "../src/realtime";
import { Screen, Button, ErrorMessage, useStyles } from "../src/ui";
type Notice = { id: string; message: string; href: string; readAt?: string };
export default function Notifications() {
  const styles = useStyles();
  const [items, setItems] = useState<Notice[]>([]),
    [error, setError] = useState("");
  const router = useRouter();
  const load = useCallback(
    () =>
      api<{ items: Notice[] }>("/notifications/inbox")
        .then((r) => setItems(r.items))
        .catch((e) => setError(e.message)),
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);
  useRealtime((e) => {
    if (e.type === "notifications_changed") void load();
  });
  return (
    <Screen title="Sua caixa de entrada">
      <ErrorMessage message={error} />
      <Button
        title="Limpar notificações"
        onPress={() =>
          void api("/notifications/clear", { method: "POST" }).then(load)
        }
      />
      {items.map((n) => (
        <View style={styles.row} key={n.id}>
          <Text style={styles.text}>{n.message}</Text>
          <Button
            title={n.readAt ? "Abrir" : "Nova · abrir"}
            onPress={() =>
              void api("/notifications/read", {
                method: "POST",
                body: JSON.stringify({ ids: [n.id], all: false }),
              }).then(() => {
                if (/^\/rooms\/[a-f0-9-]+/.test(n.href))
                  router.push({
                    pathname: "/rooms/[id]",
                    params: { id: n.href.split("/")[2].split("#")[0] },
                  });
                else if (/^\/forum\/[a-f0-9-]+/.test(n.href))
                  router.push({
                    pathname: "/forum/[id]",
                    params: { id: n.href.split("/")[2].split("#")[0] },
                  });
                else router.push("/profile");
              })
            }
          />
        </View>
      ))}
    </Screen>
  );
}
