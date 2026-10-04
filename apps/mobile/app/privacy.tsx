import { useCallback, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, logout } from "../src/api";
import {
  Screen,
  Button,
  ErrorMessage,
  FeedbackMessage,
  Field,
  useStyles,
} from "../src/ui";

type Deletion = {
  status?: string;
  executeAt?: string;
  mode?: string;
  cancelledAt?: string | null;
  executedAt?: string | null;
};

export default function Privacy() {
  const styles = useStyles();
  const router = useRouter();
  const [data, setData] = useState<Deletion>();
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [warning, setWarning] = useState("");
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const entrance = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    const current = ++generation.current;
    try {
      const value = await api<Deletion>("/account/privacy/deletion");
      if (current !== generation.current) return;
      setData(value);
      setError("");
      entrance.setValue(0);
      Animated.spring(entrance, {
        toValue: 1,
        useNativeDriver: true,
        tension: 55,
        friction: 8,
      }).start();
    } catch (e) {
      if (current === generation.current) setError((e as Error).message);
    }
  }, [entrance]);

  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        generation.current++;
      };
    }, [load]),
  );

  const pending =
    !!data?.executeAt &&
    !data.cancelledAt &&
    !data.executedAt &&
    data.mode === "DELAYED";

  async function schedule() {
    if (confirm !== "EXCLUIR") return;
    setBusy(true);
    setError("");
    setNotice("");
    setWarning("");
    try {
      await api("/account/privacy/deletion/schedule", {
        method: "POST",
        body: "{}",
      });
      setConfirm("");
      setNotice(
        "Exclusão agendada. Você pode cancelar durante os próximos 5 dias.",
      );
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setBusy(true);
    setError("");
    setNotice("");
    setWarning("");
    try {
      await api("/account/privacy/deletion/cancel", {
        method: "POST",
        body: "{}",
      });
      setNotice("Exclusão cancelada.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function eraseNow() {
    if (confirm !== "EXCLUIR") return;
    setBusy(true);
    setError("");
    setNotice("");
    setWarning("Apagando seus dados e encerrando a sessão…");
    try {
      await api("/account/privacy/deletion/now", { method: "DELETE" });
      await logout().catch(() => {});
      router.replace("/");
    } catch (e) {
      setWarning("");
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <Screen title="Privacidade e dados">
      <ErrorMessage message={error} />
      <FeedbackMessage message={notice} tone="success" />
      <FeedbackMessage message={warning} tone="warning" />
      <Animated.View
        style={{
          gap: 14,
          opacity: entrance,
          transform: [
            {
              translateY: entrance.interpolate({
                inputRange: [0, 1],
                outputRange: [14, 0],
              }),
            },
          ],
        }}
      >
        <View style={[styles.card, { gap: 10 }]}>
          <Ionicons
            name="shield-checkmark-outline"
            size={34}
            color={styles.text.color}
          />
          <Text style={styles.label}>Você controla seus dados</Text>
          <Text style={styles.muted}>
            Exclua imediatamente ou agende a exclusão com uma janela de 5 dias
            para cancelar.
          </Text>
        </View>

        {pending ? (
          <View style={[styles.card, { gap: 10 }]}>
            <Text style={styles.label}>Exclusão agendada</Text>
            <Text style={styles.muted}>
              Programada para{" "}
              {new Date(data!.executeAt!).toLocaleString("pt-BR")}.
            </Text>
            <Button
              title="Cancelar exclusão"
              disabled={busy}
              onPress={() => void cancel()}
            />
          </View>
        ) : null}

        <View style={[styles.card, { gap: 10 }]}>
          <Text style={styles.label}>Confirmação de segurança</Text>
          <Text style={styles.muted}>
            Digite EXCLUIR para liberar qualquer ação destrutiva.
          </Text>
          <Field
            label="Confirmação"
            value={confirm}
            onChangeText={setConfirm}
            autoCapitalize="characters"
          />
        </View>

        <View style={[styles.card, { gap: 10 }]}>
          <Text style={styles.label}>Excluir em 5 dias</Text>
          <Text style={styles.muted}>
            A solicitação pode ser cancelada nesta tela antes do prazo.
          </Text>
          <Button
            title="Agendar exclusão"
            disabled={busy || pending || confirm !== "EXCLUIR"}
            onPress={() => void schedule()}
          />
        </View>

        <View style={[styles.card, { gap: 10 }]}>
          <Text style={[styles.label, { color: "#ff8f8f" }]}>
            Apagar tudo agora
          </Text>
          <Text style={styles.muted}>
            Revoga sessões, remove dados privados e anonimiza imediatamente os
            registros que precisam permanecer para integridade do serviço.
          </Text>
          <Button
            title="Apagar tudo agora"
            disabled={busy || confirm !== "EXCLUIR"}
            onPress={() => void eraseNow()}
          />
        </View>
      </Animated.View>
    </Screen>
  );
}
