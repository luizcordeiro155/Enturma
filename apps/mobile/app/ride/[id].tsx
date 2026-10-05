import { useCallback, useState } from "react";
import { Alert, Animated, Linking, Share, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useNativeCall, NativeCallStage } from "../../src/native-call";
import { api } from "../../src/api";
import { useRealtime } from "../../src/realtime";
import {
  Screen,
  Field,
  Button,
  ErrorMessage,
  useStyles,
} from "../../src/ui";
import { useRideActionMotion, useRideEntrance } from "../../src/ride-motion";

type Match = {
  id: string;
  rideId: string;
  driverId: string;
  passengerId: string;
  driverName: string;
  passengerName: string;
  status: string;
  rideStatus: string;
  tripStatus: string;
  driverConfirmed: boolean;
  passengerConfirmed: boolean;
  boardingCode?: string;
  boardedAt?: string;
  meetingPoint?: string;
  closedAt?: string;
  campusName: string;
  originArea: string;
  departureAt: string;
};

function RideMessageRow({
  row,
  index,
}: {
  row: { id: string; name: string; body: string };
  index: number;
}) {
  const styles = useStyles();
  const entrance = useRideEntrance(index);
  return (
    <Animated.View style={[styles.row, entrance]}>
      <Text style={styles.label}>{row.name}</Text>
      <Text style={styles.text}>{row.body}</Text>
    </Animated.View>
  );
}

function tripStatusLabel(status: string) {
  const labels: Record<string, string> = {
    SCHEDULED: "Agendada",
    MATCHING: "Procurando combinações",
    DRIVER_ON_THE_WAY: "Motorista a caminho",
    ARRIVING: "Motorista chegando",
    WAITING_PASSENGER: "Aguardando passageiro",
    IN_PROGRESS: "Em viagem",
    ARRIVED: "Destino alcançado",
    COMPLETED: "Concluída",
    CANCELLED: "Cancelada",
  };
  return labels[status] ?? status.replaceAll("_", " ");
}

function nextDriverStatus(status: string) {
  const map: Record<string, { status: string; label: string } | undefined> = {
    SCHEDULED: {
      status: "DRIVER_ON_THE_WAY",
      label: "Iniciar deslocamento",
    },
    MATCHING: {
      status: "DRIVER_ON_THE_WAY",
      label: "Iniciar deslocamento",
    },
    DRIVER_ON_THE_WAY: { status: "ARRIVING", label: "Estou chegando" },
    ARRIVING: {
      status: "WAITING_PASSENGER",
      label: "Cheguei ao ponto",
    },
    WAITING_PASSENGER: { status: "IN_PROGRESS", label: "Iniciar viagem" },
    IN_PROGRESS: { status: "ARRIVED", label: "Chegamos ao destino" },
    ARRIVED: { status: "COMPLETED", label: "Concluir carona" },
  };
  return map[status];
}

export default function RideChat() {
  const call = useNativeCall();
  const { id } = useLocalSearchParams<{ id: string }>();
  const styles = useStyles();
  const router = useRouter();
  const entrance = useRideEntrance(0);
  const actionMotion = useRideActionMotion();
  const [messages, setMessages] = useState<
    { id: string; name: string; body: string }[]
  >([]);
  const [match, setMatch] = useState<Match>();
  const [me, setMe] = useState("");
  const [body, setBody] = useState("");
  const [point, setPoint] = useState("");
  const [boarding, setBoarding] = useState("");
  const [driverCode, setDriverCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [matches, user] = await Promise.all([
        api<Match[]>("/matches"),
        api<{ id: string }>("/users/me"),
      ]);
      const current = matches.find((row) => row.id === id);
      setMatch(current);
      setMe(user.id);
      if (current?.meetingPoint) setPoint(current.meetingPoint);
      if (current?.boardingCode) setBoarding(current.boardingCode);
      if (current?.status === "ACCEPTED") {
        const rows = await api<typeof messages>(`/matches/${id}/messages`);
        setMessages([...rows].reverse());
      } else {
        setMessages([]);
      }
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useRealtime(
    (event) => {
      if (event.type === "rides_changed") void load();
    },
    undefined,
    "rides",
  );

  async function action(path: string, method = "POST", data?: object) {
    setBusy(true);
    try {
      const result = await api<unknown>(path, {
        method,
        ...(data ? { body: JSON.stringify(data) } : {}),
      });
      setError("");
      actionMotion.pulse();
      setBody("");
      await load();
      return result;
    } catch (e) {
      setError((e as Error).message);
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  if (!match)
    return (
      <Screen title="Carona">
        <ErrorMessage message={error} />
        <Text style={styles.muted}>Carregando detalhes…</Text>
      </Screen>
    );

  const isDriver = match.driverId === me;
  const isPassenger = match.passengerId === me;
  const peer = isDriver ? match.passengerName : match.driverName;
  const closed = !!match.closedAt || match.rideStatus !== "OPEN";
  const next = nextDriverStatus(match.tripStatus);

  return (
    <Screen title={`Carona com ${peer}`}>
      <ErrorMessage message={error} />
      {message ? <Text style={styles.success}>{message}</Text> : null}

      <Animated.View style={[styles.row, entrance]}>
        <Text style={styles.label}>
          {match.originArea} → {match.campusName}
        </Text>
        <Text style={styles.text}>
          {new Date(match.departureAt).toLocaleString("pt-BR")}
        </Text>
        <Text style={styles.muted}>
          Status: {tripStatusLabel(match.tripStatus)}
        </Text>
        <Text style={styles.muted}>
          Motorista: {match.driverConfirmed ? "confirmado" : "aguardando"} ·
          Passageiro: {match.passengerConfirmed ? "confirmado" : "aguardando"}
        </Text>
      </Animated.View>

      <Animated.View style={actionMotion.style}>
        {!(
          (isDriver && match.driverConfirmed) ||
          (isPassenger && match.passengerConfirmed)
        ) ? (
          <Button
            title="Confirmar participação"
            disabled={busy}
            onPress={() =>
              void action(`/matches/${id}/confirm`).then(() =>
                setMessage("Participação confirmada."),
              )
            }
          />
        ) : null}
      </Animated.View>

      {isPassenger ? (
        <>
          <Button
            title={boarding ? `Código de embarque: ${boarding}` : "Ver código de embarque"}
            disabled={busy}
            onPress={() =>
              void api<{ code: string }>(`/matches/${id}/boarding-code`, {
                cache: "no-store",
              })
                .then((result) => {
                  setBoarding(result.code);
                  actionMotion.pulse();
                })
                .catch((e) => setError(e.message))
            }
          />
        </>
      ) : null}

      {isDriver && !match.boardedAt ? (
        <View style={styles.row}>
          <Field
            label="Código do passageiro"
            value={driverCode}
            onChangeText={setDriverCode}
            keyboardType="number-pad"
            maxLength={4}
          />
          <Button
            title="Confirmar embarque"
            disabled={busy || !/^[0-9]{4}$/.test(driverCode)}
            onPress={() =>
              void action(`/matches/${id}/board`, "POST", {
                code: driverCode,
              }).then(() => setMessage("Embarque confirmado."))
            }
          />
        </View>
      ) : null}

      {isDriver && next && match.rideStatus === "OPEN" ? (
        <Button
          title={next.label}
          disabled={busy}
          onPress={() =>
            void action(`/rides/${match.rideId}/status`, "POST", {
              status: next.status,
            }).then(() => setMessage("Andamento da carona atualizado."))
          }
        />
      ) : null}

      <View style={styles.row}>
        <Text style={styles.label}>Ponto de encontro</Text>
        <Field
          label="Ponto privado"
          value={point}
          onChangeText={setPoint}
          editable={!closed}
          maxLength={500}
        />
        <Button
          title="Salvar ponto"
          disabled={busy || closed || !point.trim()}
          onPress={() =>
            void action(`/matches/${id}/meeting-point`, "PUT", { point }).then(
              () => setMessage("Ponto de encontro atualizado."),
            )
          }
        />
      </View>

      {!closed ? (
        <>
          <Button
            title="Entrar na chamada"
            onPress={() => void call.join(`ride:${id}`)}
          />
          {call.roomId === `ride:${id}` ? <NativeCallStage /> : null}
        </>
      ) : null}

      <View style={styles.row}>
        <Text style={styles.label}>Segurança e acompanhamento</Text>
        <Text style={styles.muted}>
          No APK oficial o acompanhamento usa a interface Web integrada, com
          localização temporária e permissão nativa. Em uma build Expo nativa,
          este botão abre o mesmo fluxo seguro.
        </Text>
        <Button
          title="Abrir acompanhamento ao vivo"
          onPress={() =>
            void Linking.openURL(
              `https://enturma-flax.vercel.app/caronas/matches?match=${encodeURIComponent(id)}`,
            )
          }
        />
        <Button
          title="Compartilhar com contato de confiança"
          disabled={busy}
          onPress={() =>
            void action(`/matches/${id}/safety-share`).then(async (result) => {
              const share = result as
                | { path?: string; expiresAt?: string }
                | undefined;
              if (!share?.path) return;
              await Share.share({
                message: `Acompanhe minha carona no Enturma: https://enturma-flax.vercel.app${share.path}`,
              });
            })
          }
        />
        <Button
          title="Registrar no-show"
          disabled={busy}
          onPress={() =>
            Alert.alert(
              "Registrar não comparecimento",
              "Use apenas se a outra pessoa realmente não apareceu. O backend só permite após a tolerância do horário.",
              [
                { text: "Voltar", style: "cancel" },
                {
                  text: "Registrar",
                  style: "destructive",
                  onPress: () =>
                    void action(`/matches/${id}/no-show`).then(() =>
                      setMessage("Não comparecimento registrado."),
                    ),
                },
              ],
            )
          }
        />
      </View>

      <Text style={styles.title}>Conversa</Text>
      {messages.map((row, index) => (
        <RideMessageRow key={row.id} row={row} index={index} />
      ))}

      {!closed ? (
        <>
          <Field
            label="Mensagem"
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={2000}
          />
          <Button
            title="Enviar"
            disabled={busy || !body.trim()}
            onPress={() =>
              void action(`/matches/${id}/messages`, "POST", { body })
            }
          />
          <Button
            title="Encerrar conversa"
            disabled={busy}
            onPress={() => void action(`/matches/${id}/close`)}
          />
        </>
      ) : (
        <Text style={styles.muted}>Conversa encerrada.</Text>
      )}

      {match.rideStatus === "COMPLETED" ? (
        <View style={styles.row}>
          <Text style={styles.label}>Avaliação da carona</Text>
          <Text style={styles.muted}>
            A avaliação detalhada está disponível na experiência integrada do
            Enturma. Aqui você pode registrar a nota geral.
          </Text>
          <Button
            title="Avaliar com 5 estrelas"
            disabled={busy}
            onPress={() =>
              void action(`/matches/${id}/review`, "POST", {
                rating: 5,
                punctuality: 5,
                communication: 5,
                respect: 5,
                responsible: isPassenger ? true : null,
                comment: "",
              }).then(() => setMessage("Avaliação registrada."))
            }
          />
        </View>
      ) : null}

      <Button
        title="Apagar conversa para os dois"
        disabled={busy}
        onPress={() =>
          Alert.alert(
            "Apagar conversa",
            "Esta ação remove o histórico privado para os dois participantes.",
            [
              { text: "Voltar", style: "cancel" },
              {
                text: "Apagar",
                style: "destructive",
                onPress: () =>
                  void action(`/matches/${id}/conversation`, "DELETE").then(
                    () => router.back(),
                  ),
              },
            ],
          )
        }
      />
    </Screen>
  );
}
