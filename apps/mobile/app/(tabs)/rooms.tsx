import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { Room } from "@enturma/contracts";
import { api } from "../../src/api";
import { Screen, Button, ErrorMessage, useStyles } from "../../src/ui";

export default function Rooms() {
  const styles = useStyles();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState("");
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
    <Screen title="Salas de estudo">
      <ErrorMessage message={error} />

      <View style={[styles.card, { gap: 10 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Ionicons name="people-outline" size={22} color={styles.text.color} />
          <Text style={[styles.label, { marginBottom: 0 }]}>
            Estude em companhia
          </Text>
        </View>
        <Text style={styles.muted}>
          Entre em uma sala existente ou crie uma nova usando suas matérias.
        </Text>
        <Button
          title="Criar sala com minhas matérias"
          onPress={() => router.push("/home")}
        />
      </View>

      {rooms.map((room) => (
        <View style={styles.row} key={room.id}>
          <Text style={styles.label}>{room.title}</Text>
          <Text style={styles.text}>{room.subjectName}</Text>
          <Text style={styles.muted}>
            {room.lifecycle === "MULTIDAY"
              ? "Sala de vários dias"
              : "Estudo rápido"}
          </Text>
          <Button
            title="Entrar"
            onPress={() =>
              void api(`/study-rooms/${room.id}/join`, { method: "POST" })
                .then(() =>
                  router.push({
                    pathname: "/rooms/[id]",
                    params: { id: room.id },
                  }),
                )
                .catch((e) => setError(e.message))
            }
          />
        </View>
      ))}

      {!rooms.length ? (
        <View style={styles.card}>
          <Text style={styles.muted}>Ainda não há salas abertas.</Text>
        </View>
      ) : null}
    </Screen>
  );
}
