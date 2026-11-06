"use client";

import { useEffect, useState } from "react";
import { Check, ClipboardCopy, ExternalLink, Fingerprint, RefreshCw } from "lucide-react";
import styles from "@/app/download/download.module.css";

type ReleaseIntegrity = {
  version?: string;
  sha256?: string;
  installerSha256?: string;
  installerUrl?: string;
  downloadUrl?: string;
  file?: string;
};

const manifests = [
  {
    key: "windows",
    label: "Integridade do instalador Windows",
    title: "Windows · EXE",
    url: "https://enturma-desktop-download-v5-production.up.railway.app/latest.json",
    hashField: "installerSha256",
    filename: "Enturma-Setup",
  },
  {
    key: "android",
    label: "Integridade do APK Android",
    title: "Android · APK",
    url: "https://enturma-android-download-v3-production.up.railway.app/latest-android.json",
    hashField: "sha256",
    filename: "Enturma-Android",
  },
] as const;

function IntegrityCard({ config }: { config: (typeof manifests)[number] }) {
  const [release, setRelease] = useState<ReleaseIntegrity | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(config.url, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Manifesto indisponível");
        const data = (await response.json()) as ReleaseIntegrity;
        const hash = data[config.hashField];
        if (!hash || !/^[a-f0-9]{64}$/i.test(hash)) {
          throw new Error("Hash indisponível no manifesto");
        }
        if (!controller.signal.aborted) setRelease(data);
      } catch {
        if (!controller.signal.aborted) setError("Não foi possível consultar o hash agora.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [config.url, config.hashField]);

  const hash = release?.[config.hashField];
  const filename = release?.version && /^\d+\.\d+\.\d+$/.test(release.version)
    ? `${config.filename}-${release.version}.${config.key === "windows" ? "exe" : "apk"}`
    : config.key === "windows" ? "Enturma-Setup-<versão>.exe" : "Enturma-Android-<versão>.apk";

  async function copy() {
    if (!hash) return;
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className={styles.integrityCard} role="region" aria-label={config.label}>
      <div className={styles.integrityCardHead}>
        <strong>{config.title}</strong>
        {release?.version ? <span>v{release.version}</span> : null}
      </div>
      <p>Hash SHA-256 oficial do instalador distribuído nesta versão:</p>
      {loading ? (
        <p className={styles.integrityState} role="status"><RefreshCw size={16} aria-hidden="true" /> Consultando manifesto oficial…</p>
      ) : error ? (
        <p className={styles.integrityState} role="status">{error} Confirme pelo manifesto oficial antes de instalar.</p>
      ) : (
        <>
          <code className={styles.integrityHash}>{hash}</code>
          <button type="button" className={styles.hashCopy} onClick={() => void copy()}>
            {copied ? <Check size={16} aria-hidden="true" /> : <ClipboardCopy size={16} aria-hidden="true" />}
            {copied ? "Hash copiado" : "Copiar SHA-256"}
          </button>
        </>
      )}
      <a href={config.url} target="_blank" rel="noopener noreferrer" className={styles.manifestLink}>
        <Fingerprint size={16} aria-hidden="true" /> Consultar manifesto oficial <ExternalLink size={14} aria-hidden="true" />
      </a>
      <small>Nome esperado: {filename}. A comparação do hash detecta diferenças no arquivo, mas não substitui a verificação da origem e da assinatura.</small>
    </article>
  );
}

export function DownloadIntegrity() {
  return <div className={styles.integrityGrid}>{manifests.map((config) => (
    <IntegrityCard key={config.key} config={config} />
  ))}</div>;
}
