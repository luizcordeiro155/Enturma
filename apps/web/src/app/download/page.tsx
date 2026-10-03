import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
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
              Instalação pelo navegador
            </span>
            <h1>Instale o Enturma sem baixar EXE ou APK.</h1>
            <p className={styles.lead}>
              O navegador instala o Enturma como aplicativo no Windows ou
              Android. Ele ganha o mesmo ícone da versão mobile, abre em uma
              janela independente e continua usando sua conta, salas e dados.
            </p>
            <div className={styles.heroMeta}>
              <span>
                <ShieldCheck size={18} />
                Sem instalador tradicional
              </span>
              <span>Windows</span>
              <span>Android</span>
              <span>Atualizações Web automáticas</span>
            </div>
          </div>

          <aside className={styles.downloadCard}>
            <div className={styles.downloadIcon}>
              <EnturmaAppIcon size={48} />
            </div>
            <span className={styles.cardLabel}>Enturma</span>
            <h2>Instalar Enturma</h2>
            <p>
              A instalação é feita pelo próprio navegador. Não há download de
              EXE nem APK nesta versão.
            </p>
            <PwaInstallButton />
            <small className={styles.downloadNote}>
              Depois de instalado, o item “Instalar aplicativo” é removido do
              Enturma automaticamente.
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
