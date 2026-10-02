import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Download,
  Monitor,
  RefreshCw,
  ShieldCheck,
  Video,
} from "lucide-react";
import styles from "./download.module.css";

export const revalidate = 300;

const hostedWindowsUrl =
  "https://enturma-desktop-download-v5-production.up.railway.app/Enturma-Windows.zip";

type ReleaseAsset = {
  name: string;
  browser_download_url: string;
  size: number;
};

type Release = {
  tag_name: string;
  name: string | null;
  html_url: string;
  published_at: string;
  assets: ReleaseAsset[];
};

async function latestRelease(): Promise<Release | null> {
  try {
    const response = await fetch(
      "https://api.github.com/repos/luizcordeiro155/Enturma/releases/latest",
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "Enturma-Web",
        },
        next: { revalidate: 300 },
      },
    );
    if (!response.ok) return null;
    return (await response.json()) as Release;
  } catch {
    return null;
  }
}

function formatSize(bytes: number) {
  return `${Math.max(1, Math.round(bytes / 1024 / 1024))} MB`;
}

export default async function DownloadPage() {
  const release = await latestRelease();
  const windowsInstaller =
    release?.assets.find(
      (asset) =>
        asset.name.toLowerCase().endsWith(".exe") &&
        !asset.name.toLowerCase().includes("portable"),
    ) ?? null;

  const windowsPortable =
    release?.assets.find(
      (asset) =>
        asset.name.toLowerCase().endsWith(".exe") &&
        asset.name.toLowerCase().includes("portable"),
    ) ?? null;

  const primaryWindowsUrl =
    windowsInstaller?.browser_download_url ?? hostedWindowsUrl;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link href="/home" className={styles.brand} aria-label="Enturma">
            <BookOpen size={40} strokeWidth={2.2} />
            <span>
              enturma<span className={styles.dot}>.</span>
            </span>
          </Link>

          <div className={styles.headerActions}>
            <span className={styles.version}>Web v0.2.0</span>
            <Link href="/home" className={styles.backLink}>
              <ArrowLeft size={17} />
              Voltar ao Enturma
            </Link>
          </div>
        </header>

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>
              <Monitor size={16} />
              Aplicativo para computador
            </span>

            <h1>O Enturma que você já conhece, agora no seu PC.</h1>

            <p className={styles.lead}>
              Use a mesma conta, suas salas, mensagens, chamadas, materiais,
              cadernos, IA, fórum, amigos e caronas em uma janela própria do
              Enturma.
            </p>

            <div className={styles.heroMeta}>
              <span>
                <ShieldCheck size={16} />
                Windows 10/11
              </span>
              <span>64 bits</span>
              <span>Versão 0.2.0</span>
            </div>
          </div>

          <aside className={styles.downloadCard}>
            <div className={styles.downloadIcon}>
              <Download size={28} />
            </div>

            <div>
              <span className={styles.cardLabel}>Enturma Desktop</span>
              <h2>Baixar para Windows</h2>
              <p>
                A versão Desktop permanece sincronizada com o Enturma Web e
                recebe as próximas atualizações pelo próprio aplicativo.
              </p>
            </div>

            <a className={styles.primary} href={primaryWindowsUrl}>
              <Download size={19} />
              {windowsInstaller
                ? `Baixar Enturma · ${formatSize(windowsInstaller.size)}`
                : "Baixar Enturma para Windows"}
            </a>

            {windowsPortable ? (
              <a
                className={styles.secondary}
                href={windowsPortable.browser_download_url}
              >
                Versão portátil · {formatSize(windowsPortable.size)}
              </a>
            ) : null}

            <small className={styles.downloadNote}>
              {release
                ? `Versão ${release.tag_name} · publicada em ${new Date(
                    release.published_at,
                  ).toLocaleDateString("pt-BR")}`
                : "Versão 0.2.0 · Baixe o ZIP, extraia a pasta e abra Enturma.exe. Depois disso, as próximas versões poderão ser atualizadas pelo próprio aplicativo."}
            </small>
          </aside>
        </section>

        <section className={styles.features} aria-label="Recursos do aplicativo">
          <article>
            <span className={styles.featureIcon}>
              <BookOpen size={21} />
            </span>
            <div>
              <strong>Mesma experiência</strong>
              <p>
                O visual e os recursos seguem o mesmo Enturma que você usa no
                navegador.
              </p>
            </div>
          </article>

          <article>
            <span className={styles.featureIcon}>
              <Video size={21} />
            </span>
            <div>
              <strong>Chamadas completas</strong>
              <p>
                Continue usando microfone, câmera e compartilhamento de tela no
                aplicativo.
              </p>
            </div>
          </article>

          <article>
            <span className={styles.featureIcon}>
              <RefreshCw size={21} />
            </span>
            <div>
              <strong>Atualizações automáticas</strong>
              <p>
                Novas versões do Desktop são verificadas, baixadas e aplicadas
                pelo próprio Enturma.
              </p>
            </div>
          </article>
        </section>

        <section className={styles.steps}>
          <div>
            <span className={styles.eyebrow}>Primeiro acesso</span>
            <h2>Abra o Enturma em poucos passos</h2>
          </div>

          <ol>
            <li>
              <span>1</span>
              <div>
                <strong>Baixe</strong>
                <p>Faça o download da versão para Windows.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Extraia</strong>
                <p>Extraia o conteúdo do ZIP para uma pasta do computador.</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Abra</strong>
                <p>Execute Enturma.exe e entre com a sua conta normalmente.</p>
              </div>
            </li>
          </ol>
        </section>

        <footer className={styles.footer}>
          <div className={styles.footerBrand}>
            <BookOpen size={22} />
            <span>
              enturma<span className={styles.dot}>.</span>
            </span>
            <small>Web e Desktop v0.2.0</small>
          </div>

          <div className={styles.footerLinks}>
            <Link href="/home">Enturma Web</Link>
            <a
              href="https://github.com/luizcordeiro155/Enturma"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
