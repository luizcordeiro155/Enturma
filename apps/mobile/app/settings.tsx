import { useEffect, useState } from "react";\nimport { useRouter } from "expo-router";
import { Text, View, Switch } from "react-native";
import {
  Screen,
  Button,
  ErrorMessage,
  useStyles,
  useExperience,
} from "../src/ui";
import { api } from "../src/api";
type Preference = { category: string; inApp: boolean; email: boolean; push: boolean };
const labels: Record<string, string> = {
  ROOM_MESSAGE: "Mensagens de salas",
  PRIVATE_MESSAGE: "Mensagens privadas",
  MENTION: "Menções a você",
  ROOM_NOTICE: "Avisos de salas",
  FORUM: "Fórum",
  ACHIEVEMENT: "Conquistas",
  RIDE: "Caronas",
  FRIEND: "Amizades",
};
export default function Settings() {
  const styles = useStyles();\n  const router = useRouter();
  const { preference: p, save } = useExperience();
  const [items, setItems] = useState<Preference[]>([]),
    [status, setStatus] = useState("");
  useEffect(() => {
    api<Preference[]>("/notifications/preferences")
      .then(setItems)
      .catch((e) => setStatus(e.message));
  }, []);
  async function update(item: Preference) {
    try {
      await api("/notifications/preferences", {
        method: "PUT",
        body: JSON.stringify(item),
      });
      setItems((old) =>
        old.map((i) => (i.category === item.category ? item : i)),
      );
    } catch (e) {
      setStatus((e as Error).message);
    }
  }
  return (
    <Screen title="Configurações">
      <ErrorMessage message={status} />
      <Text style={styles.label}>Aparência</Text>
      {(["LIGHT", "DARK", "SYSTEM"] as const).map((theme, i) => (
        <Button
          key={theme}
          title={`${p.theme === theme ? "✓ " : ""}${["Claro", "Escuro", "Do sistema"][i]}`}
          onPress={() =>
            void save({ ...p, theme }).catch((e) => setStatus(e.message))
          }
        />
      ))}
      <Button
        title="Texto maior"
        onPress={() =>
          void save({ ...p, fontScale: p.fontScale >= 1.3 ? 1 : 1.3 }).catch(
            (e) => setStatus(e.message),
          )
        }
      />
      <View style={styles.row}>
        <Text style={styles.text}>Alto contraste</Text>
        <Switch
          value={p.highContrast}
          onValueChange={(highContrast) =>
            void save({ ...p, highContrast }).catch((e) => setStatus(e.message))
          }
        />
        <Text style={styles.text}>Reduzir animações</Text>
        <Switch
          value={p.reducedMotion}
          onValueChange={(reducedMotion) =>
            void save({ ...p, reducedMotion }).catch((e) =>
              setStatus(e.message),
            )
          }
        />
      </View>
      <Text style={styles.label}>Privacidade</Text>\n      <Button title="Privacidade e exclusão de conta" onPress={() => router.push("/privacy")} />\n      <Text style={styles.label}>Notificações</Text>
      <Text style={styles.muted}>Escolha o que aparece no app, chega no celular ou por e-mail. E-mails de segurança permanecem ativos.</Text>
      {items.map((i) => (
        <View style={styles.row} key={i.category}>
          <Text style={styles.label}>{labels[i.category]}</Text>
          <Text style={styles.text}>No aplicativo</Text>
          <Switch
            value={i.inApp}
            onValueChange={(inApp) => void update({ ...i, inApp })}
          />
          <Text style={styles.text}>No celular</Text>
          <Switch
            value={i.push}
            onValueChange={(push) => void update({ ...i, push })}
          />
          <Text style={styles.text}>Por e-mail</Text>
          <Switch
            value={i.email}
            onValueChange={(email) => void update({ ...i, email })}
          />
        </View>
      ))}
    </Screen>
  );
}
