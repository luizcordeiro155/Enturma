"use client";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, BadgeCheck } from "lucide-react";
import { api } from "@/lib/api";
import { socialWrite, type SocialPreferences } from "@/lib/social";
import { SocialDialog } from "./social-dialog";

type Review = {
  id: string;
  userId?: string;
  name?: string;
  username?: string;
  followers?: number;
  body?: string;
  reason: string;
  decision?: string;
  status: string;
  createdAt: string;
};
export function SocialSettings({
  value,
  save,
  close,
  admin,
}: {
  value: SocialPreferences;
  save: (p: SocialPreferences) => void;
  close: () => void;
  admin: boolean;
}) {
  const [draft, setDraft] = useState(value),
    [tags, setTags] = useState(value.interests.join(", ")),
    [reason, setReason] = useState(""),
    [history, setHistory] = useState<{
      eligibleForReview: boolean;
      items: Review[];
    }>(),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [review, setReview] = useState(false);
  useEffect(() => {
    let alive = true;
    api<typeof history>("/social/verification", { cache: "no-store" })
      .then((r) => {
        if (alive) setHistory(r);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, []);
  async function submit() {
    setBusy(true);
    try {
      const prefs = await socialWrite<SocialPreferences>("/preferences", {
        ...draft,
        interests: tags
          .split(/[,\s]+/)
          .map((t) => t.replace(/^#/, ""))
          .filter(Boolean),
        automatic: draft.navigation.automatic,
        order: draft.navigation.order,
      });
      save(prefs);
      setNotice("Preferências salvas.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function move(index: number, delta: number) {
    const order = [...draft.navigation.order];
    [order[index], order[index + delta]] = [order[index + delta], order[index]];
    setDraft((d) => ({ ...d, navigation: { ...d.navigation, order } }));
  }
  return (
    <SocialDialog title="Seu Social, do seu jeito" close={close}>
      <div className="social-dialog-body social-settings">
        <h3>Privacidade e reprodução</h3>
        {[
          [
            "privateAccount",
            "Conta privada",
            "Novos seguidores precisam da sua aprovação.",
          ],
          [
            "recommendations",
            "Personalizar com minhas interações",
            "Usar atividades do Social por até 30 dias e afinidade com faculdade, curso e matérias. Ao desativar, o histórico de visualização usado nas recomendações é excluído.",
          ],
          [
            "autoplay",
            "Reproduzir Clips automaticamente",
            "Vídeos começam sem som; você pode ativá-lo no player.",
          ],
        ].map(([field, label, detail]) => (
          <label className="social-check" key={field}>
            <input
              type="checkbox"
              checked={Boolean(draft[field as keyof SocialPreferences])}
              onChange={(e) =>
                setDraft((d) => ({ ...d, [field]: e.target.checked }))
              }
            />
            <span>
              <strong>{label}</strong>
              <small>{detail}</small>
            </span>
          </label>
        ))}
        <label>
          Seus assuntos
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="programação, design, biologia"
            maxLength={800}
          />
          <small>
            Até 20 assuntos, separados por vírgulas. Nenhuma conversa privada
            entra nas recomendações.
          </small>
        </label>
        <h3>Navegação do Social</h3>
        <label className="social-check">
          <input
            type="checkbox"
            checked={draft.navigation.automatic}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                navigation: { ...d.navigation, automatic: e.target.checked },
              }))
            }
          />
          <span>
            Destacar meu acesso mais usado
            <small>A posição só muda quando você a reorganiza abaixo.</small>
          </span>
        </label>
        {draft.navigation.order.map((v, i) => (
          <div className="social-person-row" key={v}>
            <strong>
              {v === "feed" ? "Feed" : v === "clips" ? "Clips" : "Criar"}
            </strong>
            <button
              className="icon-control"
              aria-label={`Mover ${v} para cima`}
              disabled={!i}
              onClick={() => move(i, -1)}
            >
              <ArrowUp size={17} />
            </button>
            <button
              className="icon-control"
              aria-label={`Mover ${v} para baixo`}
              disabled={i === 2}
              onClick={() => move(i, 1)}
            >
              <ArrowDown size={17} />
            </button>
          </div>
        ))}
        <button disabled={busy} onClick={() => void submit()}>
          Salvar preferências
        </button>
        <hr />
        <h3>
          <BadgeCheck size={20} /> Verificação social
        </h3>
        <p>
          O selo social é analisado separadamente da verificação acadêmica. Ter
          100 mil seguidores torna a conta elegível à análise; não concede o
          selo automaticamente.
        </p>
        {history?.eligibleForReview && (
          <p>
            Sua conta atingiu a faixa de elegibilidade. A análise de
            autenticidade continua obrigatória.
          </p>
        )}
        {history?.items.map((r) => (
          <article className="social-review-history" key={r.id}>
            <strong>
              {{
                PENDING: "Em análise",
                APPROVED: "Aprovada",
                REJECTED: "Recusada",
                REVOKED: "Revogada",
              }[r.status] ?? r.status}
            </strong>
            <small>{new Date(r.createdAt).toLocaleDateString("pt-BR")}</small>
            <p>{r.decision || "A equipe avaliará sua solicitação."}</p>
          </article>
        ))}
        <label>
          Solicitação ou recurso
          <textarea
            className="resize-none"
            maxLength={1500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explique quem você representa e inclua referências públicas para análise."
          />
        </label>
        <button
          className="secondary"
          disabled={
            busy ||
            !reason.trim() ||
            history?.items.some((r) => r.status === "PENDING")
          }
          onClick={() => {
            setBusy(true);
            void socialWrite("/verification", { reason }, "POST")
              .then(() =>
                api<NonNullable<typeof history>>("/social/verification", {
                  cache: "no-store",
                }),
              )
              .then((r) => {
                setHistory(r);
                setReason("");
              })
              .catch((e) => setError(e.message))
              .finally(() => setBusy(false));
          }}
        >
          Enviar para análise
        </button>
        <small>
          Um pedido ou recurso a cada sete dias. Não envie documentos pessoais
          neste campo.
        </small>
        {admin && (
          <button className="secondary" onClick={() => setReview(true)}>
            Análise administrativa do Social
          </button>
        )}
        {error && <p role="alert">{error}</p>}
        {notice && <p role="status">{notice}</p>}
      </div>
      {review && <SocialReview close={() => setReview(false)} />}
    </SocialDialog>
  );
}
export function SocialReview({ close }: { close: () => void }) {
  const [kind, setKind] = useState("verification"),
    [page, setPage] = useState(0),
    [rows, setRows] = useState<Review[]>([]),
    [reasons, setReasons] = useState<Record<string, string>>({}),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    api<Review[]>(`/admin/social/review?kind=${kind}&page=${page}`, {
      cache: "no-store",
    })
      .then((r) => {
        if (alive) setRows(r);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [kind, page]);
  async function decide(id: string, status: string) {
    setBusy(true);
    try {
      await api(`/admin/social/${kind}/${id}`, {
        method: "POST",
        body: JSON.stringify({ status, reason: reasons[id] }),
      });
      setRows((r) =>
        r.map((v) =>
          v.id === id ? { ...v, status, decision: reasons[id] } : v,
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <SocialDialog title="Análise administrativa" close={close} wide>
      <div className="social-dialog-body">
        <div className="social-tabs">
          {["verification", "reports"].map((k) => (
            <button
              key={k}
              aria-pressed={kind === k}
              onClick={() => {
                setKind(k);
                setPage(0);
              }}
            >
              {k === "verification" ? "Verificações" : "Denúncias"}
            </button>
          ))}
        </div>
        {rows.map((r) => (
          <article className="social-review-history" key={r.id}>
            <h3>
              {r.name ? `${r.name} · @${r.username}` : "Publicação denunciada"}
            </h3>
            <small>
              {r.status} · {new Date(r.createdAt).toLocaleString("pt-BR")}
              {r.followers !== undefined && ` · ${r.followers} seguidores`}
            </small>
            {r.body && <blockquote>{r.body}</blockquote>}
            <p>{r.reason}</p>
            {r.decision && <p>Decisão: {r.decision}</p>}
            {["PENDING", "OPEN", "APPROVED"].includes(r.status) && (
              <>
                <label>
                  Justificativa
                  <textarea
                    className="resize-none"
                    value={reasons[r.id] ?? ""}
                    maxLength={1500}
                    onChange={(e) =>
                      setReasons((v) => ({ ...v, [r.id]: e.target.value }))
                    }
                  />
                </label>
                <div className="social-row">
                  {(kind === "reports"
                    ? ["DISMISSED", "REMOVED"]
                    : r.status === "APPROVED"
                      ? ["REVOKED"]
                      : ["APPROVED", "REJECTED"]
                  ).map((s) => (
                    <button
                      className="secondary"
                      key={s}
                      disabled={busy || !reasons[r.id]?.trim()}
                      onClick={() => void decide(r.id, s)}
                    >
                      {
                        {
                          DISMISSED: "Arquivar",
                          REMOVED: "Remover conteúdo",
                          REVOKED: "Revogar selo",
                          APPROVED: "Aprovar",
                          REJECTED: "Recusar",
                        }[s]
                      }
                    </button>
                  ))}
                </div>
              </>
            )}
          </article>
        ))}
        <div className="social-row">
          <button
            className="secondary"
            disabled={!page}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </button>
          <span>Página {page + 1}</span>
          <button
            className="secondary"
            disabled={rows.length < 30}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </button>
        </div>
        {error && <p role="alert">{error}</p>}
      </div>
    </SocialDialog>
  );
}
