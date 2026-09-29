import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import type { Room } from "@enturma/contracts";
import { api } from "../../src/api";
import { Screen, Button, ErrorMessage, styles } from "../../src/ui";

export default function RoomPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [room, setRoom] = useState<Room>();
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      setRoom(await api<Room>(`/study-rooms/${id}`));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  return (
    <Screen title={room?.subjectName ?? "Sua turma"}>
      <Text style={styles.text}>{room?.title}</Text>
      <ErrorMessage message={error} />

      <View style={styles.row}>
        <Text style={styles.label}>Participantes</Text>
        <Text style={styles.text}>{room?.members?.length ?? 0}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Chat privado</Text>
        <Text style={styles.text}>
          O novo chat efêmero com criptografia ponta a ponta está disponível no
          Enturma Web. O cliente mobile anterior foi desativado para não enviar
          conversas sem a mesma proteção criptográfica.
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Chamadas</Text>
        <Text style={styles.text}>
          Câmera, voz e compartilhamento de tela desta versão são recursos do
          site. O app continuará usando a mesma sala e receberá o cliente seguro
          de mídia em uma atualização dedicada.
        </Text>
      </View>

      <Button title="Atualizar sala" onPress={() => void load()} />
    </Screen>
  );
}
