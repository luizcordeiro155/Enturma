import { useEffect, useState } from "react";
import { Text, Image } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { api, base, session } from "../../src/api";
import { Screen, Button, ErrorMessage, useStyles } from "../../src/ui";
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
    [error, setError] = useState("");
  useEffect(() => {
    Promise.all([api<Profile>(`/users/${id}/profile`), session()])
      .then(([p, c]) => {
        setProfile(p);
        setToken(c?.accessToken ?? "");
      })
      .catch((e) => setError(e.message));
  }, [id]);
  return (
    <Screen title={profile?.name ?? "Perfil"}>
      <ErrorMessage message={error} />
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
        title="Adicionar amizade"
        disabled={!profile}
        onPress={() =>
          void api("/friends", {
            method: "POST",
            body: JSON.stringify({ username: profile?.username }),
          })
            .then(() => setError("Solicitação enviada."))
            .catch((e) => setError(e.message))
        }
      />
    </Screen>
  );
}
