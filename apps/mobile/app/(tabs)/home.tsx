import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { Profile, Room } from "@enturma/contracts";
import { api, logout } from "../../src/api";
import { Screen, Button, Field, ErrorMessage, useStyles } from "../../src/ui";

export default function Home() {
  const styles = useStyles();
  const [p, setP] = useState<Profile>();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState("");
  const [days, setDays] = useState("0");
  const [minutes, setMinutes] = useState("50");
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      Promise.all([api<Profile>("/users/me"), api<Room[]>("/study-rooms")])
        .then(([profile, activeRooms]) => {
          if (alive) {
            setP(profile);
            setRooms(activeRooms);
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
      const room = await api<Room>("/study-rooms", {
        method: "POST",
        body: JSON.stringify({
          subjectId,
          topicId: null,
          title: `Estudar ${title}`,
          minutes: Number(minutes),
          days: Number(days),
          maxParticipants: 8,
        }),
      });
      router.push({ pathname: "/rooms/[id]", params: { id: room.id } });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Screen title={p ? `Olá, ${p.name}.` : "Estudar fica melhor junto."}>
      <Text style={styles.muted}>
        Continue seus estudos, entre em uma sala ou crie uma sessão com suas
        matérias.
      </Text>

      <ErrorMessage message={error} />

      <View style={[styles.card, { gap: 12 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Ionicons name="sparkles-outline" size={22} color={styles.text.color} />
          <Text style={[styles.label, { marginBottom: 0 }]}>Nova sala</Text>
        </View>

        <Field
          label="Dias (0 para sessão rápida, 1 a 5 para sala longa)"
          value={days}
          onChangeText={setDays}
          keyboardType="number-pad"
        />

        {days === "0" ? (
          <Field
            label="Minutos: 25, 50, 60, 90, 120 ou 180"
            value={minutes}
            onChangeText={setMinutes}
            keyboardType="number-pad"
          />
        ) : null}
      </View>

      <View style={[styles.card,{gap:12}]}>
        <View style={{flexDirection:"row",alignItems:"center",gap:10}}>
          <Ionicons name="book-outline" size={22} color={styles.text.color}/>
          <Text style={[styles.label,{marginBottom:0}]}>Minhas matérias</Text>
        </View>
        <Text style={styles.muted}>Suas matérias ficam no Início e conectam você a salas, conteúdos e colegas.</Text>
        {p?.subjects.map((subject) => (
          <View key={subject.id} style={styles.row}>
            <Text style={styles.label}>{subject.name}</Text>
            <Text style={styles.muted}>
              {Number(days) > 0
                ? `Sala reservada por ${days} dia(s)`
                : `Sessão rápida de ${minutes} min`}
            </Text>
            <Button
              title="Criar sala"
              disabled={
                !/^[0-5]$/.test(days) ||
                (days === "0" &&
                  ![25, 50, 60, 90, 120, 180].includes(Number(minutes)))
              }
              onPress={() => study(subject.id, subject.name)}
            />
          </View>
        ))}
        {!p?.subjects.length ? <Text style={styles.muted}>Nenhuma matéria selecionada ainda.</Text> : null}
        <Button title="Atualizar minhas matérias" onPress={() => router.push("/onboarding")} />
      </View>

      <View style={{ gap: 12 }}>
        <Text style={[styles.title, { fontSize: 24, lineHeight: 30 }]}>
          Salas abertas
        </Text>
        {rooms.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.muted}>Ainda não há salas abertas.</Text>
          </View>
        ) : (
          rooms.slice(0, 6).map((room) => (
            <View key={room.id} style={styles.row}>
              <Text style={styles.label}>{room.title}</Text>
              <Text style={styles.text}>{room.subjectName}</Text>
              <Button
                title="Entrar na turma"
                onPress={async () => {
                  try {
                    await api(`/study-rooms/${room.id}/join`, {
                      method: "POST",
                    });
                    router.push({
                      pathname: "/rooms/[id]",
                      params: { id: room.id },
                    });
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              />
            </View>
          ))
        )}
      </View>

      <Button
        title="Meu perfil acadêmico"
        onPress={() => router.push("/profile")}
      />

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
