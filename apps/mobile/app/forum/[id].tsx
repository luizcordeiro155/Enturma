import { useCallback, useEffect, useState } from "react";
import { Text, View, Linking, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { api } from "../../src/api";
import { useRealtime } from "../../src/realtime";
import { Screen, Field, Button, ErrorMessage, useStyles } from "../../src/ui";
type Entry = {
  id: string;
  title: string;
  name: string;
  body: string;
  score: number;
};
export default function Discussion() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<Entry>(),
    [comments, setComments] = useState<Entry[]>([]),
    [body, setBody] = useState(""),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([
        api<Entry>(`/forum/${id}`),
        api<{ items: Entry[] }>(`/forum/${id}/comments`),
      ]);
      setPost(p);
      setComments(c.items);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);
  useEffect(() => {
    void load();
  }, [load]);
  useRealtime((e) => {
    if (e.type === "forum_changed") void load();
  });
  function content(text: string) {
    return text.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
      /^https?:/.test(part) ? (
        <Text
          key={i}
          style={{ textDecorationLine: "underline", color: styles.text.color }}
          onPress={() =>
            Alert.alert(
              "Link externo",
              "Este endereço não é oficial do Enturma: " + part,
              [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Aceito abrir",
                  onPress: () => void Linking.openURL(part),
                },
              ],
            )
          }
        >
          {part}
        </Text>
      ) : (
        part
      ),
    );
  }
  return (
    <Screen title={post?.title ?? "Discussão"}>
      <ErrorMessage message={error} />
      <Text style={styles.muted}>{post?.name}</Text>
      <Text selectable style={styles.text}>
        {content(post?.body ?? "")}
      </Text>
      <Button
        title={`Curtir · ${post?.score ?? 0}`}
        onPress={() =>
          void api(`/forum/${id}/vote`, {
            method: "PUT",
            body: JSON.stringify({ value: 1 }),
          })
            .then(load)
            .catch((e) => setError(e.message))
        }
      />
      <Button
        title="Reagir ❤️"
        onPress={() =>
          void api(`/forum/${id}/reaction`, {
            method: "PUT",
            body: JSON.stringify({ emoji: "❤️" }),
          })
            .then(load)
            .catch((e) => setError(e.message))
        }
      />
      {comments.map((c) => (
        <View style={styles.row} key={c.id}>
          <Text style={styles.label}>{c.name}</Text>
          <Text selectable style={styles.text}>
            {content(c.body)}
          </Text>
        </View>
      ))}
      <Field
        label="Seu comentário"
        value={body}
        onChangeText={setBody}
        multiline
        maxLength={4000}
      />
      <Button
        title="Comentar"
        disabled={!body.trim()}
        onPress={() =>
          void api(`/forum/${id}/comments`, {
            method: "POST",
            body: JSON.stringify({ body, parentId: null }),
          })
            .then(() => {
              setBody("");
              void load();
            })
            .catch((e) => setError(e.message))
        }
      />
    </Screen>
  );
}
