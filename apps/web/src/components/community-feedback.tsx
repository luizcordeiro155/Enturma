"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Award, ShieldAlert, X } from "lucide-react";
import { api, post } from "@/lib/api";
import type { Achievement } from "./profile-showcase";

type Penalty = {
  id: string;
  roomId?: string;
  rule: string;
  kind: string;
  endsAt?: string;
  remainingSeconds?: number;
  revokedAt?: string;
  status: string;
  appeal?: string;
  reviewNote?: string;
  createdAt: string;
};

type AppealDecision = {
  status: string;
  revoked: boolean;
  analysis: string;
  confidence?: number;
};

const rules: Record<string, string> = {
  FLOOD: "Muitas mensagens em pouco tempo",
  REPETITION: "Envio repetido da mesma mensagem",
  MENTION_SPAM: "Excesso de menções",
  PHISHING: "Pedido de credenciais ou promessa suspeita",
  THREAT_OR_HARASSMENT: "Ameaça ou assédio",
  MALICIOUS_LINK: "Link identificado como malicioso",
};

const actions: Record<string, string> = {
  WARNING: "Advertência",
  MUTE: "Silenciamento temporário",
  RESTRICTION: "Restrição temporária",
  KICK: "Remoção temporária da sala",
  SUSPENSION: "Conta suspensa temporariamente",
  BAN: "Banimento temporário",
};

function secondsLeft(penalty: Penalty, now: number) {
  if (!penalty.endsAt) return Math.max(0, penalty.remainingSeconds ?? 0);
  return Math.max(
    0,
    Math.ceil((new Date(penalty.endsAt).getTime() - now) / 1000),
  );
}

function formatRemaining(seconds: number) {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const secs = safe % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return `${hours}h ${String(rest).padStart(2, "0")}min`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export function CommunityFeedback() {
  const [achievement, setAchievement] = useState<Achievement>();
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [status, setStatus] = useState("");
  const [now, setNow] = useState(Date.now());
  const card = useRef<HTMLElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let live = true;
    const load = () =>
      api<Penalty[]>("/moderation/mine")
        .then((rows) => {
          if (!live) return;
          setPenalties(
            rows.filter(
              (p) =>
                !p.revokedAt &&
                p.status !== "REVOKED" &&
                p.status !== "EXPIRED" &&
                secondsLeft(p, Date.now()) > 0,
            ),
          );
        })
        .catch(() => {});
    const unlocked = () =>
      api<Achievement[]>("/achievements")
        .then((rows) => {
          const latest = rows.find(
            (a) =>
              a.earnedAt && new Date(a.earnedAt).getTime() > Date.now() - 30000,
          );
          if (live && latest) setAchievement(latest);
        })
        .catch(() => {});

    void load();
    window.addEventListener("enturma-moderation_action", load);
    window.addEventListener("enturma-achievement_unlocked", unlocked);
    return () => {
      live = false;
      window.removeEventListener("enturma-moderation_action", load);
      window.removeEventListener("enturma-achievement_unlocked", unlocked);
    };
  }, []);

  useEffect(() => {
    setPenalties((current) =>
      current.filter((penalty) => secondsLeft(penalty, now) > 0),
    );
  }, [now]);

  useEffect(() => {
    if (!achievement || !card.current) return;
    const reduced =
      document.documentElement.dataset.reducedMotion === "true" ||
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animation = reduced
      ? undefined
      : card.current.animate(
          [
            { opacity: 0, transform: "translateY(24px) scale(.94)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 400, easing: "cubic-bezier(.2,.8,.2,1)" },
        );
    const timer = setTimeout(() => setAchievement(undefined), 9000);
    return () => {
      animation?.cancel();
      clearTimeout(timer);
    };
  }, [achievement]);

  const visiblePenalty = useMemo(
    () => penalties.find((penalty) => secondsLeft(penalty, now) > 0),
    [now, penalties],
  );

  return (
    <>
      {achievement && (
        <section ref={card} className="achievement-toast" role="status">
          <Award />
          <div>
            <strong>{achievement.name}</strong>
            <p>Conquista desbloqueada · +{achievement.xp} XP</p>
            <Link href="/profile">Ver minhas conquistas</Link>
          </div>
          <button
            type="button"
            className="icon-control"
            aria-label="Fechar conquista"
            onClick={() => setAchievement(undefined)}
          >
            <X size={18} />
          </button>
        </section>
      )}

      {visiblePenalty ? (
        <section className="penalty-notice active-penalty" role="status">
          <div className="penalty-notice-heading">
            <ShieldAlert size={19} />
            <div>
              <strong>
                {actions[visiblePenalty.kind] ?? visiblePenalty.kind} ·{" "}
                {rules[visiblePenalty.rule] ?? visiblePenalty.rule}
              </strong>
              <span>
                Tempo restante:{" "}
                <b>{formatRemaining(secondsLeft(visiblePenalty, now))}</b>
              </span>
            </div>
          </div>

          <p>
            A medida é temporária e desaparece automaticamente quando o contador
            chegar a zero. O aviso acompanha você entre as salas enquanto estiver
            ativo.
          </p>

          {visiblePenalty.appeal ? (
            <p>
              Recurso analisado:{" "}
              {visiblePenalty.status === "APPEALED"
                ? "aguardando análise da Enturma AI"
                : visiblePenalty.status === "CONFIRMED"
                  ? "penalidade mantida"
                  : visiblePenalty.status}.
              {visiblePenalty.reviewNote
                ? ` ${visiblePenalty.reviewNote}`
                : ""}
            </p>
          ) : null}

          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const reason = String(
                new FormData(event.currentTarget).get("reason") ?? "",
              ).trim();
              try {
                const result = await post<AppealDecision>(
                  `/moderation/${visiblePenalty.id}/appeal`,
                  { reason },
                );
                setStatus(
                  result.revoked
                    ? "Recurso aceito pela Enturma AI. Penalidade removida."
                    : result.analysis,
                );
                if (result.revoked) {
                  setPenalties((old) =>
                    old.filter((item) => item.id !== visiblePenalty.id),
                  );
                } else {
                  setPenalties((old) =>
                    old.map((item) =>
                      item.id === visiblePenalty.id
                        ? {
                            ...item,
                            appeal: reason,
                            status: result.status,
                            reviewNote: result.analysis,
                          }
                        : item,
                    ),
                  );
                }
              } catch (error) {
                setStatus((error as Error).message);
              }
            }}
          >
            <label>
              Recorrer da penalidade
              <textarea
                name="reason"
                required
                minLength={20}
                maxLength={2000}
                placeholder="Explique claramente o contexto e por que a penalidade deve ser removida."
              />
            </label>
            <button>Enviar para análise da Enturma AI</button>
          </form>

          <p role="status">{status}</p>

        </section>
      ) : null}
    </>
  );
}

const categoryNames: Record<string, string> = {
  ROOM_MESSAGE: "Mensagens de salas",
  PRIVATE_MESSAGE: "Mensagens privadas",
  MENTION: "Menções a você",
  ROOM_NOTICE: "Avisos e encerramento de salas",
  FORUM: "Fórum, respostas e reações",
  ACHIEVEMENT: "Conquistas",
  RIDE: "Caronas",
  FRIEND: "Amizades",
};

type Preference = {
  category: string;
  inApp: boolean;
  email: boolean;
  push: boolean;
};

export function NotificationPreferences() {
  const [items, setItems] = useState<Preference[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    api<Preference[]>("/notifications/preferences")
      .then(setItems)
      .catch((e) => setStatus(e.message));
  }, []);

  async function save(item: Preference) {
    setBusy(true);
    try {
      await api("/notifications/preferences", {
        method: "PUT",
        body: JSON.stringify(item),
      });
      setItems((old) =>
        old.map((p) => (p.category === item.category ? item : p)),
      );
      setStatus("Preferência salva.");
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="notification-preferences">
      <h2>Como você recebe novidades</h2>
      <p>
        Escolha separadamente o que aparece dentro do Enturma, chega por push no
        celular ou PC ou é enviado por e-mail. E-mails de segurança, confirmação
        de conta e recuperação de senha continuam ativos.
      </p>
      {items.map((item) => (
        <fieldset key={item.category}>
          <legend>{categoryNames[item.category]}</legend>
          <label className="check-row">
            <input
              type="checkbox"
              disabled={busy}
              checked={item.inApp}
              onChange={(e) => void save({ ...item, inApp: e.target.checked })}
            />
            Caixa de entrada no Enturma
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              disabled={busy}
              checked={item.push}
              onChange={(e) => {
                if (e.target.checked)
                  window.dispatchEvent(new Event("enturma-enable-web-push"));
                void save({ ...item, push: e.target.checked });
              }}
            />
            No celular ou PC (push)
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              disabled={busy}
              checked={item.email}
              onChange={(e) => void save({ ...item, email: e.target.checked })}
            />
            E-mail
          </label>
        </fieldset>
      ))}
      <p role="status">{status}</p>
    </section>
  );
}
