import { Captions, Clapperboard, MonitorPlay, ShieldCheck } from "lucide-react";
import styles from "./download.module.css";

const VIDEOS = {
  desktop: {
    src: "/download/enturma-como-baixar-16x9.mp4",
    poster: "/download/enturma-como-baixar-16x9.jpg",
    captions: "/download/enturma-como-baixar-16x9.vtt",
    label: "Tutorial em vídeo: como baixar, conferir e instalar o Enturma no Windows",
  },
  mobile: {
    src: "/download/enturma-como-baixar-9x16.mp4",
    poster: "/download/enturma-como-baixar-9x16.jpg",
    captions: "/download/enturma-como-baixar-9x16.vtt",
    label: "Tutorial em vídeo: como baixar, conferir e instalar o Enturma no Android",
  },
} as const;

/**
 * Passo a passo em vídeo logo abaixo do instalador principal.
 * O CSS mostra o corte 16:9 no desktop e o 9:16 no celular; com preload="none",
 * só o vídeo visível é baixado quando a pessoa toca em reproduzir.
 */
export function DownloadTutorial() {
  return (
    <section className={`${styles.tutorialSection} ${styles.reveal}`} aria-labelledby="download-tutorial-title">
      <div className={styles.tutorialCopy}>
        <span className={styles.tutorialEyebrow}>
          <Clapperboard size={15} aria-hidden="true" />
          Passo a passo em vídeo
        </span>
        <h2 id="download-tutorial-title">Assista antes de instalar</h2>
        <p>
          Veja na prática como baixar o Enturma, conferir o código SHA-256 e
          entender os avisos do Windows e do Android, com segurança.
        </p>
        <ul className={styles.tutorialChips}>
          <li><MonitorPlay size={14} aria-hidden="true" /> Capturas reais desta página</li>
          <li><Captions size={14} aria-hidden="true" /> Legendas em português</li>
          <li><ShieldCheck size={14} aria-hidden="true" /> Apps oficiais e verificáveis</li>
        </ul>
      </div>

      <div className={styles.tutorialStage}>
        <div className={`${styles.tutorialFrame} ${styles.tutorialDesktop}`}>
          <video
            className={styles.tutorialVideo}
            controls
            playsInline
            preload="none"
            poster={VIDEOS.desktop.poster}
            aria-label={VIDEOS.desktop.label}
          >
            <source src={VIDEOS.desktop.src} type="video/mp4" />
            <track kind="captions" src={VIDEOS.desktop.captions} srcLang="pt-BR" label="Português" />
          </video>
        </div>
        <div className={`${styles.tutorialFrame} ${styles.tutorialMobile}`}>
          <video
            className={styles.tutorialVideo}
            controls
            playsInline
            preload="none"
            poster={VIDEOS.mobile.poster}
            aria-label={VIDEOS.mobile.label}
          >
            <source src={VIDEOS.mobile.src} type="video/mp4" />
            <track kind="captions" src={VIDEOS.mobile.captions} srcLang="pt-BR" label="Português" />
          </video>
        </div>
        <p className={styles.tutorialCaption}>
          ▶ Assista ao vídeo explicativo do download: no computador, o passo a
          passo do Windows; no celular, o do Android.
        </p>
      </div>
    </section>
  );
}
