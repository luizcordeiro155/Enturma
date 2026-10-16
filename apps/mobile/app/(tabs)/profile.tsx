import { useCallback, useRef, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import type { Profile, ProfileVisualAppearance } from "@enturma/contracts";
import { api, session } from "../../src/api";
import { NativeProfilePreview } from "../../src/profile-visual-preview";
import { NativeShowcaseEditor } from "../../src/profile-showcase";
import {
  Screen,
  Field,
  Button,
  ErrorMessage,
  FeedbackMessage,
  useStyles,
} from "../../src/ui";
export default function ProfilePage() {
  const styles = useStyles();
  const [visual, setVisual] = useState<ProfileVisualAppearance>();
  const [details, setDetails] = useState<
    NonNullable<Profile["profileDetails"]>
  >({});
  const [saving, setSaving] = useState(false);
  const [p, setP] = useState<Profile>(),
    [name, setName] = useState(""),
    [bio, setBio] = useState(""),
    [color, setColor] = useState("#183f36"),
    [token, setToken] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [version, setVersion] = useState(0);
  const generation = useRef(0);
  const load = useCallback(async () => {
    const request = ++generation.current;
    try {
      const [user, c] = await Promise.all([
        api<Profile>("/users/me"),
        session(),
      ]);
      if (request !== generation.current) return;
      setP(user);
      setName(user.name);
      setBio(user.bio ?? "");
      setColor(user.accentColor ?? "#183f36");
      setDetails(user.profileDetails ?? {});
      setToken(c?.accessToken ?? "");
      setError("");
    } catch (e) {
      if (request === generation.current) setError((e as Error).message);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        generation.current++;
      };
    }, [load]),
  );
  async function image(kind: "avatar" | "banner") {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: kind === "avatar" ? [1, 1] : [3, 1],
        quality: 0.8,
      });
      if (result.canceled) return;
      setError("");
      setNotice("");
      const asset = result.assets[0];
      const form = new FormData();
      form.append("file", {
        uri: asset.uri,
        name: "perfil.jpg",
        type: asset.mimeType ?? "image/jpeg",
      } as unknown as Blob);
      await api(`/users/me/${kind}`, { method: "POST", body: form });
      setVersion(Date.now());
      await load();
      setNotice("Imagem atualizada.");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Screen title="Seu perfil">
      <ErrorMessage message={error} />
      <FeedbackMessage message={notice} tone="success" />
      {p && (
        <NativeProfilePreview
          profile={{
            ...p,
            name,
            bio,
            accentColor: color,
            profileDetails: details,
          }}
          appearance={visual}
          token={token}
          version={version}
        />
      )}
      <Button
        title="Editar foto e recortar"
        onPress={() => void image("avatar")}
      />
      <Button
        title="Editar banner e recortar"
        onPress={() => void image("banner")}
      />
      <Field
        label="Nome de exibição"
        value={name}
        onChangeText={setName}
        maxLength={100}
      />
      <Field
        label="Bio"
        value={bio}
        onChangeText={setBio}
        multiline
        maxLength={280}
      />
      <Field
        label="Cor do perfil (#RRGGBB)"
        value={color}
        onChangeText={setColor}
        maxLength={7}
        autoCapitalize="none"
      />
      {(
        [
          ["pronouns", "Pronomes", 40],
          ["statusText", "Status personalizado", 80],
          ["interests", "Interesses", 120],
          ["website", "Site ou GitHub", 200],
        ] as const
      ).map(([key, label, maxLength]) => (
        <Field
          key={key}
          label={label}
          maxLength={maxLength}
          value={details[key] ?? ""}
          autoCapitalize={key === "website" ? "none" : "sentences"}
          onChangeText={(text) =>
            setDetails((old) => ({ ...old, [key]: text }))
          }
        />
      ))}
      <Text style={styles.title}>Decoração do avatar</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {[
          ["NONE", "Sem decoração"],
          ["RING", "Anel"],
          ["GLOW", "Brilho"],
          ["GRADIENT", "Degradê"],
        ].map(([value, label]) => (
          <Button
            key={value}
            title={`${(details.decoration ?? "NONE") === value ? "✓ " : ""}${label}`}
            onPress={() => setDetails((old) => ({ ...old, decoration: value }))}
          />
        ))}
      </View>
      <Text style={styles.title}>Estilo do nome</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {[
          ["SYSTEM", "Padrão"],
          ["MONO", "Código"],
          ["SERIF", "Editorial"],
        ].map(([value, label]) => (
          <Button
            key={value}
            title={`${(details.nameFont ?? "SYSTEM") === value ? "✓ " : ""}${label}`}
            onPress={() => setDetails((old) => ({ ...old, nameFont: value }))}
          />
        ))}
      </View>
      <Button
        title="Salvar perfil"
        disabled={
          saving || !/^#[0-9a-f]{6}$/i.test(color) || name.trim().length < 2
        }
        onPress={async () => {
          setSaving(true);
          setError("");
          setNotice("");
          try {
            await api("/users/me/appearance", {
              method: "PUT",
              body: JSON.stringify({ name, bio, accentColor: color }),
            });
            await api("/users/me/profile-details", {
              method: "PUT",
              body: JSON.stringify(details),
            });
            setNotice("Perfil salvo para suas conversas.");
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setSaving(false);
          }
        }}
      />
      <NativeShowcaseEditor primary={color} onAppearance={setVisual} />
    </Screen>
  );
}
