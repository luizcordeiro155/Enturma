"use client";
import { useEffect, useRef, useState } from "react";
import { api, post } from "@/lib/api";
type Case = {
  id: string;
  name: string;
  rule: string;
  kind: string;
  status: string;
  createdAt: string;
  appeal?: string;
  reviewNote?: string;
  userId: string;
  roomId?: string;
};
export function ModerationAdmin() {
  const [busy, setBusy] = useState(false);
  const pendingAction = useRef<
    { payload: string; requestId: string } | undefined
  >(undefined);
  const [cases, setCases] = useState<Case[]>([]),
    [selected, setSelected] = useState<Case>(),
    [evidence, setEvidence] = useState<{ content: string }[]>([]),
    [note, setNote] = useState(""),
    [status, setStatus] = useState("");
  const load = () =>
    api<Case[]>("/admin/moderation")
      .then(setCases)
      .catch((e) => setStatus(e.message));
  useEffect(() => {
    void load();
  }, []);
  async function review(revoke: boolean) {
    if (!selected) return;
    try {
      await post(`/admin/moderation/${selected.id}/review`, { revoke, note });
      setSelected(undefined);
      setNote("");
      setStatus("Revisão registrada na auditoria.");
      await load();
    } catch (e) {
      setStatus((e as Error).message);
    }
  }
  return (
    <section>
      <h2>Monitor Enturma · revisão humana</h2>
      <p>
        Casos de salas e ações administrativas. Conversas privadas cifradas não
        são inspecionadas.
      </p>
      <p role="status">{status}</p>
      <details className="showcase-fields">
        <summary>Registrar medida administrativa</summary>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            const form = e.currentTarget,
              data = new FormData(form);
            try {
              const payload = {
                userId: data.get("userId"),
                roomId: data.get("roomId") || null,
                kind: data.get("kind"),
                minutes: Number(data.get("minutes")),
                rule: data.get("rule"),
                evidence: data.get("evidence"),
              };
              const serialized = JSON.stringify(payload);
              if (pendingAction.current?.payload !== serialized)
                pendingAction.current = {
                  payload: serialized,
                  requestId: crypto.randomUUID(),
                };
              await post("/admin/moderation/actions", {
                ...payload,
                requestId: pendingAction.current.requestId,
              });
              pendingAction.current = undefined;
              form.reset();
              setStatus("Medida registrada com evidência e responsável.");
              await load();
            } catch (error) {
              setStatus((error as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            ID do usuário
            <input name="userId" required defaultValue={selected?.userId} />
          </label>
          <label>
            ID da sala (apenas medidas de sala)
            <input name="roomId" defaultValue={selected?.roomId} />
          </label>
          <label>
            Medida
            <select name="kind">
              <option value="WARNING">Advertência</option>
              <option value="MUTE">Silenciamento temporário na sala</option>
              <option value="RESTRICTION">Restrição temporária</option>
              <option value="KICK">Remoção da sala</option>
              <option value="SUSPENSION">Suspensão temporária da conta</option>
              <option value="BAN">Banimento da conta</option>
            </select>
          </label>
          <label>
            Duração em minutos (0 para advertência, remoção ou banimento)
            <input
              name="minutes"
              type="number"
              min={0}
              max={43200}
              defaultValue={15}
              required
            />
          </label>
          <label>
            Regra infringida
            <input name="rule" required maxLength={60} />
          </label>
          <label>
            Evidência e justificativa
            <textarea
              name="evidence"
              required
              minLength={10}
              maxLength={4000}
            />
          </label>
          <label className="check-row">
            <input type="checkbox" required />
            Revisei o contexto e confirmo esta medida.
          </label>
          <button disabled={busy}>
            {busy ? "Registrando…" : "Registrar medida"}
          </button>
        </form>
      </details>
      <details className="showcase-fields">
        <summary>Bloquear domínio malicioso confirmado</summary>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget,
              data = new FormData(form);
            try {
              await post("/admin/moderation/blocked-hosts", {
                host: String(data.get("host")).trim().toLowerCase(),
                reason: data.get("reason"),
              });
              form.reset();
              setStatus("Domínio registrado na proteção das salas.");
            } catch (error) {
              setStatus((error as Error).message);
            }
          }}
        >
          <label>
            Domínio sem protocolo
            <input name="host" required placeholder="dominio.example" />
          </label>
          <label>
            Motivo verificado
            <input name="reason" required maxLength={300} />
          </label>
          <button>Bloquear domínio</button>
        </form>
      </details>
      {cases.map((c) => (
        <article className="room-row" key={c.id}>
          <div>
            <strong>
              {c.name} · {c.rule}
            </strong>
            <p>
              {c.kind} · {c.status} ·{" "}
              {new Date(c.createdAt).toLocaleString("pt-BR")}
            </p>
          </div>
          <button
            className="secondary"
            onClick={() =>
              void api<{ content: string }[]>(
                `/admin/moderation/${c.id}/evidence`,
              )
                .then((e) => {
                  setSelected(c);
                  setEvidence(e);
                  setNote("");
                })
                .catch((e) => setStatus(e.message))
            }
          >
            Revisar caso
          </button>
        </article>
      ))}
      {selected && (
        <div className="showcase-fields">
          <h3>Revisão de {selected.name}</h3>
          {evidence.map((e, i) => (
            <blockquote key={i}>{e.content}</blockquote>
          ))}
          {selected.appeal && <p>Pedido do usuário: {selected.appeal}</p>}
          <label>
            Justificativa da decisão
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={2000}
            />
          </label>
          <div className="actions">
            <button disabled={!note.trim()} onClick={() => void review(true)}>
              Revogar medida
            </button>
            <button
              className="secondary"
              disabled={!note.trim()}
              onClick={() => void review(false)}
            >
              Manter medida
            </button>
            <button
              className="text-button"
              onClick={() => setSelected(undefined)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
