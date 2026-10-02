import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { api } from "../src/api";
import { Screen, Button, Field, ErrorMessage, useStyles } from "../src/ui";
type Game = { subjectId: string; subject: string; code: string; title: string };
type Challenge = {
  id: string;
  prompt: string;
  hint: string;
  context: string;
  completed: boolean;
  difficulty: number;
};
export default function Challenges() {
  const styles = useStyles();
  const [games, setGames] = useState<Game[]>([]),
    [game, setGame] = useState<Game>(),
    [challenge, setChallenge] = useState<Challenge>(),
    [answer, setAnswer] = useState(""),
    [slot, setSlot] = useState(1),
    [daily, setDaily] = useState(true),
    [hint, setHint] = useState(false),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    api<Game[]>("/learning/academic")
      .then(setGames)
      .catch((e) => setStatus(e.message));
  }, []);
  return (
    <Screen title="Desafios acadêmicos">
      <ErrorMessage message={status} />
      {!game ? (
        games.map((g) => (
          <Button
            key={g.code + g.subjectId}
            title={`${g.title} · ${g.subject}`}
            onPress={() => {
              setGame(g);
              setChallenge(undefined);
            }}
          />
        ))
      ) : (
        <>
          <Button
            title="Escolher outra atividade"
            onPress={() => setGame(undefined)}
          />
          <Text style={styles.label}>{game.title}</Text>
          <Button
            title={
              daily
                ? "Missões diárias · mudar para treino"
                : "Treino livre · mudar para missões"
            }
            onPress={() => {
              setDaily(!daily);
              setChallenge(undefined);
            }}
          />
          {daily && (
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Button
                  key={n}
                  title={`${slot === n ? "✓ " : ""}${n}`}
                  onPress={() => {
                    setSlot(n);
                    setChallenge(undefined);
                  }}
                />
              ))}
            </View>
          )}
          <Button
            title="Começar"
            disabled={busy}
            onPress={() => {
              setBusy(true);
              void api<Challenge>("/learning/academic/start", {
                method: "POST",
                body: JSON.stringify({
                  subjectId: game.subjectId,
                  game: game.code,
                  daily,
                  slot,
                }),
              })
                .then((c) => {
                  setChallenge(c);
                  setHint(false);
                  setAnswer("");
                  setStatus("");
                })
                .catch((e) => setStatus(e.message))
                .finally(() => setBusy(false));
            }}
          />
          {challenge && (
            <View style={styles.row}>
              <Text style={styles.muted}>
                {challenge.context} · Nível {challenge.difficulty}
              </Text>
              <Text style={styles.text}>{challenge.prompt}</Text>
              <Button title="Mostrar dica" onPress={() => setHint(true)} />
              {hint && <Text style={styles.muted}>{challenge.hint}</Text>}
              {challenge.completed ? (
                <Text style={styles.label}>✓ Concluído</Text>
              ) : (
                <>
                  <Field
                    label="Sua resposta"
                    value={answer}
                    onChangeText={setAnswer}
                  />
                  <Button
                    title="Verificar"
                    disabled={busy || !answer.trim()}
                    onPress={() => {
                      setBusy(true);
                      void api<{
                        correct: boolean;
                        xpAwarded: number;
                        message: string;
                      }>(`/learning/academic/${challenge.id}/answer`, {
                        method: "POST",
                        body: JSON.stringify({ answer }),
                      })
                        .then((r) => {
                          setStatus(r.message + ` +${r.xpAwarded} XP`);
                          setChallenge({ ...challenge, completed: r.correct });
                        })
                        .catch((e) => setStatus(e.message))
                        .finally(() => setBusy(false));
                    }}
                  />
                </>
              )}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
