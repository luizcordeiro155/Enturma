import { useCallback, useState } from "react";
import { Text, View, Image } from "react-native";
import { useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import type { Profile } from "@enturma/contracts";
import { api, base, session } from "../../src/api";
import { NativeShowcaseEditor } from "../../src/profile-showcase";
import { Screen, Field, Button, ErrorMessage, useStyles } from "../../src/ui";
export default function ProfilePage() {
  const styles = useStyles();
  const [details, setDetails] = useState<
    NonNullable<Profile["profileDetails"]>
  >({});
  const [saving, setSaving] = useState(false);
  const [p, setP] = useState<Profile>(),
    [name, setName] = useState(""),
    [bio, setBio] = useState(""),
    [color, setColor] = useState("#183f36"),
    [token, setToken] = useState(""),
    [status, setStatus] = useState(""),
    [version, setVersion] = useState(0);
  const load = useCallback(async () => {
    try {
      const [user, c] = await Promise.all([
        api<Profile>("/users/me"),
        session(),
      ]);
      setP(user);
      setName(user.name);
      setBio(user.bio ?? "");
      setColor(user.accentColor ?? "#183f36");
      setDetails(user.profileDetails ?? {});
      setToken(c?.accessToken ?? "");
    } catch (e) {
      setStatus((e as Error).message);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
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
      setStatus("Imagem atualizada.");
    } catch (e) {
      setStatus((e as Error).message);
    }
  }
  return (
    <Screen title="Seu perfil">
      <ErrorMessage message={status} />
      {p && (
        <View style={[styles.row, { borderColor: color }]}>
          {p.hasBanner && (
            <Image
              source={{
                uri: `${base}/users/${p.id}/banner?v=${version}`,
                headers: { Authorization: `Bearer ${token}` },
              }}
              style={{ height: 120, width: "100%", borderRadius: 10 }}
            />
          )}
          {p.hasAvatar && (
            <Image
              source={{
                uri: `${base}/users/${p.id}/avatar?v=${version}`,
                headers: { Authorization: `Bearer ${token}` },
              }}
              style={{ width: 80, height: 80, borderRadius: 40 }}
            />
          )}
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.muted}>@{p.username}</Text>
          <Text style={styles.text}>{bio}</Text>
        </View>
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
          setStatus("");
          try {
            await api("/users/me/appearance", {
              method: "PUT",
              body: JSON.stringify({ name, bio, accentColor: color }),
            });
            await api("/users/me/profile-details", {
              method: "PUT",
              body: JSON.stringify(details),
            });
            setStatus("Perfil salvo para suas conversas.");
          } catch (e) {
            setStatus((e as Error).message);
          } finally {
            setSaving(false);
          }
        }}
      />
      <NativeShowcaseEditor />
    </Screen>
  );
}
