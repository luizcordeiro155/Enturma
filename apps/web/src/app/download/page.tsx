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
} from "lucide-react";
import styles from "./download.module.css";
const desktopOrigin =
  "https://enturma-desktop-download-v5-production.up.railway.app";
export default async function DownloadPage() {
  const ua = (await headers()).get("user-agent") ?? "";
  if (ua.includes("EnturmaDesktop/")) redirect("/home");
  const android = /Android/i.test(ua);
  let androidUrl: string | undefined;
  try {
    const candidate = new URL(process.env.ANDROID_DOWNLOAD_URL ?? "");
    if (
      candidate.protocol === "https:" &&
      !candidate.username &&
      !candidate.password &&
      candidate.pathname.endsWith(".apk")
    )
      androidUrl = candidate.href;
  } catch {}
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
              <Monitor size={18} />
              Enturma 0.3.0
            </span>
            <h1>Seu espaço de estudo. Na sua tela.</h1>
            <p className={styles.lead}>
              Salas, chamadas, comunidade, perfil e cadernos de estudo na mesma
              conta. Escolha seu dispositivo para continuar aprendendo em
              companhia.
            </p>
            <div className={styles.heroMeta}>
              <span>
                <ShieldCheck size={18} />
                Windows 10/11 · 64 bits
              </span>
              <span>Android</span>
              <span>iOS em preparação</span>
            </div>
          </div>
          <aside className={styles.downloadCard}>
            <Download size={30} />
            <h2>{android ? "Enturma para Android" : "Enturma para Windows"}</h2>
            <p>
              {android
                ? "Aplicativo nativo com navegação por abas, salas e comunidade."
                : "Um arquivo para instalar o Enturma, criar seus atalhos e receber as próximas atualizações no aplicativo."}
            </p>
            {android && androidUrl ? (
              <a className={styles.primary} href={androidUrl}>
                Baixar APK para Android
              </a>
            ) : android ? (
              <p>
                O APK está em preparação. Enquanto isso, acesse todos os
                recursos pelo navegador.
              </p>
            ) : (
              <a
                className={styles.primary}
                href={`${desktopOrigin}/Enturma-Setup-0.3.0.exe`}
              >
                <Download size={18} />
                Baixar Enturma-Setup-0.3.0.exe
              </a>
            )}
            <small className={styles.downloadNote}>
              A instalação Windows é por usuário. Seus dados e sua conta
              continuam no Enturma.
            </small>
          </aside>
        </section>
        <section
          className={styles.features}
          aria-label="Plataformas disponíveis"
        >
          <article>
            <Monitor size={28} />
            <div>
              <h2>Windows</h2>
              <p>Instalador NSIS, atalhos e atualização pelo aplicativo.</p>
              <a href={`${desktopOrigin}/Enturma-Setup-0.3.0.exe`}>
                Baixar instalador 0.3.0
              </a>
            </div>
          </article>
          <article>
            <Smartphone size={28} />
            <div>
              <h2>Android</h2>
              <p>
                Build nativo Expo/React Native. Configurações de APK e AAB
                prontas para distribuição.
              </p>
              {androidUrl ? (
                <a href={androidUrl}>Baixar APK</a>
              ) : (
                <p>APK em preparação</p>
              )}
            </div>
          </article>
          <article>
            <Smartphone size={28} />
            <div>
              <h2>iOS</h2>
              <p>
                Em preparação. A distribuição será liberada após assinatura e
                validação para dispositivos Apple.
              </p>
            </div>
          </article>
        </section>
        <section className={styles.steps}>
          <div>
            <span className={styles.eyebrow}>Windows em poucos passos</span>
            <h2>Instale e entre na sua turma</h2>
          </div>
          <ol>
            <li>
              <span>1</span>
              <div>
                <strong>Baixe</strong>
                <p>Salve o arquivo Enturma-Setup-0.3.0.exe.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Instale</strong>
                <p>Execute o instalador e escolha seus atalhos.</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Entre</strong>
                <p>Abra o Enturma e use sua conta habitual.</p>
              </div>
            </li>
          </ol>
        </section>
        <footer className={styles.footer}>
          <span>
            <BookOpen size={22} />
            Enturma 0.3.0
          </span>
          <span>
            <RefreshCw size={18} />
            Atualizações pelo aplicativo
          </span>
          <Link href="/home">Continuar no navegador</Link>
        </footer>
      </div>
    </main>
  );
}
