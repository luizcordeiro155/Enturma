import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import type { Room } from "@enturma/contracts";
import { api } from "../../src/api";
import { Screen, Button, ErrorMessage, useStyles } from "../../src/ui";
export default function Rooms() {
  const styles = useStyles();
  const [rooms, setRooms] = useState<Room[]>([]),
    [error, setError] = useState("");
  const router = useRouter();
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = () =>
        api<Room[]>("/study-rooms")
          .then((r) => {
            if (active) setRooms(r);
          })
          .catch((e) => setError(e.message));
      void load();
      const t = setInterval(load, 15000);
      return () => {
        active = false;
        clearInterval(t);
      };
    }, []),
  );
  return (
    <Screen title="Encontre sua turma">
      <ErrorMessage message={error} />
      <Button
        title="Criar sala com minhas matérias"
        onPress={() => router.push("/home")}
      />
      {rooms.map((r) => (
        <View style={styles.row} key={r.id}>
          <Text style={styles.label}>{r.title}</Text>
          <Text style={styles.text}>{r.subjectName}</Text>
          <Text style={styles.muted}>
            {r.lifecycle === "MULTIDAY"
              ? "Sala de vários dias"
              : "Estudo rápido"}
          </Text>
          <Button
            title="Entrar"
            onPress={() =>
              void api(`/study-rooms/${r.id}/join`, { method: "POST" })
                .then(() =>
                  router.push({
                    pathname: "/rooms/[id]",
                    params: { id: r.id },
                  }),
                )
                .catch((e) => setError(e.message))
            }
          />
        </View>
      ))}
      {!rooms.length && (
        <Text style={styles.muted}>Ainda não há salas abertas.</Text>
      )}
    </Screen>
  );
}
