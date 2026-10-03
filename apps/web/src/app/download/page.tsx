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
import { EnturmaAppIcon } from "@/components/enturma-app-icon";
import styles from "./download.module.css";

const WINDOWS_DOWNLOAD =
  "https://enturma-desktop-download-v5-production.up.railway.app/Enturma-Windows.exe";
const ANDROID_DOWNLOAD =
  "https://enturma-android-download-v3-production.up.railway.app/Enturma-Android.apk";

export default async function DownloadPage() {
  const ua = (await headers()).get("user-agent") ?? "";
  if (ua.includes("EnturmaDesktop/") || ua.includes("EnturmaMobile/"))
    redirect("/home");

  const isAndroid = /Android/i.test(ua);
  const isWindows = /Windows/i.test(ua);
  const primaryPlatform = isAndroid ? "android" : isWindows ? "windows" : null;

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
              Melhor experiência
            </span>
            <h1>Baixe o Enturma como aplicativo.</h1>
            <p className={styles.lead}>
              As versões para Windows e Android agora são a forma recomendada
              de usar o Enturma. Elas oferecem uma experiência mais completa,
              integrada ao sistema e preparada para notificações e atualizações
              do próprio aplicativo.
            </p>
            <div className={styles.heroMeta}>
              <span>
                <ShieldCheck size={18} />
                Aplicativos oficiais
              </span>
              <span>Notificações nativas</span>
              <span>Windows .EXE</span>
              <span>Android .APK</span>
            </div>
          </div>

          <aside className={styles.downloadCard}>
            <div className={styles.downloadIcon}>
              <EnturmaAppIcon size={48} />
            </div>
            <span className={styles.cardLabel}>
              {primaryPlatform
                ? "Recomendado para este dispositivo"
                : "Aplicativos recomendados"}
            </span>

            {primaryPlatform === "android" ? (
              <>
                <h2>Enturma para Android</h2>
                <p>
                  Use o aplicativo Android para ter notificações do sistema,
                  experiência mobile otimizada e atualizações integradas ao app.
                </p>
                <a className={styles.primary} href={ANDROID_DOWNLOAD}>
                  <Download size={18} />
                  Baixar APK para Android
                </a>
              </>
            ) : primaryPlatform === "windows" ? (
              <>
                <h2>Enturma para Windows</h2>
                <p>
                  Use o aplicativo Desktop com notificações nativas, destaque
                  na barra de tarefas e atualizador integrado.
                </p>
                <a className={styles.primary} href={WINDOWS_DOWNLOAD}>
                  <Download size={18} />
                  Baixar EXE para Windows
                </a>
              </>
            ) : (
              <>
                <h2>Escolha seu aplicativo</h2>
                <p>
                  O Enturma possui aplicativo dedicado para Windows e Android.
                  Escolha abaixo a versão do dispositivo que você usa.
                </p>
                <a className={styles.primary} href={WINDOWS_DOWNLOAD}>
                  <Monitor size={18} />
                  Baixar para Windows
                </a>
                <a className={styles.secondary} href={ANDROID_DOWNLOAD}>
                  <Smartphone size={18} />
                  Baixar para Android
                </a>
              </>
            )}

            <small className={styles.downloadNote}>
              O mesmo perfil e as mesmas salas funcionam entre Web, Desktop e
              Android.
            </small>
          </aside>
        </section>

        <section className={styles.betaSection} aria-labelledby="apps-title">
          <div className={styles.betaHeading}>
            <div>
              <span className={styles.betaEyebrow}>
                <Sparkles size={15} />
                Aplicativos prioritários
              </span>
              <h2 id="apps-title">Escolha a melhor versão para seu dispositivo</h2>
              <p>
                O <strong>EXE para Windows</strong> e o <strong>APK para Android</strong>{" "}
                são agora as opções principais de download do Enturma.
              </p>
            </div>
          </div>

          <div className={styles.betaGrid}>
            <article className={styles.betaCard}>
              <div className={styles.betaCardHeader}>
                <span className={styles.betaPlatform}>
                  <Monitor size={20} />
                  Windows
                </span>
                <span className={styles.betaBadge}>RECOMENDADO</span>
              </div>
              <p>
                Aplicativo desktop dedicado com notificações nativas, contador
                de não lidas na barra de tarefas, chamadas e atualizador
                integrado.
              </p>
              <a className={styles.betaLink} href={WINDOWS_DOWNLOAD}>
                <Download size={16} />
                Baixar Enturma para Windows (.EXE)
              </a>
            </article>

            <article className={styles.betaCard}>
              <div className={styles.betaCardHeader}>
                <span className={styles.betaPlatform}>
                  <Smartphone size={20} />
                  Android
                </span>
                <span className={styles.betaBadge}>RECOMENDADO</span>
              </div>
              <p>
                Aplicativo Android com interface mobile completa, notificações
                do sistema, chamadas, perfis e atualização integrada.
              </p>
              <a className={styles.betaLink} href={ANDROID_DOWNLOAD}>
                <Download size={16} />
                Baixar Enturma para Android (.APK)
              </a>
            </article>
          </div>

          <small className={styles.betaNote}>
            A instalação pelo navegador continua disponível abaixo como uma
            segunda alternativa.
          </small>
        </section>

        <section
          className={styles.browserSection}
          aria-labelledby="browser-install-title"
        >
          <div className={styles.browserCopy}>
            <span className={styles.betaEyebrow}>Segunda alternativa</span>
            <h2 id="browser-install-title">Instalar pelo navegador</h2>
            <p>
              Se você não quiser baixar o EXE ou APK, ainda pode instalar o
              Enturma como aplicativo pelo navegador. Essa opção continua
              disponível, mas os aplicativos dedicados acima oferecem a melhor
              experiência.
            </p>
          </div>

          <div className={styles.browserCard}>
            <div className={styles.downloadIcon}>
              <EnturmaAppIcon size={42} />
            </div>
            <span className={styles.cardLabel}>Alternativa Web</span>
            <PwaInstallButton />
          </div>
        </section>

        <section className={styles.features} aria-label="Vantagens dos aplicativos">
          <article>
            <Monitor size={28} />
            <div>
              <h2>Desktop completo</h2>
              <p>
                No Windows, o Enturma pode interagir com notificações e barra de
                tarefas como um aplicativo desktop de verdade.
              </p>
            </div>
          </article>
          <article>
            <Smartphone size={28} />
            <div>
              <h2>Mobile completo</h2>
              <p>
                No Android, você recebe a experiência mobile do Enturma com
                notificações do sistema e navegação otimizada para toque.
              </p>
            </div>
          </article>
          <article>
            <RefreshCw size={28} />
            <div>
              <h2>Atualizações integradas</h2>
              <p>
                Os aplicativos verificam novas versões e ajudam você a manter o
                Enturma atualizado sem precisar procurar o download novamente.
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
                <strong>Escolha Windows ou Android</strong>
                <p>Baixe o EXE no computador ou o APK no celular.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Abra o arquivo baixado</strong>
                <p>Confirme a instalação quando o sistema solicitar.</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Entre na sua conta</strong>
                <p>
                  Seu perfil, suas salas e seus dados continuam sincronizados.
                </p>
              </div>
            </li>
          </ol>
        </section>

        <footer className={styles.footer}>
          <span>
            <BookOpen size={22} />
            Enturma
          </span>
          <span>
            <ShieldCheck size={18} />
            Apps oficiais para Windows e Android
          </span>
          <Link href="/home">Continuar no navegador</Link>
        </footer>
      </div>
    </main>
  );
}
