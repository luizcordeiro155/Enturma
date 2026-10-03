import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Download,
  FlaskConical,
  Monitor,
  Smartphone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PwaInstallButton } from "@/components/pwa-install";
import { EnturmaAppIcon } from "@/components/enturma-app-icon";
import styles from "./download.module.css";

export default async function DownloadPage() {
  const ua = (await headers()).get("user-agent") ?? "";
  if (ua.includes("EnturmaDesktop/") || ua.includes("EnturmaMobile/"))
    redirect("/home");

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
              Download recomendado
            </span>
            <h1>Baixe e instale o Enturma do seu jeito.</h1>
            <p className={styles.lead}>
              A instalação pelo navegador continua sendo a opção principal,
              simples e estável. Para uma experiência mais integrada ao sistema,
              você também pode experimentar as versões Beta para Windows e Android.
            </p>
            <div className={styles.heroMeta}>
              <span>
                <ShieldCheck size={18} />
                Sem instalador tradicional
              </span>
              <span>Windows e Android</span>
              <span>Sem instalador tradicional</span>
              <span>Atualizações automáticas</span>
            </div>
          </div>

          <aside className={styles.downloadCard}>
            <div className={styles.downloadIcon}>
              <EnturmaAppIcon size={48} />
            </div>
            <span className={styles.cardLabel}>Versão recomendada</span>
            <h2>Instalar Enturma</h2>
            <p>
              Instale pelo próprio navegador sem precisar baixar EXE ou APK.
              É a opção mais simples para começar e recebe as atualizações Web
              automaticamente.
            </p>
            <PwaInstallButton />
            <small className={styles.downloadNote}>
              O botão continua disponível no navegador. Se você desinstalar
              a PWA, pode voltar aqui e instalar novamente normalmente.
            </small>
          </aside>
        </section>

        <section className={styles.betaSection} aria-labelledby="beta-title">
          <div className={styles.betaHeading}>
            <div>
              <span className={styles.betaEyebrow}>
                <FlaskConical size={15} />
                Alternativas em teste
              </span>
              <h2 id="beta-title">Quer uma experiência ainda melhor no app?</h2>
              <p>
                As versões abaixo são <strong>Beta</strong>. Elas têm integrações
                extras com o dispositivo e podem receber mudanças com mais frequência.
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
                <span className={styles.betaBadge}>BETA</span>
              </div>
              <p>
                EXE com experiência desktop dedicada, notificações nativas,
                contador de não lidas na barra de tarefas e atualizador do app.
              </p>
              <a
                className={styles.betaLink}
                href="https://enturma-desktop-download-v5-production.up.railway.app/Enturma-Windows.exe"
              >
                <Download size={16} />
                Baixar EXE Beta
              </a>
            </article>

            <article className={styles.betaCard}>
              <div className={styles.betaCardHeader}>
                <span className={styles.betaPlatform}>
                  <Smartphone size={20} />
                  Android
                </span>
                <span className={styles.betaBadge}>BETA</span>
              </div>
              <p>
                APK com integração nativa ao Android, notificações do sistema
                e experiência otimizada para o celular.
              </p>
              <a
                className={styles.betaLink}
                href="https://enturma-android-download-v3-production.up.railway.app/Enturma-Android.apk"
              >
                <Download size={16} />
                Baixar APK Beta
              </a>
            </article>
          </div>

          <small className={styles.betaNote}>
            Beta significa que alguns recursos ainda podem mudar. A instalação
            recomendada acima continua disponível normalmente.
          </small>
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
                sem precisar liberar instalação de APK externo.
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
                <p>O Enturma é adicionado como aplicativo do navegador.</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Abra pelo ícone do Enturma</strong>
                <p>Sua conta e seus dados continuam exatamente os mesmos.</p>
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
            Instalação pelo navegador
          </span>
          <Link href="/home">Continuar no navegador</Link>
        </footer>
      </div>
    </main>
  );
}
