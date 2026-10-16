import type {
  Profile as BaseProfile,
  ProfileVisualAppearance,
} from "@enturma/contracts";
import {
  NativeProfilePreview,
  NativeProfileSurface,
} from "../../src/profile-visual-preview";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { api, session } from "../../src/api";
import {
  Screen,
  Button,
  ErrorMessage,
  FeedbackMessage,
  useStyles,
} from "../../src/ui";
type Profile = Pick<
  BaseProfile,
  | "id"
  | "name"
  | "username"
  | "bio"
  | "accentColor"
  | "hasAvatar"
  | "hasBanner"
  | "profileDetails"
> & { showcaseAppearance?: ProfileVisualAppearance };
type PublicShowcase = {
  appearance: ProfileVisualAppearance & {
    goal?: string;
    technologies?: string;
    projects?: string;
  };
  widgets: {
    kind: string;
    visible: boolean;
    content?: { name?: string; title?: string; game?: string; id?: string }[];
  }[];
  stats?: {
    level: number;
    totalXp: number;
    currentStreak: number;
    studyMinutes: number;
  };
  achievements?: { code: string; name: string; earnedAt?: string }[];
};
const widgetNames: Record<string, string> = {
  SUBJECTS: "Disciplinas",
  GOAL: "Meta atual",
  STREAK: "Sequência",
  ACHIEVEMENTS: "Conquistas",
  NOTEBOOKS: "Cadernos",
  POSTS: "Publicações",
  ROOMS: "Salas",
  HOURS: "Horas de estudo",
  PROJECTS: "Projetos",
  TECHNOLOGIES: "Tecnologias",
  ACADEMIC: "Vida acadêmica",
  MINIGAMES: "Minigames",
};
export default function UserProfile() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile>(),
    [token, setToken] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const [showcase, setShowcase] = useState<PublicShowcase>();
  const generation = useRef(0);
  useEffect(() => {
    const request = ++generation.current;
    Promise.all([
      api<Profile>(`/users/${id}/profile`),
      session(),
      api<PublicShowcase>(`/users/${id}/showcase`),
    ])
      .then(([p, c, mural]) => {
        if (request !== generation.current) return;
        setProfile(p);
        setShowcase(mural);
        setToken(c?.accessToken ?? "");
        setError("");
      })
      .catch((e) => {
        if (request === generation.current) setError(e.message);
      });
    return () => {
      generation.current++;
    };
  }, [id]);
  return (
    <Screen title={profile?.name ?? "Perfil"}>
      <ErrorMessage message={error} />
      <FeedbackMessage message={notice} tone="success" />
      {profile && (
        <NativeProfilePreview
          profile={profile}
          token={token}
          version={0}
          appearance={profile.showcaseAppearance}
        />
      )}
      {profile && showcase && (
        <NativeProfileSurface
          primary={profile.accentColor ?? "#15764d"}
          appearance={showcase.appearance}
          mural
        >
          <View style={{ gap: 12 }}>
            {showcase.widgets
              .filter((w) => w.visible)
              .map((widget) => (
                <View key={widget.kind} style={styles.card}>
                  <Text style={styles.label}>
                    {widgetNames[widget.kind] ?? widget.kind}
                  </Text>
                  {widget.kind === "GOAL" && (
                    <Text style={styles.text}>
                      {showcase.appearance.goal ||
                        "Nenhuma meta compartilhada."}
                    </Text>
                  )}
                  {widget.kind === "PROJECTS" && (
                    <Text style={styles.text}>
                      {showcase.appearance.projects ||
                        "Nenhum projeto compartilhado."}
                    </Text>
                  )}
                  {widget.kind === "TECHNOLOGIES" && (
                    <Text style={styles.text}>
                      {showcase.appearance.technologies ||
                        "Nenhuma tecnologia compartilhada."}
                    </Text>
                  )}
                  {widget.kind === "STREAK" && showcase.stats && (
                    <Text style={styles.text}>
                      {showcase.stats.currentStreak} dias de sequência
                    </Text>
                  )}
                  {widget.kind === "HOURS" && showcase.stats && (
                    <Text style={styles.text}>
                      {Math.round(showcase.stats.studyMinutes / 60)} horas
                      estudadas
                    </Text>
                  )}
                  {widget.kind === "ACHIEVEMENTS" &&
                    showcase.achievements
                      ?.filter((a) => a.earnedAt)
                      .map((a) => (
                        <Text key={a.code} style={styles.text}>
                          {a.name}
                        </Text>
                      ))}
                  {widget.content?.map((entry, i) => (
                    <Text key={entry.id ?? i} style={styles.text}>
                      {entry.name || entry.title || entry.game}
                    </Text>
                  ))}
                </View>
              ))}
            {!showcase.widgets.some((w) => w.visible) && (
              <View style={styles.card}>
                <Text style={styles.text}>
                  Este perfil ainda não compartilhou widgets no mural.
                </Text>
              </View>
            )}
          </View>
        </NativeProfileSurface>
      )}
      <Button
        title={busy ? "Enviando…" : "Adicionar amizade"}
        disabled={!profile || busy}
        onPress={() => {
          setBusy(true);
          setError("");
          setNotice("");
          void api("/friends", {
            method: "POST",
            body: JSON.stringify({ username: profile?.username }),
          })
            .then(() => {
              setError("");
              setNotice("Solicitação enviada.");
            })
            .catch((e) => setError(e.message))
            .finally(() => setBusy(false));
        }}
      />
    </Screen>
  );
}
