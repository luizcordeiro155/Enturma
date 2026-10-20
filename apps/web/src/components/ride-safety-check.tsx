"use client";
import { useEffect, useRef, useState } from "react";
import { Phone, ShieldCheck } from "lucide-react";
import { api, post } from "@/lib/api";
import { profileEntrance } from "./profile-motion";
type Check = {
  active: boolean;
  monitoring: boolean;
  pending: boolean;
  alertKind?: "ROUTE" | "DURATION";
};
export function RideSafetyCheck({
  matchId,
  passenger,
}: {
  matchId: string;
  passenger: boolean;
}) {
  const [check, setCheck] = useState<Check>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const card = useRef<HTMLElement>(null);
  useEffect(() => {
    let live = true;
    const refresh = () => {
      if (document.hidden) return;
      void api<Check>(`/matches/${matchId}/safety-check`, { cache: "no-store" })
        .then((c) => {
          if (live) {
            setCheck(c);
            setError("");
          }
        })
        .catch(() => {
          if (live)
            setError("Acompanhamento indisponível. Tentando reconectar…");
        });
    };
    refresh();
    const interval = setInterval(refresh, 10000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      live = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [matchId]);
  useEffect(() => {
    if (!check?.pending || !card.current) return;
    const animation = profileEntrance(card.current);
    return () => animation?.cancel();
  }, [check?.pending]);
  if (!passenger || !check?.active) return null;
  return (
    <section
      ref={card}
      className={`ride-safety-check${check.pending ? " needs-answer" : ""}`}
      aria-label="Acompanhamento de segurança"
    >
      <ShieldCheck size={24} />
      <div>
        {check.pending ? (
          <>
            <h3>Tudo bem por aí?</h3>
            <p>
              {check.alertKind === "ROUTE"
                ? "O trajeto está diferente da rota prevista há alguns minutos."
                : "Sua carona está levando mais tempo que o previsto."}{" "}
              Isso pode acontecer por trânsito ou uma mudança de caminho.
            </p>
            <div className="ride-safety-actions">
              <button
                type="button"
                className="safety-okay"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await post(`/matches/${matchId}/safety-check/okay`);
                    setCheck((c) => (c ? { ...c, pending: false } : c));
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Está tudo bem
              </button>
              <a className="safety-help" href="tel:190">
                <Phone size={18} /> Ajuda · ligar 190
              </a>
            </div>
            <small>O botão de ajuda abre o discador do celular.</small>
          </>
        ) : (
          <>
            <strong>
              {check.monitoring
                ? "Acompanhando seu trajeto"
                : "Aguardando localização precisa"}
            </strong>
            <p>
              Acompanhamento disponível enquanto o motorista compartilha o GPS.
              Você pode abrir o discador de emergência a qualquer momento.
            </p>
            <a href="tel:190" className="safety-help">
              <Phone size={16} /> Preciso de ajuda · 190
            </a>
          </>
        )}
        {error && <p role="status">{error}</p>}
      </div>
    </section>
  );
}
