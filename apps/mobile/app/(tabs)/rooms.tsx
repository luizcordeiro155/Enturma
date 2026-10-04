import { useCallback, useRef, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { Room } from "@enturma/contracts";
import { api } from "../../src/api";
import { useRealtime } from "../../src/realtime";
import { Button, ErrorMessage, useStyles } from "../../src/ui";

export default function Rooms() {
  const styles = useStyles();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const router = useRouter();

  const load = useCallback(async () => {
    const current = ++generation.current;
    try {
      const result = await api<Room[]>("/study-rooms");
      if (current === generation.current) {
        setRooms(result);
        setError("");
      }
    } catch (e) {
      if (current === generation.current) setError((e as Error).message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        generation.current++;
      };
    }, [load]),
  );

  // Realtime is primary. Returning to the tab is the recovery fallback, so there
  // is no permanent 15-second polling loop anymore.
  useRealtime((event) => {
    if (event.type === "rooms_changed") void load();
  });

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: styles.screen.backgroundColor }}
      contentContainerStyle={{
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 110,
        gap: 12,
      }}
      data={rooms}
      keyExtractor={(room) => room.id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={{ gap: 16, marginBottom: 4 }}>
          <Text style={styles.title} accessibilityRole="header">
            Salas de estudo
          </Text>
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
        </View>
      }
      renderItem={({ item: room }) => (
        <View style={styles.row}>
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
      )}
      ListEmptyComponent={
        <View style={styles.card}>
          <Text style={styles.muted}>Ainda não há salas abertas.</Text>
        </View>
      }
    />
  );
}
