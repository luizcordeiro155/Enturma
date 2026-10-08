import { useCallback, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { Profile, Room } from "@enturma/contracts";
import { api } from "../../src/api";
import { useRealtime } from "../../src/realtime";
import { Button, ErrorMessage, useStyles } from "../../src/ui";

type RecommendedRoom = Room & {
  recommendationReason?: "SUBJECT" | "COURSE" | "RELATED";
};

function timeLeft(endsAt: string) {
  const remaining = Math.max(0, new Date(endsAt).getTime() - Date.now());
  const minutes = Math.ceil(remaining / 60000);
  if (minutes < 60) return `${minutes} min restantes`;
  const hours = Math.ceil(minutes / 60);
  if (hours < 24) return `${hours}h restantes`;
  return `${Math.ceil(hours / 24)}d restantes`;
}

export default function Rooms() {
  const styles = useStyles();
  const [rooms, setRooms] = useState<RecommendedRoom[]>([]);
  const [profile, setProfile] = useState<Profile>();
  const [error, setError] = useState("");
  const [joiningId, setJoiningId] = useState<string>();
  const generation = useRef(0);
  const router = useRouter();

  const load = useCallback(async () => {
    const current = ++generation.current;
    try {
      const [me, result] = await Promise.all([
        api<Profile>("/users/me"),
        api<RecommendedRoom[]>("/study-rooms?recommended=true"),
      ]);
      if (current === generation.current) {
        setProfile(me);
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

  useRealtime((event) => {
    if (event.type === "rooms_changed") void load();
    if (event.type === "profile_changed") void load();
  });

  const subjectIds = useMemo(
    () => new Set(profile?.subjects.map((subject) => subject.id) ?? []),
    [profile],
  );

  const directCount = useMemo(
    () => rooms.filter((room) => subjectIds.has(room.subjectId)).length,
    [rooms, subjectIds],
  );

  const join = useCallback(
    async (room: RecommendedRoom) => {
      setJoiningId(room.id);
      setError("");
      try {
        await api(`/study-rooms/${room.id}/join`, { method: "POST" });
        router.push({
          pathname: "/rooms/[id]",
          params: { id: room.id },
        });
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setJoiningId(undefined);
      }
    },
    [router],
  );

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
        <View style={{ gap: 14, marginBottom: 4 }}>
          <View style={{ gap: 6 }}>
            <Text style={styles.title} accessibilityRole="header">
              Salas para você
            </Text>
            <Text style={styles.muted}>
              Salas abertas das suas matérias e do seu curso, priorizadas pelo
              que você estuda agora.
            </Text>
          </View>

          <ErrorMessage message={error} />

          <View style={[styles.card, { gap: 12 }]}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[styles.label, { marginBottom: 0 }]}>
                  Seu contexto acadêmico
                </Text>
                <Text style={styles.muted}>
                  {profile?.subjects.length
                    ? `${profile.subjects.length} matéria(s) selecionada(s)`
                    : "Adicione suas matérias para personalizar as salas."}
                </Text>
              </View>
              <View
                style={{
                  minWidth: 42,
                  height: 42,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: styles.elevated.backgroundColor,
                }}
              >
                <Ionicons
                  name="school-outline"
                  size={22}
                  color={styles.accent.color}
                />
              </View>
            </View>

            {profile?.subjects.length ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {profile.subjects.slice(0, 5).map((subject) => (
                  <View
                    key={subject.id}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 7,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: styles.border.borderColor,
                      backgroundColor: styles.elevated.backgroundColor,
                    }}
                  >
                    <Text style={[styles.muted, { fontWeight: "700" }]}>
                      {subject.name}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/onboarding")}
              style={{ alignSelf: "flex-start" }}
            >
              <Text style={[styles.text, { color: styles.accent.color, fontWeight: "800" }]}>
                Atualizar minhas matérias
              </Text>
            </Pressable>
          </View>

          {rooms.length ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons
                  name="radio-outline"
                  size={20}
                  color={styles.accent.color}
                />
                <Text style={[styles.label, { marginBottom: 0 }]}>
                  Abertas agora
                </Text>
              </View>
              <Text style={styles.muted}>
                {directCount > 0
                  ? `${directCount} da(s) sua(s) matéria(s)`
                  : `${rooms.length} do seu curso`}
              </Text>
            </View>
          ) : null}
        </View>
      }
      renderItem={({ item: room }) => {
        const direct = subjectIds.has(room.subjectId);
        return (
          <View style={[styles.row, { gap: 12 }]}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: styles.accent.color,
                    }}
                  />
                  <Text
                    style={[
                      styles.muted,
                      { color: styles.accent.color, fontWeight: "800" },
                    ]}
                  >
                    {direct ? "SUA MATÉRIA" : "DO SEU CURSO"}
                  </Text>
                </View>
                <Text style={[styles.label, { marginBottom: 0, fontSize: 17 }]}>
                  {room.title}
                </Text>
                <Text style={styles.text}>{room.subjectName}</Text>
                {room.topicText ? (
                  <Text style={styles.muted} numberOfLines={2}>
                    {room.topicText}
                  </Text>
                ) : null}
              </View>

              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: styles.elevated.backgroundColor,
                }}
              >
                <Ionicons
                  name={direct ? "book-outline" : "people-outline"}
                  size={22}
                  color={styles.accent.color}
                />
              </View>
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  paddingHorizontal: 9,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: styles.elevated.backgroundColor,
                }}
              >
                <Ionicons
                  name="people-outline"
                  size={15}
                  color={styles.muted.color}
                />
                <Text style={styles.muted}>
                  {room.participants}/{room.maxParticipants}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  paddingHorizontal: 9,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: styles.elevated.backgroundColor,
                }}
              >
                <Ionicons
                  name="time-outline"
                  size={15}
                  color={styles.muted.color}
                />
                <Text style={styles.muted}>{timeLeft(room.endsAt)}</Text>
              </View>

              {room.lifecycle === "MULTIDAY" ? (
                <View
                  style={{
                    paddingHorizontal: 9,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: styles.elevated.backgroundColor,
                  }}
                >
                  <Text style={styles.muted}>Sala contínua</Text>
                </View>
              ) : null}
            </View>

            <Button
              title={joiningId === room.id ? "Entrando..." : "Entrar na sala"}
              disabled={Boolean(joiningId)}
              onPress={() => void join(room)}
            />
          </View>
        );
      }}
      ListEmptyComponent={
        <View style={[styles.card, { gap: 12, alignItems: "flex-start" }]}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: styles.elevated.backgroundColor,
            }}
          >
            <Ionicons
              name="search-outline"
              size={24}
              color={styles.accent.color}
            />
          </View>
          <Text style={[styles.label, { marginBottom: 0 }]}>
            Nenhuma sala compatível aberta agora
          </Text>
          <Text style={styles.muted}>
            Quando alguém abrir uma sala das suas matérias ou do seu curso, ela
            aparece aqui automaticamente.
          </Text>
          <Button
            title="Criar sala com minhas matérias"
            onPress={() => router.push("/home")}
          />
        </View>
      }
    />
  );
}
