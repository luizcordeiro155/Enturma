import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { request, type Credentials } from "@enturma/contracts";
import { api, base, save, session } from "../src/api";
import { Screen, Field, Button, ErrorMessage, useStyles } from "../src/ui";

export default function Login() {
  const styles = useStyles();
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    let active = true;
    const verify = async () => {
      try {
        if (await session()) {
          await api("/users/me");
          if (active) router.replace("/home");
        }
      } catch {
        // A falha de rede não apaga o login salvo; o usuário pode tentar novamente.
      } finally {
        if (active) setRestoring(false);
      }
    };
    void verify();
    return () => { active = false; };
  }, [router]);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const c = await request<Credentials>(
        base,
        `/auth/${register ? "register" : "login"}`,
        {
          method: "POST",
          body: JSON.stringify({
            email,
            password,
            device: "Aplicativo Enturma",
            ...(register ? { name, username } : {}),
          }),
        },
      );
      await save(c);
      router.replace(register ? "/onboarding" : "/home");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (restoring) return (
    <Screen title="">
      <Text style={styles.muted}>Verificando sua sessão...</Text>
    </Screen>
  );

  return (
    <Screen title="">
      <View style={{ alignItems: "center", paddingTop: 18, gap: 8 }}>
        <View
          style={[
            styles.card,
            {
              width: 68,
              height: 68,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <Ionicons name="book-outline" size={38} color={styles.text.color} />
        </View>
        <Text style={styles.title}>
          enturma<Text style={styles.accent}>.</Text>
        </Text>
        <Text style={[styles.muted, { textAlign: "center" }]}>
          Seu espaço para estudar em companhia, agora com a mesma identidade do
          Enturma Web e Desktop.
        </Text>
      </View>

      <View style={[styles.card, { gap: 14 }]}>
        <Text style={[styles.title, { fontSize: 24, lineHeight: 30 }]}>
          {register ? "Crie sua conta" : "Bom te ver de novo"}
        </Text>
        <ErrorMessage message={error} />

        {register ? (
          <>
            <Field label="Nome" value={name} onChangeText={setName} />
            <Field
              label="Usuário"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </>
        ) : null}

        <Field
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <Field
          label="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete={register ? "new-password" : "current-password"}
        />

        <Button
          title={busy ? "Aguarde…" : register ? "Criar conta" : "Entrar"}
          disabled={busy}
          onPress={submit}
        />
      </View>

      <Button
        title={register ? "Já tenho uma conta" : "Criar minha conta"}
        onPress={() => setRegister((v) => !v)}
      />
    </Screen>
  );
}
