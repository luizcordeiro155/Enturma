import { useEffect, useRef, useState } from "react";
import { Text, Image } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { api, base, session } from "../../src/api";
import {
  Screen,
  Button,
  ErrorMessage,
  FeedbackMessage,
  useStyles,
} from "../../src/ui";
type Profile = {
  id: string;
  name: string;
  username: string;
  bio?: string;
  hasAvatar: boolean;
};
export default function UserProfile() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile>(),
    [token, setToken] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const generation = useRef(0);
  useEffect(() => {
    const request = ++generation.current;
    Promise.all([api<Profile>(`/users/${id}/profile`), session()])
      .then(([p, c]) => {
        if (request !== generation.current) return;
        setProfile(p);
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
      {profile?.hasAvatar && (
        <Image
          source={{
            uri: `${base}/users/${id}/avatar`,
            headers: { Authorization: `Bearer ${token}` },
          }}
          style={{ height: 100, width: 100, borderRadius: 50 }}
        />
      )}
      <Text style={styles.muted}>@{profile?.username}</Text>
      <Text style={styles.text}>{profile?.bio}</Text>
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
