import { useEffect, useState } from "react";
import { View, Text, Switch } from "react-native";
import { api } from "./api";
import { Field, Button, ErrorMessage, useStyles } from "./ui";
type Widget = { kind: string; visible: boolean; favorite: boolean };
type Achievement = {
  code: string;
  name: string;
  description: string;
  earnedAt?: string;
  requirement: number;
  progress: number;
  xp: number;
};
type Showcase = {
  appearance: {
    secondaryColor: string;
    theme: string;
    effect: string;
    layout: string;
    goal: string;
    technologies: string;
    projects: string;
  };
  privacy: Record<string, boolean>;
  widgets: Widget[];
  badges?: { code: string }[];
  achievements?: Achievement[];
  stats?: { level: number; totalXp: number; currentStreak: number };
};
const widgets: Record<string, string> = {
  SUBJECTS: "Disciplinas favoritas",
  GOAL: "Meta atual",
  STREAK: "Sequência",
  ACHIEVEMENTS: "Conquistas",
  NOTEBOOKS: "Cadernos recentes",
  POSTS: "Publicações",
  ROOMS: "Salas frequentadas",
  HOURS: "Horas de estudo",
  PROJECTS: "Projetos",
  TECHNOLOGIES: "Tecnologias",
  ACADEMIC: "Vida acadêmica",
  MINIGAMES: "Minigames",
};
const privacy: Record<string, string> = {
  ACADEMIC: "Vida acadêmica pública",
  STATS: "XP e estatísticas públicos",
  ACHIEVEMENTS: "Conquistas públicas",
  JOINED: "Data de entrada pública",
  WIDGETS: "Widgets públicos",
};
export function NativeShowcaseEditor() {
  const styles = useStyles();
  const [value, setValue] = useState<Showcase>(),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    api<Showcase>("/users/me/showcase")
      .then((s) => {
        if (live) setValue(s);
      })
      .catch((e) => {
        if (live) setStatus(e.message);
      });
    return () => {
      live = false;
    };
  }, []);
  if (!value)
    return <ErrorMessage message={status || "Carregando personalização…"} />;
  const appearance = (key: string, v: string) =>
    setValue({ ...value, appearance: { ...value.appearance, [key]: v } });
  const update = (index: number, patch: Partial<Widget>) =>
    setValue({
      ...value,
      widgets: value.widgets.map((w, i) =>
        i === index ? { ...w, ...patch } : w,
      ),
    });
  const move = (index: number, offset: number) => {
    const rows = [...value.widgets];
    [rows[index], rows[index + offset]] = [rows[index + offset], rows[index]];
    setValue({ ...value, widgets: rows });
  };
  return (
    <View style={{ gap: 18 }}>
      <Text style={styles.title}>Seu mural acadêmico</Text>
      <ErrorMessage message={status} />
      {value.stats && (
        <Text style={styles.text}>
          Nível {value.stats.level} · {value.stats.totalXp} XP ·{" "}
          {value.stats.currentStreak} dias de sequência
        </Text>
      )}
      <Field
        label="Cor secundária (#RRGGBB)"
        value={value.appearance.secondaryColor}
        onChangeText={(v) => appearance("secondaryColor", v)}
        maxLength={7}
      />
      {[
        ["theme", "Tema", ["SOLID", "GRADIENT"], ["Cor sólida", "Degradê"]],
        [
          "effect",
          "Efeito",
          ["NONE", "AURORA", "DOTS"],
          ["Sem efeito", "Aurora", "Constelação"],
        ],
        [
          "layout",
          "Ordem",
          ["IDENTITY_FIRST", "WIDGETS_FIRST"],
          ["Identidade primeiro", "Mural primeiro"],
        ],
      ].map(([key, title, options, labels]) => (
        <View key={String(key)} style={styles.row}>
          <Text style={styles.label}>{title}</Text>
          {(options as string[]).map((option, i) => (
            <Button
              key={option}
              title={`${value.appearance[key as keyof Showcase["appearance"]] === option ? "✓ " : ""}${labels[i]}`}
              onPress={() => appearance(String(key), option)}
            />
          ))}
        </View>
      ))}
      <Field
        label="Meta atual"
        value={value.appearance.goal}
        onChangeText={(v) => appearance("goal", v)}
        maxLength={200}
      />
      <Field
        label="Tecnologias favoritas"
        value={value.appearance.technologies}
        onChangeText={(v) => appearance("technologies", v)}
        maxLength={200}
      />
      <Field
        label="Projetos"
        value={value.appearance.projects}
        onChangeText={(v) => appearance("projects", v)}
        multiline
        maxLength={1000}
      />
      {Object.entries(privacy).map(([key, label]) => (
        <View style={styles.row} key={key}>
          <Text style={styles.label}>{label}</Text>
          <Switch
            accessibilityLabel={label}
            value={value.privacy[key] ?? false}
            onValueChange={(v) =>
              setValue({ ...value, privacy: { ...value.privacy, [key]: v } })
            }
          />
        </View>
      ))}
      <Text style={styles.label}>Widgets ({value.widgets.length}/8)</Text>
      {value.widgets.map((w, i) => (
        <View style={styles.row} key={w.kind}>
          <Text style={styles.label}>{widgets[w.kind]}</Text>
          <Button
            title={w.visible ? "Visível · ocultar" : "Oculto · exibir"}
            onPress={() => update(i, { visible: !w.visible })}
          />
          <Button
            title={w.favorite ? "★ Favorito" : "Destacar widget"}
            onPress={() => update(i, { favorite: !w.favorite })}
          />
          <Button
            title="Mover para cima"
            disabled={i === 0}
            onPress={() => move(i, -1)}
          />
          <Button
            title="Mover para baixo"
            disabled={i === value.widgets.length - 1}
            onPress={() => move(i, 1)}
          />
          <Button
            title="Remover widget"
            onPress={() =>
              setValue({
                ...value,
                widgets: value.widgets.filter((_, n) => i !== n),
              })
            }
          />
        </View>
      ))}
      {value.widgets.length < 8 &&
        Object.entries(widgets)
          .filter(([key]) => !value.widgets.some((w) => w.kind === key))
          .map(([key, label]) => (
            <Button
              key={key}
              title={`Adicionar ${label}`}
              onPress={() =>
                setValue({
                  ...value,
                  widgets: [
                    ...value.widgets,
                    { kind: key, visible: true, favorite: false },
                  ],
                })
              }
            />
          ))}
      <Text style={styles.title}>Conquistas</Text>
      {value.achievements?.map((a) => {
        const selected = value.badges?.some((b) => b.code === a.code);
        return (
          <View style={styles.row} key={a.code}>
            <Text style={styles.label}>
              {a.name} · {a.xp} XP
            </Text>
            <Text style={styles.text}>{a.description}</Text>
            <Text style={styles.muted}>
              {a.earnedAt
                ? `Conquistada em ${new Date(a.earnedAt).toLocaleDateString("pt-BR")}`
                : `Progresso ${a.progress}/${a.requirement}`}
            </Text>
            {a.earnedAt && (
              <Button
                title={selected ? "Remover destaque" : "Destacar insígnia"}
                disabled={!selected && (value.badges?.length ?? 0) >= 4}
                onPress={() =>
                  setValue({
                    ...value,
                    badges: selected
                      ? value.badges?.filter((b) => b.code !== a.code)
                      : [...(value.badges ?? []), { code: a.code }],
                  })
                }
              />
            )}
          </View>
        );
      })}
      <Button
        title={busy ? "Salvando…" : "Salvar mural e privacidade"}
        disabled={
          busy || !/^#[0-9a-f]{6}$/i.test(value.appearance.secondaryColor)
        }
        onPress={() => {
          setBusy(true);
          void api("/users/me/showcase", {
            method: "PUT",
            body: JSON.stringify({
              ...value.appearance,
              privacy: value.privacy,
              widgets: value.widgets.map(({ kind, visible, favorite }) => ({
                kind,
                visible,
                favorite,
              })),
              badges: value.badges?.map((b) => b.code) ?? [],
            }),
          })
            .then(() => setStatus("Mural e privacidade atualizados."))
            .catch((e) => setStatus(e.message))
            .finally(() => setBusy(false));
        }}
      />
    </View>
  );
}
