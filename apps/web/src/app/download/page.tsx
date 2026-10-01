import Link from "next/link";
import styles from "./download.module.css";

export const revalidate = 300;

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

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <Link href="/" className={styles.brand}>
          <span className={styles.mark}>E</span>
          <span>enturma.</span>
        </Link>

        <div className={styles.copy}>
          <span className={styles.kicker}>Enturma para computador</span>
          <h1>Leve sua experiência de estudo para o PC.</h1>
          <p>
            O aplicativo usa a mesma conta, salas, mensagens, chamadas,
            materiais, IA e recursos da versão Web. Tudo continua sincronizado
            entre navegador e aplicativo.
          </p>
        </div>

        <div className={styles.downloadCard}>
          <div>
            <span className={styles.platform}>Windows 10/11 · 64 bits</span>
            <h2>Enturma Desktop</h2>
            <p>
              Instalador com suporte a câmera, microfone, notificações e
              compartilhamento de tela.
            </p>
          </div>

          {windowsInstaller ? (
            <a className={styles.primary} href={windowsInstaller.browser_download_url}>
              Baixar para Windows · {formatSize(windowsInstaller.size)}
            </a>
          ) : (
            <a
              className={styles.primary}
              href="https://github.com/luizcordeiro155/Enturma/releases"
              target="_blank"
              rel="noreferrer"
            >
              Ver versões disponíveis
            </a>
          )}

          {windowsPortable ? (
            <a
              className={styles.secondary}
              href={windowsPortable.browser_download_url}
            >
              Versão portátil · {formatSize(windowsPortable.size)}
            </a>
          ) : null}

          <small>
            {release
              ? `Versão ${release.tag_name} · publicada em ${new Date(
                  release.published_at,
                ).toLocaleDateString("pt-BR")}`
              : "A primeira versão instalável será exibida aqui assim que for publicada."}
          </small>
        </div>
      </section>

      <section className={styles.features}>
        <article>
          <strong>Mesma conta</strong>
          <p>Entre com a mesma conta que você já utiliza no Enturma Web.</p>
        </article>
        <article>
          <strong>Chamadas completas</strong>
          <p>
            Microfone, câmera e compartilhamento de tela continuam disponíveis
            dentro do aplicativo.
          </p>
        </article>
        <article>
          <strong>Sempre sincronizado</strong>
          <p>
            O app utiliza os mesmos serviços do Enturma, então suas informações
            continuam atualizadas em todos os dispositivos.
          </p>
        </article>
      </section>

      <div className={styles.footer}>
        <Link href="/">Voltar ao Enturma Web</Link>
        <a
          href="https://github.com/luizcordeiro155/Enturma"
          target="_blank"
          rel="noreferrer"
        >
          Código no GitHub
        </a>
      </div>
    </main>
  );
}
