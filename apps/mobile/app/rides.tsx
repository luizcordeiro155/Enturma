import { useCallback, useState, type ReactNode } from "react";
import { Animated, Text, View, Alert } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { api } from "../src/api";
import { useRealtime } from "../src/realtime";
import {
  Screen,
  Field,
  Button,
  ErrorMessage,
  useStyles,
} from "../src/ui";
import { useRideActionMotion, useRideEntrance } from "../src/ride-motion";
import type { AcademicEntry } from "@enturma/contracts";

type Ride = {
  id: string;
  ownerId: string;
  name?: string;
  originArea: string;
  campusName: string;
  departureAt: string;
  type: "OFFER" | "REQUEST";
  status: string;
  seats: number;
  acceptedSeats?: number;
  waitlistedSeats?: number;
};
type Match = {
  id: string;
  ownerId: string;
  driverId: string;
  passengerId: string;
  requestedBy: string;
  driverName: string;
  passengerName: string;
  status: string;
  closedAt?: string;
  originArea: string;
  campusName: string;
  tripStatus: string;
};
type Suggestion = {
  id: string;
  ownerName: string;
  originArea: string;
  campusName: string;
  departureAt: string;
  matchLevel: string;
  reasons: string[];
  distanceKm?: number | null;
  estimatedDetourMinutes?: number | null;
  full: boolean;
  availableSeats: number;
  rating: number;
};

function AnimatedRideCard({
  index,
  children,
}: {
  index: number;
  children: ReactNode;
}) {
  const styles = useStyles();
  const motion = useRideEntrance(index);
  return (
    <Animated.View style={[styles.row, motion]}>{children}</Animated.View>
  );
}

export default function Rides() {
  const styles = useStyles();
  const router = useRouter();
  const actionMotion = useRideActionMotion();
  const [rides, setRides] = useState<Ride[]>([]);
  const [mine, setMine] = useState<Ride[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [campuses, setCampuses] = useState<AcademicEntry[]>([]);
  const [campus, setCampus] = useState("");
  const [me, setMe] = useState("");
  const [type, setType] = useState("OFFER");
  const [direction, setDirection] = useState("TO_CAMPUS");
  const [placeQuery, setPlaceQuery] = useState("");
  const [departure, setDeparture] = useState("");
  const [seats, setSeats] = useState("1");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [create, setCreate] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestRide, setSuggestRide] = useState<Ride>();

  const load = useCallback(async () => {
    try {
      const [r, owned, m, c, u] = await Promise.all([
        api<Ride[]>("/rides"),
        api<Ride[]>("/rides/mine"),
        api<Match[]>("/matches"),
        api<AcademicEntry[]>("/academics?kind=CAMPUS"),
        api<{ id: string }>("/users/me"),
      ]);
      setRides(r);
      setMine(owned);
      setMatches(m);
      setCampuses(c);
      setMe(u.id);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useRealtime(
    (event) => {
      if (event.type === "rides_changed" || event.type === "rides_ready")
        void load();
    },
    undefined,
    "rides",
  );

  async function act(path: string, body?: object) {
    setBusy(true);
    try {
      const result = await api<unknown>(path, {
        method: "POST",
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      setError("");
      actionMotion.pulse();
      await load();
      return result;
    } catch (e) {
      setError((e as Error).message);
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  async function findSuggestions(ride: Ride) {
    setSuggestRide(ride);
    setBusy(true);
    try {
      setSuggestions(
        await api<Suggestion[]>(`/rides/${ride.id}/suggestions`, {
          cache: "no-store",
        }),
      );
      actionMotion.pulse();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title="Enturma Caronas">
      <ErrorMessage message={error} />
      {message ? <Text style={styles.success}>{message}</Text> : null}
      <Animated.View style={actionMotion.style}>
        <Button
          title={create ? "Fechar formulário" : "Oferecer ou pedir carona"}
          onPress={() => {
            setCreate(!create);
            actionMotion.pulse();
          }}
        />
      </Animated.View>

      {create ? (
        <View style={styles.row}>
          <Text style={styles.label}>
            Sua localização exata não é publicada. No APK oficial, o matching
            por proximidade e o compartilhamento temporário usam a tela Web
            integrada do Enturma com permissão nativa.
          </Text>
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
          {campuses.map((entry) => (
            <Button
              key={entry.id}
              title={`${campus === entry.id ? "✓ " : ""}${entry.name}`}
              onPress={() => setCampus(entry.id)}
            />
          ))}
          <Field
            label="Endereço ou local"
            value={placeQuery}
            onChangeText={setPlaceQuery}
            maxLength={160}
            placeholder="Ex.: Rua Lunardi 218, hospital, supermercado"
          />
          <Text style={styles.muted}>
            Pesquise endereço com número ou um estabelecimento. O resultado mais
            próximo da sua localização é priorizado quando disponível.
          </Text>
          <Field
            label="Saída (AAAA-MM-DD HH:mm)"
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
            disabled={
              busy || !campus || placeQuery.trim().length < 2
            }
            onPress={() => {
              const date = new Date(departure.replace(" ", "T"));
              if (!Number.isFinite(date.getTime())) {
                setError("Confira a data e hora de saída.");
                return;
              }
              setBusy(true);
              void api<
                {
                  label: string;
                  address?: string;
                  lat: number;
                  lng: number;
                  distanceMeters?: number;
                }[]
              >(
                `/rides/map/search?q=${encodeURIComponent(placeQuery.trim())}`,
                { cache: "no-store" },
              )
                .then(async (locations) => {
                  const location = locations[0];
                  if (!location)
                    throw new Error(
                      "Não encontramos esse endereço ou local. Confira a pesquisa.",
                    );
                  await api("/rides", {
                    method: "POST",
                    body: JSON.stringify({
                      campusId: campus,
                      type,
                      direction,
                      originArea: (location.address || location.label).slice(0, 120),
                      departureAt: date.toISOString(),
                      seats: Number(seats),
                      areaLat: location.lat,
                      areaLng: location.lng,
                    }),
                  });
                  setError("");
                  setCreate(false);
                  setMessage(
                    "Carona publicada com o local encontrado no mapa.",
                  );
                  await load();
                })
                .catch((e) => setError((e as Error).message))
                .finally(() => setBusy(false));
            }}
          />
        </View>
      ) : null}

      <Text style={styles.title}>Meus encontros</Text>
      {matches.map((match, index) => {
        const peer =
          match.driverId === me ? match.passengerName : match.driverName;
        return (
          <AnimatedRideCard key={match.id} index={index}>
            <Text style={styles.label}>{peer}</Text>
            <Text style={styles.muted}>
              {match.originArea} · {match.campusName} ·{" "}
              {match.status === "ACCEPTED"
                ? "Confirmado"
                : match.status === "WAITLISTED"
                  ? "Lista de espera"
                  : match.status === "PENDING"
                    ? "Aguardando confirmação"
                    : match.status}
            </Text>
            {match.status === "PENDING" && match.requestedBy !== me ? (
              <Button
                title="Aceitar combinação"
                disabled={busy}
                onPress={() =>
                  void act(`/matches/${match.id}/accept`).then(() =>
                    setMessage("Match confirmado."),
                  )
                }
              />
            ) : null}
            {match.status === "ACCEPTED" ? (
              <Button
                title="Abrir carona"
                onPress={() =>
                  router.push({
                    pathname: "/ride/[id]",
                    params: { id: match.id },
                  })
                }
              />
            ) : null}
            {["PENDING", "WAITLISTED", "ACCEPTED"].includes(match.status) &&
            !match.closedAt ? (
              <Button
                title="Cancelar encontro"
                disabled={busy}
                onPress={() =>
                  Alert.alert(
                    "Cancelar encontro",
                    "A outra pessoa será avisada e uma vaga pode ser liberada para a lista de espera.",
                    [
                      { text: "Voltar", style: "cancel" },
                      {
                        text: "Cancelar",
                        style: "destructive",
                        onPress: () =>
                          void act(`/matches/${match.id}/cancel`),
                      },
                    ],
                  )
                }
              />
            ) : null}
          </AnimatedRideCard>
        );
      })}

      <Text style={styles.title}>Minhas publicações</Text>
      {mine.map((ride, index) => (
        <AnimatedRideCard key={ride.id} index={index}>
          <Text style={styles.text}>
            {ride.originArea} · {new Date(ride.departureAt).toLocaleString("pt-BR")}
          </Text>
          <Text style={styles.muted}>
            {ride.type === "OFFER" ? "Oferecendo carona" : "Procurando carona"} ·{" "}
            {ride.acceptedSeats ?? 0} confirmado(s)
            {(ride.waitlistedSeats ?? 0) > 0
              ? ` · ${ride.waitlistedSeats} em espera`
              : ""}
          </Text>
          {ride.status === "OPEN" ? (
            <>
              <Button
                title="Encontrar combinações"
                disabled={busy}
                onPress={() => void findSuggestions(ride)}
              />
              <Button
                title="Cancelar publicação"
                disabled={busy}
                onPress={() => void act(`/rides/${ride.id}/cancel`)}
              />
            </>
          ) : null}
        </AnimatedRideCard>
      ))}

      {suggestRide ? (
        <>
          <Text style={styles.title}>Combinações para {suggestRide.originArea}</Text>
          {suggestions.length === 0 ? (
            <Text style={styles.muted}>
              Nenhuma combinação compatível por enquanto.
            </Text>
          ) : (
            suggestions.map((item, index) => (
              <AnimatedRideCard key={item.id} index={index}>
                <Text style={styles.label}>
                  {item.ownerName} · {item.matchLevel === "COMPATIVEL" ? "COMPATÍVEL" : item.matchLevel}
                </Text>
                <Text style={styles.text}>
                  {item.originArea} → {item.campusName}
                </Text>
                <Text style={styles.muted}>
                  {item.reasons.join(" · ")}
                  {item.distanceKm != null ? ` · ${item.distanceKm} km` : ""}
                  {item.estimatedDetourMinutes != null
                    ? ` · ~${item.estimatedDetourMinutes} min`
                    : ""}
                  {item.rating > 0 ? ` · ★ ${item.rating.toFixed(1)}` : ""}
                </Text>
                <Button
                  title={
                    item.full
                      ? "Entrar na lista de espera"
                      : "Solicitar esta carona"
                  }
                  disabled={busy}
                  onPress={() =>
                    void act(
                      `/rides/${suggestRide.id}/suggestions/${item.id}/connect`,
                    ).then((result) => {
                      const match = result as
                        | { id?: string; status?: string }
                        | undefined;
                      if (match?.id)
                        router.push({
                          pathname: "/ride/[id]",
                          params: { id: match.id },
                        });
                    })
                  }
                />
              </AnimatedRideCard>
            ))
          )}
        </>
      ) : null}

      <Text style={styles.title}>Caronas disponíveis</Text>
      {rides
        .filter((ride) => ride.ownerId !== me)
        .map((ride, index) => (
          <AnimatedRideCard key={ride.id} index={index}>
            <Text style={styles.label}>
              {ride.originArea} · {ride.campusName}
            </Text>
            <Text style={styles.text}>
              {ride.name ?? "Estudante"} ·{" "}
              {new Date(ride.departureAt).toLocaleString("pt-BR")}
            </Text>
            <Button
              title="Tenho interesse"
              disabled={busy}
              onPress={() =>
                void act(`/rides/${ride.id}/interest`).then((result) => {
                  const match = result as
                    | { id?: string; status?: string }
                    | undefined;
                  if (match?.status === "WAITLISTED")
                    setMessage("Você entrou na lista de espera.");
                })
              }
            />
          </AnimatedRideCard>
        ))}
    </Screen>
  );
}
