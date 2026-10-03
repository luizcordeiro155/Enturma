import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Download,
  Monitor,
  Smartphone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PwaInstallButton } from "@/components/pwa-install";
import styles from "./download.module.css";

const desktopOrigin =
  "https://enturma-desktop-download-v5-production.up.railway.app";
const androidOrigin =
  "https://enturma-android-download-v3-production.up.railway.app";

type AndroidManifest = {
  version: string;
  downloadUrl: string;
};

async function currentAndroidRelease(): Promise<AndroidManifest | null> {
  try {
    const response = await fetch(`${androidOrigin}/latest-android.json`, {
      cache: "no-store",
      headers: { "User-Agent": "Enturma-Web" },
    });
    if (!response.ok) return null;
    const manifest = (await response.json()) as AndroidManifest;
    if (!/^\d+\.\d+\.\d+$/.test(manifest.version || "")) return null;
    if (!manifest.downloadUrl?.startsWith(androidOrigin + "/")) return null;
    return manifest;
  } catch {
    return null;
  }
}

export default async function DownloadPage() {
  const ua = (await headers()).get("user-agent") ?? "";
  if (ua.includes("EnturmaDesktop/") || ua.includes("EnturmaMobile/"))
    redirect("/home");

  const androidRelease = await currentAndroidRelease();
  const androidVersion = androidRelease?.version ?? "mais recente";
  const androidUrl =
    androidRelease?.downloadUrl ?? `${androidOrigin}/Enturma-Android.apk`;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link href="/home" className={styles.brand}>
            <BookOpen size={40} />
            <span>
              enturma<span className={styles.dot}>.</span>
            </span>
          </Link>
          <Link href="/home" className={styles.backLink}>
            <ArrowLeft size={18} />
            Voltar ao Enturma
          </Link>
        </header>

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>
              <Sparkles size={18} />
              Instalação recomendada
            </span>
            <h1>Instale o Enturma sem baixar EXE ou APK.</h1>
            <p className={styles.lead}>
              O navegador instala o Enturma como aplicativo no Windows ou
              Android. Ele ganha ícone próprio, abre em uma janela independente
              e continua usando a mesma conta, salas e dados da versão Web.
            </p>
            <div className={styles.heroMeta}>
              <span>
                <ShieldCheck size={18} />
                Instalação pelo navegador
              </span>
              <span>Windows</span>
              <span>Android</span>
              <span>Atualizações Web automáticas</span>
            </div>
          </div>

          <aside className={styles.downloadCard}>
            <div className={styles.downloadIcon}>
              <Download size={28} />
            </div>
            <span className={styles.cardLabel}>Enturma PWA</span>
            <h2>Instalar Enturma</h2>
            <p>
              Esta é a opção principal. Não é necessário executar instalador
              baixado nem liberar instalação de fontes desconhecidas.
            </p>
            <PwaInstallButton />
            <small className={styles.downloadNote}>
              Em navegadores compatíveis, o botão abre a instalação nativa. Se
              o navegador exigir ação manual, o próprio Enturma mostra as
              instruções.
            </small>
          </aside>
        </section>

        <section className={styles.features} aria-label="Como funciona">
          <article>
            <Monitor size={28} />
            <div>
              <h2>Windows</h2>
              <p>
                Edge e Chrome podem instalar o Enturma como aplicativo
                independente, com ícone e atalho no sistema.
              </p>
            </div>
          </article>
          <article>
            <Smartphone size={28} />
            <div>
              <h2>Android</h2>
              <p>
                Chrome e navegadores compatíveis adicionam o Enturma como app
                sem precisar instalar o APK manualmente.
              </p>
            </div>
          </article>
          <article>
            <RefreshCw size={28} />
            <div>
              <h2>Sempre atualizado</h2>
              <p>
                A interface vem da versão Web oficial, então melhorias e
                correções chegam sem baixar um novo instalador.
              </p>
            </div>
          </article>
        </section>

        <section className={styles.steps}>
          <div>
            <span className={styles.eyebrow}>Instalação simples</span>
            <h2>Três passos e pronto</h2>
          </div>
          <ol>
            <li>
              <span>1</span>
              <div>
                <strong>Toque em Instalar Enturma</strong>
                <p>O navegador abre o fluxo de instalação compatível.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Confirme no navegador</strong>
                <p>Não existe EXE ou APK nesse método.</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Abra pelo novo ícone</strong>
                <p>Sua conta e seus dados continuam exatamente os mesmos.</p>
              </div>
            </li>
          </ol>
        </section>

        <details className={styles.advanced}>
          <summary>Opções avançadas: instaladores tradicionais</summary>
          <div className={styles.advancedGrid}>
            <article>
              <Monitor size={24} />
              <div>
                <strong>Windows EXE</strong>
                <p>
                  Mantido para compatibilidade com a versão Electron completa.
                  O Windows pode mostrar avisos para executáveis sem reputação.
                </p>
                <a href={`${desktopOrigin}/Enturma-Setup-0.3.0.exe`}>
                  Baixar Enturma-Setup-0.3.0.exe
                </a>
              </div>
            </article>
            <article>
              <Smartphone size={24} />
              <div>
                <strong>Android APK {androidVersion}</strong>
                <p>
                  Mantido como alternativa nativa. A instalação direta pode
                  exigir autorização de fonte externa no Android.
                </p>
                <a href={androidUrl}>Baixar APK {androidVersion}</a>
              </div>
            </article>
          </div>
        </details>

        <footer className={styles.footer}>
          <span>
            <BookOpen size={22} />
            Enturma
          </span>
          <span>
            <ShieldCheck size={18} />
            Instalação recomendada via navegador
          </span>
          <Link href="/home">Continuar no navegador</Link>
        </footer>
      </div>
    </main>
  );
}
