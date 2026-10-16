import { useEffect, useState } from "react";
import { View, Text, Switch } from "react-native";
import {
  PROFILE_PALETTES,
  type ProfileVisualAppearance,
} from "@enturma/contracts";
import { NativeProfileSurface } from "./profile-visual-preview";
import { api } from "./api";
import { Field, Button, ErrorMessage, FeedbackMessage, useStyles } from "./ui";
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
  appearance: ProfileVisualAppearance & {
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
export function NativeShowcaseEditor({
  primary = "#15764d",
  onAppearance,
}: {
  primary?: string;
  onAppearance?: (appearance: ProfileVisualAppearance) => void;
}) {
  const styles = useStyles();
  const [value, setValue] = useState<Showcase>(),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    api<Showcase>("/users/me/showcase")
      .then((s) => {
        if (live) setValue(s);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (value) onAppearance?.(value.appearance);
  }, [value, onAppearance]);
  if (!value)
    return error ? (
      <ErrorMessage message={error} />
    ) : (
      <Text style={styles.muted}>Carregando personalização…</Text>
    );
  const appearance = (key: string, v: string | number) =>
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
      <ErrorMessage message={error} />
      <FeedbackMessage message={notice} tone="success" />
      <NativeProfileSurface
        primary={primary}
        appearance={value.appearance}
        mural
      >
        <View style={[styles.card, { gap: 8 }]}>
          <Text style={styles.title}>Prévia do mural</Text>
          {value.widgets
            .filter((widget) => widget.visible)
            .map((widget) => (
              <Text key={widget.kind} style={styles.text}>
                {widget.favorite ? "★ " : ""}
                {widgets[widget.kind]}
                {widget.kind === "GOAL" ? ` · ${value.appearance.goal}` : ""}
              </Text>
            ))}
          {!value.widgets.some((widget) => widget.visible) ? (
            <Text style={styles.muted}>
              Escolha os widgets para montar seu mural.
            </Text>
          ) : null}
        </View>
      </NativeProfileSurface>
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
      <View style={styles.row}>
        {PROFILE_PALETTES.map((palette) => (
          <Button
            key={palette.name}
            title={palette.name}
            onPress={() => appearance("secondaryColor", palette.secondary)}
          />
        ))}
      </View>
      {[
        ["theme", "Tema", ["SOLID", "GRADIENT"], ["Cor sólida", "Degradê"]],
        [
          "muralMode",
          "Fundo do mural",
          ["PROFILE", "DEFAULT", "CUSTOM"],
          ["Cores do perfil", "Padrão do aplicativo", "Cores próprias"],
        ],
        [
          "gradientFlow",
          "Movimento das cores",
          ["STILL", "FLOW"],
          ["Parado", "Rio de cores"],
        ],
        [
          "entrance",
          "Abertura do perfil",
          ["NONE", "RISE", "BOOK", "ORBIT"],
          ["Sem animação", "Suave", "Livro", "Órbita"],
        ],
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
      {value.appearance.muralMode === "CUSTOM" ? (
        <>
          <Field
            label="Cor principal do mural (#RRGGBB)"
            value={value.appearance.muralColor ?? "#18243d"}
            onChangeText={(v) => appearance("muralColor", v)}
            maxLength={7}
          />
          <Field
            label="Segunda cor do mural (#RRGGBB)"
            value={value.appearance.muralSecondaryColor ?? "#661245"}
            onChangeText={(v) => appearance("muralSecondaryColor", v)}
            maxLength={7}
          />
        </>
      ) : null}
      <View style={styles.row}>
        {[0, 45, 90, 155, 220, 270].map((angle) => (
          <Button
            key={angle}
            title={`${(value.appearance.gradientAngle ?? 155) === angle ? "✓ " : ""}${angle}°`}
            onPress={() => appearance("gradientAngle", angle)}
          />
        ))}
      </View>
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
          busy ||
          !/^#[0-9a-f]{6}$/i.test(value.appearance.secondaryColor) ||
          (value.appearance.muralMode === "CUSTOM" &&
            ![
              value.appearance.muralColor ?? "#18243d",
              value.appearance.muralSecondaryColor ?? "#661245",
            ].every((color) => /^#[0-9a-f]{6}$/i.test(color)))
        }
        onPress={() => {
          setBusy(true);
          setError("");
          setNotice("");
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
            .then(() => setNotice("Mural e privacidade atualizados."))
            .catch((e) => setError(e.message))
            .finally(() => setBusy(false));
        }}
      />
    </View>
  );
}
