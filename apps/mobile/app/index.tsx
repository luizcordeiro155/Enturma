import { useState } from "react";
import { Text } from "react-native";
import { useRouter } from "expo-router";
import { request, type Credentials } from "@enturma/contracts";
import { base, save } from "../src/api";
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
  return (
    <Screen title={register ? "Encontre a sua turma." : "Bom te ver de novo."}>
      <Text style={styles.muted}>Seu espaço para aprender em companhia.</Text>
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
      <Button
        title={register ? "Já tenho conta" : "Criar minha conta"}
        onPress={() => setRegister((v) => !v)}
      />
    </Screen>
  );
}
