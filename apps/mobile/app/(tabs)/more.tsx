import { View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, useStyles } from "../../src/ui";
import { logout } from "../../src/api";
import { useNativeCall } from "../../src/native-call";

export default function More() {
  const router = useRouter();
  const call = useNativeCall();
  const styles = useStyles();

  return (
    <Screen title="Mais no Enturma">
      <View style={[styles.card, { gap: 10 }]}>
        <Ionicons name="grid-outline" size={28} color={styles.text.color} />
        <Button title="Hoje / Agenda" onPress={() => router.push("/campus")} />
        <Button title="Amigos" onPress={() => router.push("/friends")} />
        <Button title="Grupos de estudo" onPress={() => router.push("/groups")} />
        <Button title="Caronas" onPress={() => router.push("/rides")} />
        <Button
          title="Notificações"
          onPress={() => router.push("/notifications")}
        />
        <Button
          title="Minhas matérias"
          onPress={() => router.push("/onboarding")}
        />
        <Button
          title="Minigames acadêmicos"
          onPress={() => router.push("/challenges")}
        />
        <Button
          title="Configurações"
          onPress={() => router.push("/settings")}
        />
      </View>

      <Button
        title="Sair da conta"
        onPress={() =>
          void call
            .leave()
            .then(logout)
            .then(() => router.replace("/"))
        }
      />
    </Screen>
  );
}
