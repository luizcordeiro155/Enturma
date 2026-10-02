"use client";
import { useEffect, useRef, useState } from "react";
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
  revokedAt?: string;
  status: string;
  appeal?: string;
  createdAt: string;
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
  KICK: "Remoção da sala",
  SUSPENSION: "Conta suspensa temporariamente",
  BAN: "Conta banida",
};
export function CommunityFeedback() {
  const [achievement, setAchievement] = useState<Achievement>();
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const card = useRef<HTMLElement>(null);
  useEffect(() => {
    let live = true;
    const load = () =>
      api<Penalty[]>("/moderation/mine")
        .then((rows) => {
          if (live)
            setPenalties(
              rows
                .filter(
                  (p) =>
                    !p.revokedAt &&
                    p.status !== "REVOKED" &&
                    (!p.endsAt || new Date(p.endsAt).getTime() > Date.now()),
                )
                .slice(0, 3),
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
      {penalties.map((p) => (
        <details
          className={`penalty-notice ${["BAN", "SUSPENSION"].includes(p.kind) && !acknowledged.includes(p.id) ? "account-penalty" : ""}`}
          open={["BAN", "SUSPENSION"].includes(p.kind) ? true : undefined}
          key={p.id}
        >
          <summary>
            <ShieldAlert size={18} />
            {actions[p.kind] ?? p.kind} · {rules[p.rule] ?? p.rule}
          </summary>
          {["BAN", "SUSPENSION"].includes(p.kind) && (
            <>
              <h2>Sua participação está limitada</h2>
              <p>
                Consulte a medida aplicada à sua conta. Você pode solicitar uma
                revisão humana abaixo.
              </p>
              <Link href="/settings">Configurações e segurança da conta</Link>
            </>
          )}
          <p>
            Regra: {p.rule}.{" "}
            {p.endsAt
              ? `Termina em ${new Date(p.endsAt).toLocaleString("pt-BR")}.`
              : p.kind === "WARNING"
                ? "Orientação registrada; evite repetir esta conduta."
                : "Sem prazo automático. Você pode pedir revisão."}
          </p>
          <p>
            Escopo: {p.roomId ? "sala de estudo" : "conta"}. Esta medida não
            inspeciona mensagens privadas cifradas.
          </p>
          {p.appeal ? (
            <p>Pedido de revisão enviado. Situação: {p.status}.</p>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const reason = String(
                  new FormData(e.currentTarget).get("reason"),
                );
                try {
                  await post(`/moderation/${p.id}/appeal`, { reason });
                  setPenalties((old) =>
                    old.map((item) =>
                      item.id === p.id
                        ? { ...item, appeal: reason, status: "APPEALED" }
                        : item,
                    ),
                  );
                  setStatus("Pedido enviado para revisão humana.");
                } catch (e) {
                  setStatus((e as Error).message);
                }
              }}
            >
              <label>
                Solicitar revisão
                <textarea
                  name="reason"
                  required
                  minLength={5}
                  maxLength={2000}
                />
              </label>
              <button>Enviar pedido</button>
            </form>
          )}
          <p role="status">{status}</p>
          {!acknowledged.includes(p.id) && (
            <button
              className="secondary"
              onClick={() => setAcknowledged((old) => [...old, p.id])}
            >
              Entendi
            </button>
          )}
        </details>
      ))}
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
type Preference = { category: string; inApp: boolean; email: boolean; push: boolean };
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
        Escolha separadamente o que aparece dentro do Enturma, chega por push no celular
        ou é enviado por e-mail. E-mails de segurança, confirmação de conta e recuperação
        de senha continuam ativos.
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
              onChange={(e) => void save({ ...item, push: e.target.checked })}
            />
            No celular (push)
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
