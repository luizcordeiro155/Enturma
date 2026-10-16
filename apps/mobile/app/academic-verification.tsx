import { useEffect, useRef, useState } from "react";
import { AppState, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { api, base, logout, session } from "../src/api";
import { Screen, Field, Button, ErrorMessage, useStyles } from "../src/ui";
import {
  NativeBookMotion,
  type AcademicIdentity,
} from "../src/academic-identity";
type Institution = { id: string; name: string; domains: { domain: string }[] };
type Ticket = { id: string; message: string; response: string | null };
export default function AcademicVerification() {
  const styles = useStyles();
  const router = useRouter();
  const [identity, setIdentity] = useState<AcademicIdentity | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selected, setSelected] = useState<Institution | null>(null);
  const [campuses, setCampuses] = useState<{ id: string; name: string }[]>([]);
  const [campus, setCampus] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [document, setDocument] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [help, setHelp] = useState(false);
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [revision, setRevision] = useState(0);
  const inFlight = useRef(false);
  const choosing = !identity?.institutionId || editing;
  useEffect(() => {
    let active = true;
    let socket: WebSocket | null = null;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    async function refresh() {
      if (!active || AppState.currentState !== "active" || inFlight.current)
        return;
      inFlight.current = true;
      try {
        const value = await api<AcademicIdentity>("/auth/academic/status");
        if (active) {
          setIdentity(value);
          setError("");
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        inFlight.current = false;
      }
    }
    async function connect() {
      await refresh();
      if (socket || !active || AppState.currentState !== "active") return;
      const credentials = await session();
      if (!credentials || !active) return;
      const url =
        base.replace(/^http/, "ws").replace(/\/api\/v1\/?$/, "") + "/ws";
      const ws = new WebSocket(url);
      socket = ws;
      ws.onopen = () => {
        ws.send(
          JSON.stringify({ token: credentials.accessToken, scope: "academic" }),
        );
        heartbeat = setInterval(() => {
          if (ws.readyState === 1) ws.send(JSON.stringify({ type: "ping" }));
        }, 25000);
      };
      ws.onmessage = (e) => {
        try {
          if (
            ["academic_ready", "academic_identity_changed"].includes(
              JSON.parse(e.data).type,
            )
          )
            void refresh();
        } catch {}
      };
      ws.onerror = () => ws.close();
      ws.onclose = () => {
        clearInterval(heartbeat);
        if (socket === ws) socket = null;
      };
    }
    void connect();
    const poll = setInterval(() => void connect(), 12000);
    const visibility = AppState.addEventListener("change", (state) => {
      if (state === "active") void connect();
      else {
        socket?.close();
        clearInterval(heartbeat);
      }
    });
    return () => {
      active = false;
      clearInterval(poll);
      clearInterval(heartbeat);
      socket?.close();
      visibility.remove();
    };
  }, [revision]);
  useEffect(() => {
    if (!identity?.accessAllowed) return;
    const timer = setTimeout(() => router.replace("/onboarding"), 1200);
    return () => clearTimeout(timer);
  }, [identity?.accessAllowed, router]);
  useEffect(() => {
    if (!choosing) return;
    let active = true;
    const timer = setTimeout(() => {
      api<{ items: Institution[]; hasMore: boolean }>(
        `/auth/academic/institutions?search=${encodeURIComponent(search)}&page=${page}`,
      )
        .then((r) => {
          if (active) {
            setInstitutions(r.items);
            setMore(r.hasMore);
          }
        })
        .catch((e: Error) => {
          if (active) setError(e.message);
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [choosing, search, page]);
  useEffect(() => {
    if (!selected) return;
    let active = true;
    api<{ items: { id: string; name: string }[] }>(
      `/catalog/campuses?parentId=${selected.id}`,
    )
      .then((r) => {
        if (active) setCampuses(r.items);
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [selected]);
  useEffect(() => {
    if (!help) return;
    let active = true;
    const load = () =>
      api<Ticket[]>("/auth/academic/support")
        .then((r) => {
          if (active) setTickets(r);
        })
        .catch((e: Error) => {
          if (active) setError(e.message);
        });
    void load();
    const timer = setInterval(() => {
      if (AppState.currentState === "active") void load();
    }, 15000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [help, revision]);
  async function act(operation: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await operation();
      setIdentity(await api<AcademicIdentity>("/auth/academic/status"));
      setRevision((v) => v + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload() {
    await act(async () => {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      const file = new File(asset.uri);
      try {
        if (file.size > 2 * 1024 * 1024)
          throw Error("O comprovante deve ter até 2 MB.");
        await api("/auth/academic/document", {
          method: "POST",
          body: JSON.stringify({
            mime: asset.mimeType,
            content: await file.base64(),
          }),
        });
      } finally {
        try {
          file.delete();
        } catch {
          /* The server result remains authoritative if local cache cleanup fails. */
        }
      }
    });
  }
  return (
    <Screen title="Sua identidade acadêmica">
      <NativeBookMotion approved={identity?.accessAllowed} />
      <ErrorMessage message={error} />
      {identity?.accessAllowed ? (
        <View style={styles.card}>
          <Text style={styles.title}>Acesso liberado!</Text>
          <Text style={styles.text}>{identity.institutionName}</Text>
          <Button
            title="Continuar"
            onPress={() => router.replace("/onboarding")}
          />
        </View>
      ) : help ? (
        <>
          <Text style={styles.text}>
            Descreva sua dúvida. A equipe responde aqui. Não envie senhas ou
            documentos neste campo.
          </Text>
          <Field
            label="Como podemos ajudar?"
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={2000}
          />
          <Button
            title="Enviar para a equipe"
            disabled={busy || message.trim().length < 10}
            onPress={() =>
              void act(async () => {
                await api("/auth/academic/support", {
                  method: "POST",
                  body: JSON.stringify({ message }),
                });
                setMessage("");
              })
            }
          />
          {tickets.map((t) => (
            <View key={t.id} style={styles.card}>
              <Text style={styles.text}>{t.message}</Text>
              <Text style={styles.muted}>
                {t.response || "Aguardando resposta"}
              </Text>
            </View>
          ))}
          <Button title="Voltar à verificação" onPress={() => setHelp(false)} />
        </>
      ) : choosing ? (
        <>
          <Text style={styles.text}>
            Escolha sua instituição no catálogo do Enturma.
          </Text>
          <Field
            label="Buscar faculdade"
            value={search}
            onChangeText={(value) => {
              setSearch(value);
              setPage(0);
            }}
          />
          {institutions.map((i) => (
            <Button
              key={i.id}
              title={`${selected?.id === i.id ? "✓ " : ""}${i.name} · ${i.domains.length ? "E-mail acadêmico" : "Comprovante"}`}
              onPress={() => {
                setSelected(i);
                setCampuses([]);
                setCampus(null);
              }}
            />
          ))}
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Button
              title="Anterior"
              disabled={!page}
              onPress={() => setPage((p) => p - 1)}
            />
            <Button
              title="Próxima"
              disabled={!more}
              onPress={() => setPage((p) => p + 1)}
            />
          </View>
          {selected && (
            <>
              <Text style={styles.text}>Campus (opcional)</Text>
              <Button
                title={!campus ? "✓ Selecionar depois" : "Selecionar depois"}
                onPress={() => setCampus(null)}
              />
              {campuses.map((c) => (
                <Button
                  key={c.id}
                  title={`${campus === c.id ? "✓ " : ""}${c.name}`}
                  onPress={() => setCampus(c.id)}
                />
              ))}
            </>
          )}
          <Button
            title="Continuar"
            disabled={busy || !selected}
            onPress={() =>
              void act(async () => {
                await api("/auth/academic/institution", {
                  method: "PUT",
                  body: JSON.stringify({
                    institutionId: selected?.id,
                    campusId: campus,
                  }),
                });
                setEditing(false);
                setDocument(!selected?.domains.length);
              })
            }
          />
          {editing && (
            <Button
              title="Cancelar alteração"
              onPress={() => setEditing(false)}
            />
          )}
        </>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.text}>{identity?.institutionName}</Text>
            <Text style={styles.muted}>{identity?.campusName}</Text>
            <Button
              title="Alterar instituição"
              onPress={() => setEditing(true)}
            />
          </View>
          {identity?.status === "PENDING_REVIEW" ? (
            <>
              <Text style={styles.title}>Comprovante em análise.</Text>
              <Text style={styles.text}>
                A decisão aparece aqui automaticamente. Seu arquivo é privado e
                será apagado após a análise ou em até 14 dias.
              </Text>
            </>
          ) : (
            <>
              {identity?.reviewReason && (
                <Text style={styles.text}>{identity.reviewReason}</Text>
              )}
              {identity?.status === "EMAIL_PENDING" && (
                <View style={styles.card}>
                  <Text style={styles.title}>
                    {identity.delivery === "SENT"
                      ? "Confira seu e-mail"
                      : identity.delivery === "FAILED"
                        ? "Falha no envio"
                        : "Preparando o envio"}
                  </Text>
                  <Text style={styles.text}>{identity.academicEmail}</Text>
                  <Text style={styles.muted}>
                    Abra o link no seu e-mail. Ao voltar ao aplicativo, a
                    confirmação será reconhecida automaticamente.
                  </Text>
                  {identity.tokenExpiresAt && (
                    <Text style={styles.muted}>
                      Link válido até{" "}
                      {new Date(identity.tokenExpiresAt).toLocaleTimeString(
                        "pt-BR",
                      )}
                    </Text>
                  )}
                </View>
              )}
              {document ? (
                <>
                  <Text style={styles.text}>
                    Envie um comprovante de vínculo com a instituição em PDF,
                    PNG ou JPEG (até 2 MB). O acesso depende da análise
                    administrativa.
                  </Text>
                  <Button
                    title={
                      busy ? "Enviando…" : "Selecionar e enviar comprovante"
                    }
                    disabled={busy}
                    onPress={() => void upload()}
                  />
                  <Button
                    title="Usar e-mail institucional"
                    onPress={() => setDocument(false)}
                  />
                </>
              ) : (
                <>
                  <Field
                    label="E-mail institucional"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <Text style={styles.muted}>
                    Seu e-mail pessoal continua sendo usado para entrar e
                    recuperar a conta.
                  </Text>
                  <Button
                    title={busy ? "Solicitando…" : "Enviar confirmação"}
                    disabled={busy || !email}
                    onPress={() =>
                      void act(() =>
                        api("/auth/academic/email", {
                          method: "POST",
                          body: JSON.stringify({ email }),
                        }),
                      )
                    }
                  />
                  <Button
                    title="Não tenho e-mail acadêmico: verificar matrícula"
                    onPress={() => setDocument(true)}
                  />
                </>
              )}
            </>
          )}
        </>
      )}
      <Button
        title="Consultar andamento"
        onPress={() => setRevision((v) => v + 1)}
        disabled={busy}
      />
      <Button title="Preciso de ajuda" onPress={() => setHelp(true)} />
      <Button
        title="Sair da conta"
        disabled={busy}
        onPress={() => {
          setBusy(true);
          void logout()
            .then(() => router.replace("/"))
            .catch((e: Error) => setError(e.message))
            .finally(() => setBusy(false));
        }}
      />
    </Screen>
  );
}
