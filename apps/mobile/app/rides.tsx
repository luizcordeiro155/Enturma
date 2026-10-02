import { useCallback, useState } from "react";
import { Text, View, Alert } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { api } from "../src/api";
import { useRealtime } from "../src/realtime";
import { Screen, Field, Button, ErrorMessage, useStyles } from "../src/ui";
import type { AcademicEntry } from "@enturma/contracts";
type Ride = {
  id: string;
  ownerId: string;
  name: string;
  originArea: string;
  campusName: string;
  departureAt: string;
  type: string;
  status: string;
};
type Match = {
  id: string;
  ownerId: string;
  ownerName: string;
  passengerName: string;
  status: string;
  closedAt?: string;
  originArea: string;
};
export default function Rides() {
  const styles = useStyles(),
    router = useRouter();
  const [rides, setRides] = useState<Ride[]>([]),
    [mine, setMine] = useState<Ride[]>([]),
    [matches, setMatches] = useState<Match[]>([]),
    [campuses, setCampuses] = useState<AcademicEntry[]>([]),
    [campus, setCampus] = useState(""),
    [me, setMe] = useState(""),
    [type, setType] = useState("OFFER"),
    [direction, setDirection] = useState("TO_CAMPUS"),
    [area, setArea] = useState(""),
    [departure, setDeparture] = useState(""),
    [seats, setSeats] = useState("1"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [create, setCreate] = useState(false);
  const load = useCallback(async () => {
    try {
      const [r, m, c, u] = await Promise.all([
        api<Ride[]>("/rides"),
        api<Ride[]>("/rides/mine"),
        api<Match[]>("/matches"),
        api<{ id: string }>("/users/me"),
      ]);
      setRides(r);
      setMine(m);
      setMatches(c);
      setMe(u.id);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
      void api<AcademicEntry[]>("/academics?kind=CAMPUS")
        .then(setCampuses)
        .catch((e) => setError(e.message));
    }, [load]),
  );
  useRealtime(
    (e) => {
      if (e.type === "rides_changed" || e.type === "rides_ready") void load();
    },
    undefined,
    "rides",
  );
  async function act(path: string, body?: object) {
    setBusy(true);
    try {
      await api(path, {
        method: "POST",
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      setError("");
      await load();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen title="Caminhe em companhia">
      <ErrorMessage message={error} />
      <Button
        title={create ? "Fechar formulário" : "Oferecer ou pedir carona"}
        onPress={() => setCreate(!create)}
      />
      {create && (
        <View style={styles.row}>
          <Button
            title={
              type === "OFFER" ? "Oferecendo vagas" : "Procurando motorista"
            }
            onPress={() => setType(type === "OFFER" ? "REQUEST" : "OFFER")}
          />
          <Button
            title={
              direction === "TO_CAMPUS" ? "Indo ao campus" : "Saindo do campus"
            }
            onPress={() =>
              setDirection(
                direction === "TO_CAMPUS" ? "FROM_CAMPUS" : "TO_CAMPUS",
              )
            }
          />
          <Text style={styles.label}>Selecione o campus</Text>
          {campuses.map((c) => (
            <Button
              key={c.id}
              title={`${campus === c.id ? "✓ " : ""}${c.name}`}
              onPress={() => setCampus(c.id)}
            />
          ))}
          <Field
            label="Bairro de origem"
            value={area}
            onChangeText={setArea}
            maxLength={120}
          />
          <Field
            label="Saída (AAAA-MM-DD HH:mm, horário local)"
            value={departure}
            onChangeText={setDeparture}
          />
          <Field
            label="Vagas (1 a 8)"
            value={seats}
            onChangeText={setSeats}
            keyboardType="number-pad"
          />
          <Button
            title="Publicar carona"
            disabled={busy || !campus || !area.trim()}
            onPress={() => {
              const date = new Date(departure.replace(" ", "T"));
              if (!Number.isFinite(date.getTime())) {
                setError("Confira a data e hora de saída.");
                return;
              }
              void act("/rides", {
                campusId: campus,
                type,
                direction,
                originArea: area,
                departureAt: date.toISOString(),
                seats: Number(seats),
              }).then((ok) => {
                if (ok) setCreate(false);
              });
            }}
          />
        </View>
      )}
      <Text style={styles.title}>Meus encontros</Text>
      {matches.map((m) => (
        <View style={styles.row} key={m.id}>
          <Text style={styles.label}>
            {m.ownerId === me ? m.passengerName : m.ownerName}
          </Text>
          <Text style={styles.muted}>
            {m.originArea} ·{" "}
            {m.status === "ACCEPTED"
              ? "Match confirmado"
              : m.status === "PENDING"
                ? "Aguardando aceite"
                : "Encerrado"}
          </Text>
          {m.status === "PENDING" && m.ownerId === me && (
            <Button
              title="Aceitar passageiro"
              disabled={busy}
              onPress={() => void act(`/matches/${m.id}/accept`)}
            />
          )}{" "}
          {m.status === "ACCEPTED" && (
            <Button
              title="Abrir conversa"
              onPress={() =>
                router.push({ pathname: "/ride/[id]", params: { id: m.id } })
              }
            />
          )}{" "}
          {!m.closedAt && (
            <Button
              title="Cancelar encontro"
              disabled={busy}
              onPress={() =>
                Alert.alert(
                  "Cancelar encontro",
                  "Os dois participantes serão informados.",
                  [
                    { text: "Voltar", style: "cancel" },
                    {
                      text: "Cancelar encontro",
                      style: "destructive",
                      onPress: () => void act(`/matches/${m.id}/cancel`),
                    },
                  ],
                )
              }
            />
          )}
        </View>
      ))}
      <Text style={styles.title}>Minhas publicações</Text>
      {mine
        .filter((r) => r.status === "OPEN")
        .map((r) => (
          <View key={r.id} style={styles.row}>
            <Text style={styles.text}>
              {r.originArea} · {new Date(r.departureAt).toLocaleString("pt-BR")}
            </Text>
            <Text style={styles.muted}>
              {r.type === "OFFER"
                ? "Procurando passageiros"
                : "Procurando carona"}
            </Text>
            <Button
              title="Cancelar publicação"
              disabled={busy}
              onPress={() => void act(`/rides/${r.id}/cancel`)}
            />
          </View>
        ))}
      <Text style={styles.title}>Caronas disponíveis</Text>
      {rides
        .filter((r) => r.ownerId !== me)
        .map((r) => (
          <View key={r.id} style={styles.row}>
            <Text style={styles.label}>
              {r.originArea} · {r.campusName}
            </Text>
            <Text style={styles.text}>
              {r.name} · {new Date(r.departureAt).toLocaleString("pt-BR")}
            </Text>
            <Button
              title="Tenho interesse"
              disabled={busy}
              onPress={() => void act(`/rides/${r.id}/interest`)}
            />
          </View>
        ))}
    </Screen>
  );
}
