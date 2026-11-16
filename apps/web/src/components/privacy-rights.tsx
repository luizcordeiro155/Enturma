"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FileCheck2, Mail } from "lucide-react";
import { api } from "@/lib/api";
import { CONTROLLER_NAME, LEGAL_VERSION, LEGAL_VERSION_LABEL, PRIVACY_EMAIL } from "@/lib/legal";

type Consents = {
  current: string;
  accepted: boolean;
  history: { document: string; version: string; source: string; acceptedAt: string }[];
};

const DOCUMENT: Record<string, string> = {
  TERMS: "Termos de Uso",
  PRIVACY: "Política de Privacidade",
  AGE_18: "Declaração de maioridade",
};

/** LGPD rights at a glance: what was accepted, how to exercise each right and who answers. */
export function PrivacyRights() {
  const [consents, setConsents] = useState<Consents | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    api<Consents>("/account/privacy/consents", { cache: "no-store" })
      .then((value) => alive && setConsents(value))
      .catch(() => alive && setConsents(null));
    return () => {
      alive = false;
    };
  }, []);

  async function accept() {
    setBusy(true);
    setError("");
    try {
      setConsents(
        await api<Consents>("/account/privacy/consents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ version: LEGAL_VERSION }),
        }),
      );
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const current = consents?.history.find(
    (item) => item.version === LEGAL_VERSION && item.document === "PRIVACY",
  );

  return (
    <div className="privacy-rights">
      <article className="privacy-consent" data-accepted={consents?.accepted ? "true" : "false"}>
        <FileCheck2 aria-hidden />
        <div>
          <strong>Termos de Uso e Política de Privacidade</strong>
          <p>
            Versão de {LEGAL_VERSION_LABEL}.{" "}
            {consents?.accepted && current
              ? `Você aceitou em ${new Date(current.acceptedAt).toLocaleDateString("pt-BR")}.`
              : "Leia o que mudou e confirme a leitura."}{" "}
            <Link href="/privacidade">Política</Link> · <Link href="/termos">Termos</Link>
          </p>
          {consents && consents.history.length > 0 && (
            <details>
              <summary>Histórico de aceites</summary>
              <ul>
                {consents.history.map((item) => (
                  <li key={`${item.document}-${item.version}`}>
                    {DOCUMENT[item.document] ?? item.document} · versão {item.version} ·{" "}
                    {new Date(item.acceptedAt).toLocaleString("pt-BR")}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </div>
        {consents && !consents.accepted && (
          <button type="button" className="button secondary" disabled={busy} onClick={() => void accept()}>
            Li e aceito
          </button>
        )}
      </article>
      <article>
        <Mail aria-hidden />
        <div>
          <strong>Seus direitos pela LGPD</strong>
          <p>
            Aqui você exporta todos os seus dados, revoga sessões e exclui a conta. Corrija dados
            no seu perfil e revogue permissões de localização, câmera, microfone e notificações nas
            configurações do aparelho. Para qualquer outro pedido, fale com o encarregado,{" "}
            {CONTROLLER_NAME}: <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>. Respondemos em
            até 15 dias.
          </p>
        </div>
      </article>
    </div>
  );
}
