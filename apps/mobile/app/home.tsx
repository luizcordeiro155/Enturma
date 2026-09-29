import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import type { Profile, Room } from "@enturma/contracts";
import { api, logout } from "../src/api";
import { Screen, Button, ErrorMessage, styles } from "../src/ui";
export default function Home() {
  const [p, setP] = useState<Profile>();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState("");
  const router = useRouter();
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      Promise.all([api<Profile>("/users/me"), api<Room[]>("/study-rooms")])
        .then(([p, r]) => {
          if (alive) {
            setP(p);
            setRooms(r);
          }
        })
        .catch((e) => {
          if (alive) setError(e.message);
        });
      return () => {
        alive = false;
      };
    }, []),
  );
  async function study(subjectId: string, title: string) {
    try {
      const r = await api<Room>("/study-rooms", {
        method: "POST",
        body: JSON.stringify({
          subjectId,
          topicId: null,
          title: `Estudar ${title}`,
          minutes: 50,
          maxParticipants: 8,
        }),
      });
      router.push({ pathname: "/rooms/[id]", params: { id: r.id } });
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Screen title="Estudar fica melhor junto.">
      <ErrorMessage message={error} />
      {p ? <Text style={styles.text}>Olá, {p.name}.</Text> : null}
      <Button
        title="Meu perfil acadêmico"
        onPress={() => router.push("/onboarding")}
      />
      {p?.subjects.map((s) => (
        <View key={s.id} style={styles.row}>
          <Text style={styles.text}>{s.name}</Text>
          <Button
            title="Estudar agora · 50 min"
            onPress={() => study(s.id, s.name)}
          />
        </View>
      ))}
      <Text style={styles.title}>Salas abertas</Text>
      {rooms.length === 0 ? (
        <Text style={styles.muted}>Ainda não há salas abertas.</Text>
      ) : (
        rooms.map((r) => (
          <View key={r.id} style={styles.row}>
            <Text style={styles.text}>{r.subjectName}</Text>
            <Text>{r.title}</Text>
            <Button
              title="Entrar na turma"
              onPress={async () => {
                try {
                  await api(`/study-rooms/${r.id}/join`, { method: "POST" });
                  router.push({
                    pathname: "/rooms/[id]",
                    params: { id: r.id },
                  });
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            />
          </View>
        ))
      )}
      <Button
        title="Sair"
        onPress={async () => {
          try {
            await logout();
            router.replace("/");
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      />
    </Screen>
  );
}
