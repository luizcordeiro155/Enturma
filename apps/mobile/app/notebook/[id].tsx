import { useCallback, useEffect, useState } from "react";
import { Text, View, Switch } from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as Crypto from "expo-crypto";
import { api } from "../../src/api";
import { Screen, Field, Button, ErrorMessage, useStyles } from "../../src/ui";
type Notebook = {
  notebook: { title: string };
  aiEnabled: boolean;
  sources: { id: string; title: string; status: string; error?: string }[];
  generations: {
    id: string;
    status: string;
    answer: string;
    question: string;
    error?: string;
  }[];
};
export default function NotebookPage() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<Notebook>(),
    [title, setTitle] = useState(""),
    [content, setContent] = useState(""),
    [url, setUrl] = useState(""),
    [question, setQuestion] = useState(""),
    [selected, setSelected] = useState<string[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [mode, setMode] = useState("LESSON");
  const load = useCallback(
    () =>
      api<Notebook>(`/notebooks/${id}`)
        .then(setData)
        .catch((e) => setError(e.message)),
    [id],
  );
  useEffect(() => {
    void load();
  }, [load]);
  const pending =
    data?.sources.some((s) => ["PENDING", "PROCESSING"].includes(s.status)) ||
    data?.generations.some((g) => ["PENDING", "PROCESSING"].includes(g.status));
  useEffect(() => {
    if (!pending) return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [pending, load]);
  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action();
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function file() {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "application/pdf",
        "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/*",
      ],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if ((asset.size ?? 0) > 3 * 1024 * 1024) {
      setError("Limite de 3 MB por documento.");
      return;
    }
    const form = new FormData();
    form.append("file", {
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType ?? "application/octet-stream",
    } as unknown as Blob);
    await run(() =>
      api(`/notebooks/${id}/files`, { method: "POST", body: form }),
    );
  }
  return (
    <Screen title={data?.notebook.title ?? "Caderno IA"}>
      <ErrorMessage message={error} />
      <Text style={styles.muted}>
        Adicione fontes, selecione o conteúdo e escolha como estudar.
      </Text>
      <Field label="Título da fonte" value={title} onChangeText={setTitle} />
      <Field
        label="Conteúdo para estudar"
        value={content}
        onChangeText={setContent}
        multiline
      />
      <Field
        label="Ou link de referência"
        value={url}
        onChangeText={setUrl}
        keyboardType="url"
        autoCapitalize="none"
      />
      <Button
        title="Adicionar fonte"
        disabled={busy || !title.trim() || (!content.trim() && !url.trim())}
        onPress={() =>
          void run(() =>
            api(`/notebooks/${id}/sources`, {
              method: "POST",
              body: JSON.stringify({
                title,
                kind: url ? "LINK" : "TEXT",
                content,
                url: url || null,
              }),
            }),
          )
        }
      />
      <Button
        title="Adicionar documento ou imagem"
        disabled={busy}
        onPress={() => void file().catch((e) => setError(e.message))}
      />
      {data?.sources.map((s) => (
        <View style={styles.row} key={s.id}>
          <Text style={styles.label}>{s.title}</Text>
          <Text style={styles.muted}>
            {s.status}
            {s.error ? " · " + s.error : ""}
          </Text>
          <Switch
            accessibilityLabel={`Estudar ${s.title}`}
            disabled={s.status !== "READY"}
            value={selected.includes(s.id)}
            onValueChange={(v) =>
              setSelected((old) =>
                v ? [...old, s.id] : old.filter((id) => id !== s.id),
              )
            }
          />
        </View>
      ))}
      <Text style={styles.label}>Formato de estudo</Text>
      {[
        ["LESSON", "Aula explicativa"],
        ["SUMMARY", "Resumo"],
        ["FLASHCARDS", "Cartões de revisão"],
        ["QUIZ", "Questionário"],
        ["STUDY_PLAN", "Plano de estudo"],
      ].map(([value, label]) => (
        <Button
          key={value}
          title={`${mode === value ? "✓ " : ""}${label}`}
          onPress={() => setMode(value)}
        />
      ))}
      <Field
        label="Pergunta ou objetivo"
        value={question}
        onChangeText={setQuestion}
        multiline
        maxLength={2000}
      />
      <Button
        title="Gerar material de estudo"
        disabled={busy || !selected.length || !data?.aiEnabled}
        onPress={() =>
          void run(() =>
            api(`/notebooks/${id}/generations`, {
              method: "POST",
              body: JSON.stringify({
                id: Crypto.randomUUID(),
                question,
                mode,
                level: "BEGINNER",
                sourceIds: selected,
              }),
            }),
          )
        }
      />
      {data?.generations.map((g) => (
        <View style={styles.row} key={g.id}>
          <Text style={styles.label}>{g.question || "Material de estudo"}</Text>
          <Text selectable style={styles.text}>
            {g.answer || g.error || "Preparando conteúdo…"}
          </Text>
          <Text style={styles.muted}>{g.status}</Text>
        </View>
      ))}
    </Screen>
  );
}
