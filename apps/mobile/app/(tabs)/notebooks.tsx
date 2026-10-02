import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { api } from "../../src/api";
import { Screen, Field, Button, ErrorMessage, useStyles } from "../../src/ui";
type Notebook = { id: string; title: string };
export default function Notebooks() {
  const styles = useStyles();
  const [items, setItems] = useState<Notebook[]>([]),
    [title, setTitle] = useState(""),
    [error, setError] = useState("");
  const router = useRouter();
  useFocusEffect(
    useCallback(() => {
      void api<{ items: Notebook[] }>("/notebooks")
        .then((r) => setItems(r.items))
        .catch((e) => setError(e.message));
    }, []),
  );
  return (
    <Screen title="Seus cadernos IA">
      <ErrorMessage message={error} />
      <Field
        label="Novo caderno"
        value={title}
        onChangeText={setTitle}
        maxLength={120}
      />
      <Button
        title="Criar caderno"
        disabled={!title.trim()}
        onPress={() =>
          void api<Notebook>("/notebooks", {
            method: "POST",
            body: JSON.stringify({ title }),
          })
            .then((n) =>
              router.push({ pathname: "/notebook/[id]", params: { id: n.id } }),
            )
            .catch((e) => setError(e.message))
        }
      />
      {items.map((n) => (
        <View style={styles.row} key={n.id}>
          <Text style={styles.label}>{n.title}</Text>
          <Button
            title="Estudar"
            onPress={() =>
              router.push({ pathname: "/notebook/[id]", params: { id: n.id } })
            }
          />
        </View>
      ))}
    </Screen>
  );
}
