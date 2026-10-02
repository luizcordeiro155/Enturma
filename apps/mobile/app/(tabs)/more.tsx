import { useRouter } from "expo-router";
import { Screen, Button } from "../../src/ui";
import { logout } from "../../src/api";
import { useNativeCall } from "../../src/native-call";
export default function More() {
  const router = useRouter();
  const call = useNativeCall();
  return (
    <Screen title="Seu Enturma">
      <Button title="Amigos" onPress={() => router.push("/friends")} />
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
      <Button title="Configurações" onPress={() => router.push("/settings")} />
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
