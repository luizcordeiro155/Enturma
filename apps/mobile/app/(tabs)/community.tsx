import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { api } from "../../src/api";
import { useRealtime } from "../../src/realtime";
import { Screen, Field, Button, ErrorMessage, useStyles } from "../../src/ui";
type Post = {
  id: string;
  title: string;
  body: string;
  name: string;
  score: number;
  commentsCount: number;
};
export default function Community() {
  const styles = useStyles();
  const [posts, setPosts] = useState<Post[]>([]),
    [q, setQ] = useState(""),
    [title, setTitle] = useState(""),
    [body, setBody] = useState(""),
    [error, setError] = useState("");
  const router = useRouter();
  const load = useCallback(
    () =>
      api<{ items: Post[] }>(`/forum?q=${encodeURIComponent(q)}`)
        .then((r) => setPosts(r.items))
        .catch((e) => setError(e.message)),
    [q],
  );
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  useRealtime((e) => {
    if (e.type === "forum_changed") void load();
  });
  return (
    <Screen title="Comunidade">
      <ErrorMessage message={error} />
      <Field label="Buscar publicações" value={q} onChangeText={setQ} />
      <View style={styles.row}>
        <Field
          label="Título da publicação"
          value={title}
          onChangeText={setTitle}
          maxLength={180}
        />
        <Field
          label="O que você quer compartilhar?"
          value={body}
          onChangeText={setBody}
          multiline
          maxLength={12000}
        />
        <Button
          title="Publicar"
          disabled={!title.trim() || !body.trim()}
          onPress={() =>
            void api("/forum", {
              method: "POST",
              body: JSON.stringify({ title, body, category: "ACADEMIC" }),
            })
              .then(() => {
                setTitle("");
                setBody("");
                void load();
              })
              .catch((e) => setError(e.message))
          }
        />
      </View>
      {posts.map((p) => (
        <View key={p.id} style={styles.row}>
          <Text style={styles.label}>{p.title}</Text>
          <Text style={styles.muted}>{p.name}</Text>
          <Text numberOfLines={4} style={styles.text}>
            {p.body}
          </Text>
          <Button
            title="Abrir discussão"
            onPress={() =>
              router.push({ pathname: "/forum/[id]", params: { id: p.id } })
            }
          />
        </View>
      ))}
    </Screen>
  );
}
