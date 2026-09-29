import { useEffect, useState } from "react";
import { Text } from "react-native";
import { useRouter } from "expo-router";
import type { AcademicEntry } from "@enturma/contracts";
import { api } from "../src/api";
import { Screen, Button, Field, ErrorMessage, styles } from "../src/ui";
const kinds = [
  "INSTITUTION",
  "CAMPUS",
  "COURSE",
  "CURRICULUM",
  "PERIOD",
  "SUBJECT",
];
const names = [
  "Universidade",
  "Campus",
  "Curso",
  "Grade curricular",
  "Período",
  "Matérias",
];
export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [ids, setIds] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [entries, setEntries] = useState<AcademicEntry[]>([]);
  const [search, setSearch] = useState("");
  const [shift, setShift] = useState("EVENING");
  const [error, setError] = useState("");
  const router = useRouter();
  const parent = ids[step - 1];
  useEffect(() => {
    let active = true;
    api<AcademicEntry[]>(
      `/academics?kind=${kinds[step]}${parent ? `&parentId=${parent}` : ""}&search=${encodeURIComponent(search)}`,
    )
      .then((r) => {
        if (active) setEntries(r);
      })
      .catch((e) => setError(e.message));
    return () => {
      active = false;
    };
  }, [step, parent, search]);
  return (
    <Screen title={names[step]}>
      <Text style={styles.muted}>
        Etapa {step + 1} de 6. Dados oficiais verificados.
      </Text>
      <ErrorMessage message={error} />
      <Field label="Buscar" value={search} onChangeText={setSearch} />
      {entries.length === 0 ? (
        <Text>Não há opções verificadas para esta seleção.</Text>
      ) : (
        entries.map((e) => (
          <Button
            key={e.id}
            title={`${subjects.includes(e.id) ? "✓ " : ""}${e.name}`}
            onPress={() => {
              if (step < 5) {
                setIds((v) => [...v.slice(0, step), e.id]);
                setStep((v) => v + 1);
                setSearch("");
              } else
                setSubjects((s) =>
                  s.includes(e.id)
                    ? s.filter((id) => id !== e.id)
                    : [...s, e.id],
                );
            }}
          />
        ))
      )}
      {step === 5 ? (
        <>
          {[
            ["MORNING", "Manhã"],
            ["AFTERNOON", "Tarde"],
            ["EVENING", "Noite"],
            ["FULL_TIME", "Integral"],
            ["REMOTE", "EAD"],
          ].map(([value, label]) => (
            <Button
              key={value}
              title={`${shift === value ? "✓ " : ""}${label}`}
              onPress={() => setShift(value)}
            />
          ))}
          <Button
            title="Concluir perfil"
            disabled={!subjects.length}
            onPress={async () => {
              try {
                await api("/users/me/enrollment", {
                  method: "PUT",
                  body: JSON.stringify({
                    periodId: ids[4],
                    subjectIds: subjects,
                    shift,
                    preferences: "",
                  }),
                });
                router.replace("/home");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          />
        </>
      ) : null}
      {step > 0 ? (
        <Button
          title="Voltar"
          onPress={() => {
            setStep((s) => s - 1);
            setSubjects([]);
            setSearch("");
          }}
        />
      ) : null}
    </Screen>
  );
}
