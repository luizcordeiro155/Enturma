import { useEffect, useState } from "react";
import { Text } from "react-native";
import { useRouter } from "expo-router";
import {
  academicLabels,
  type AcademicEntry,
  catalogOptions,
} from "@enturma/contracts";
import { api } from "../src/api";
import { Screen, Button, Field, ErrorMessage, useStyles } from "../src/ui";
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
  const styles = useStyles();
  const [step, setStep] = useState(0);
  const [ids, setIds] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [entries, setEntries] = useState<AcademicEntry[]>([]);
  const [search, setSearch] = useState("");
  const [shift, setShift] = useState("EVENING");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState("");
  const [selection, setSelection] = useState<AcademicEntry[]>([]);
  const router = useRouter();
  const parent = ids[step - 1];
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setBusy(true);
      setError("");
      catalogOptions(
        api,
        `kind=${kinds[step]}${parent ? `&parentId=${parent}` : ""}&search=${encodeURIComponent(search)}&page=${page}`,
      )
        .then((r) => {
          if (active) setEntries(r.items);
        })
        .catch((e) => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setBusy(false);
        });
    }, 180);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [step, parent, search, page, revision]);
  return (
    <Screen title={names[step]}>
      <Text style={styles.muted}>
        Etapa {step + 1} de 6. Dados oficiais verificados.
      </Text>
      <ErrorMessage message={error} />
      {!busy && !entries.length ? (
        <Button
          title="Atualizar opções"
          onPress={() => {
            setBusy(true);
            setRevision((n) => n + 1);
          }}
        />
      ) : null}
      {error ? (
        <Button
          title="Tentar novamente"
          onPress={() => setRevision((n) => n + 1)}
        />
      ) : null}
      {notice ? <Text>{notice}</Text> : null}
      {step >= 4 && selection[3]?.attributes?.note ? (
        <Text>{selection[3].attributes.note}</Text>
      ) : null}
      {step === 5 ? (
        <Text>
          Selecione somente as UCs atuais. Na UNA, cada nível pode reunir vários
          semestres.
        </Text>
      ) : null}
      <Field
        label="Buscar"
        value={search}
        onChangeText={(v) => {
          setSearch(v);
          setPage(0);
          setBusy(true);
        }}
      />
      {busy ? (
        <Text accessibilityLiveRegion="polite">Buscando opções…</Text>
      ) : entries.length === 0 ? (
        <>
          <Text>
            {step === 3
              ? "Esta grade ainda está sendo verificada."
              : "Não há opções verificadas para esta seleção."}
          </Text>
          {step === 3 ? (
            <Button
              title="Solicitar disponibilidade"
              onPress={async () => {
                try {
                  await api("/catalog/requests", {
                    method: "POST",
                    body: JSON.stringify({ courseOfferingId: ids[2] }),
                  });
                  setNotice("Solicitação registrada.");
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            />
          ) : null}
        </>
      ) : (
        entries.map((e) => (
          <Button
            key={e.id}
            title={`${subjects.includes(e.id) ? "✓ " : ""}${e.name}${e.modality ? ` · ${academicLabels[e.modality]}` : ""}${e.shift ? ` · ${academicLabels[e.shift]}` : ""}${e.workloadHours ? ` · ${e.workloadHours}h` : ""}`}
            onPress={() => {
              if (step < 5) {
                setIds((v) => [...v.slice(0, step), e.id]);
                setSelection((v) => [...v.slice(0, step), e]);
                setSubjects([]);
                setBusy(true);
                setPage(0);
                setNotice("");
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
      <Button
        title="Página anterior"
        disabled={page === 0 || busy}
        onPress={() => {
          setBusy(true);
          setPage((n) => n - 1);
        }}
      />
      <Text>Página {page + 1}</Text>
      <Button
        title="Próxima página"
        disabled={entries.length < 30 || busy}
        onPress={() => {
          setBusy(true);
          setPage((n) => n + 1);
        }}
      />
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
            setBusy(true);
            setPage(0);
            setNotice("");
            setSearch("");
          }}
        />
      ) : null}
    </Screen>
  );
}
