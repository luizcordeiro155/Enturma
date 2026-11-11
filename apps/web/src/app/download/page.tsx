import Link from "next/link";
import { DownloadLink } from "@/components/download-link";
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
  ShieldAlert,
  FileCheck2,
  Fingerprint,
  Sparkles,
} from "lucide-react";
import { PwaInstallButton } from "@/components/pwa-install";
import { EnturmaAppIcon } from "@/components/enturma-app-icon";
import { DownloadIntegrity } from "@/components/download-integrity";
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
                <DownloadLink className={styles.primary} href={ANDROID_DOWNLOAD}>
                  <Download size={18} />
                  Baixar APK para Android
                </DownloadLink>
              </>
            ) : primaryPlatform === "windows" ? (
              <>
                <h2>Enturma para Windows</h2>
                <p>
                  Use o aplicativo Desktop com notificações nativas, destaque
                  na barra de tarefas e atualizador integrado.
                </p>
                <DownloadLink className={styles.primary} href={WINDOWS_DOWNLOAD}>
                  <Download size={18} />
                  Baixar EXE para Windows
                </DownloadLink>
              </>
            ) : (
              <>
                <h2>Escolha seu aplicativo</h2>
                <p>
                  O Enturma possui aplicativo dedicado para Windows e Android.
                  Escolha abaixo a versão do dispositivo que você usa.
                </p>
                <DownloadLink className={styles.primary} href={WINDOWS_DOWNLOAD}>
                  <Monitor size={18} />
                  Baixar para Windows
                </DownloadLink>
                <DownloadLink className={styles.secondary} href={ANDROID_DOWNLOAD}>
                  <Smartphone size={18} />
                  Baixar para Android
                </DownloadLink>
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
              <DownloadLink className={styles.betaLink} href={WINDOWS_DOWNLOAD}>
                <Download size={16} />
                Baixar Enturma para Windows (.EXE)
              </DownloadLink>
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
              <DownloadLink className={styles.betaLink} href={ANDROID_DOWNLOAD}>
                <Download size={16} />
                Baixar Enturma para Android (.APK)
              </DownloadLink>
            </article>
          </div>

          <small className={styles.betaNote}>
            A instalação pelo navegador continua disponível abaixo como uma
            segunda alternativa.
          </small>
        </section>

        <section className={styles.safetySection} aria-labelledby="safety-title">
          <div className={styles.safetyIntro}>
            <div className={styles.safetyHeading}>
              <ShieldAlert size={28} aria-hidden="true" />
              <div>
                <h2 id="safety-title">Instale com segurança</h2>
                <p>
                  O Enturma é distribuído diretamente pelos canais oficiais do
                  projeto. Entenda os alertas do sistema e confira o arquivo
                  antes de instalar no computador ou celular.
                </p>
              </div>
            </div>
            <div className={styles.safetyStatus}>
              <ShieldCheck size={20} aria-hidden="true" />
              <span>
                <strong>Assinatura de código do Windows ainda não confirmada.</strong>{" "}
                O objetivo é disponibilizar um instalador assinado futuramente,
                mas ainda não há data confirmada. Isso é diferente de uma
                licença do Windows ou da assinatura obrigatória de APKs Android.
              </span>
            </div>
          </div>

          <div className={styles.safetyPlatforms}>
            <article className={styles.safetyPlatform} aria-labelledby="windows-guide-title">
              <span className={styles.platformTitle}><Monitor size={21} aria-hidden="true" /> Windows · EXE</span>
              <h3 id="windows-guide-title">Por que o Windows pode mostrar um aviso?</h3>
              <p>
                O Microsoft Defender SmartScreen pode alertar quando um
                executável não tem assinatura digital de código reconhecida ou
                ainda não possui reputação suficiente. O aviso não comprova
                que o arquivo é malicioso, mas também não garante que seja seguro.
              </p>
              <div className={styles.windowsNotice} aria-label="Exemplo ilustrativo de alerta do Windows">
                <div className={styles.windowsNoticeTitle}><ShieldAlert size={22} aria-hidden="true" /> O Windows protegeu o computador</div>
                <p>O Microsoft Defender SmartScreen impediu a execução de um aplicativo não reconhecido.</p>
                <span>Mais informações</span>
                <small>Ilustração explicativa. A aparência real varia conforme a versão do Windows.</small>
              </div>
              <ol className={styles.guideSteps}>
                <li><strong>Baixe somente por esta página.</strong> Confira o domínio antes de baixar e evite instaladores enviados por terceiros.</li>
                <li><strong>Verifique o arquivo.</strong> Compare o SHA-256 abaixo com o resultado do PowerShell e confira o arquivo com seu antivírus.</li>
                <li><strong>Leia o aviso.</strong> Se a origem e o hash corresponderem, avalie a opção “Mais informações” e somente então prossiga se confiar no arquivo. Não desative o SmartScreen.</li>
              </ol>
              <p className={styles.commandLead}>No PowerShell, na pasta Downloads:</p>
              <code className={styles.commandLine}>Get-FileHash .\Enturma-Setup-*.exe -Algorithm SHA256</code>
              <small className={styles.platformFootnote}>Compare o campo Hash exibido com o SHA-256 oficial abaixo. Se forem diferentes, não execute o instalador.</small>
            </article>

            <article className={styles.safetyPlatform} aria-labelledby="android-guide-title">
              <span className={styles.platformTitle}><Smartphone size={21} aria-hidden="true" /> Android · APK</span>
              <h3 id="android-guide-title">Por que o Android pode pedir permissão?</h3>
              <p>
                Como o APK é obtido fora da Play Store, o Android pode solicitar
                autorização para instalar apps desta fonte e mostrar avisos
                do Play Protect. São proteções normais para instalações externas:
                verifique o arquivo e nunca ignore um alerta de ameaça detectada.
              </p>
              <div className={styles.androidNotice}>
                <FileCheck2 size={27} aria-hidden="true" />
                <div>
                  <strong>Instalação de fontes externas</strong>
                  <p>O navegador pode precisar de permissão específica para abrir um APK baixado.</p>
                </div>
              </div>
              <ol className={styles.guideSteps}>
                <li><strong>Baixe o APK oficial</strong> pelo botão do Enturma nesta página, usando conexão HTTPS.</li>
                <li><strong>Confira a integridade.</strong> Use o SHA-256 abaixo e, se disponível, um gerenciador de arquivos confiável que calcule hashes.</li>
                <li><strong>Abra o download.</strong> Se o Android pedir autorização, conceda somente ao navegador utilizado, após conferir origem e integridade.</li>
                <li><strong>Revogue a permissão depois.</strong> Não desative o Play Protect; se houver aviso de aplicativo nocivo, interrompa a instalação.</li>
              </ol>
              <small className={styles.platformFootnote}>O nome das opções muda conforme fabricante e versão do Android. A permissão é concedida ao aplicativo que abriu o APK, não a todos os apps.</small>
            </article>
          </div>
        </section>

        <section className={styles.verifySection} aria-labelledby="verify-download-title">
          <div className={styles.verifyHeader}>
            <Fingerprint size={25} aria-hidden="true" />
            <div>
              <h2 id="verify-download-title">Confira o arquivo antes de instalar</h2>
              <p>Os hashes vêm dos manifestos de distribuição do próprio Enturma e são atualizados para a versão disponível no servidor. Só instale quando o arquivo baixado corresponder.</p>
            </div>
          </div>
          <DownloadIntegrity />
          <div className={styles.verifyFooter}>
            <ShieldCheck size={18} aria-hidden="true" />
            <span>
              A correspondência de SHA-256 verifica a integridade em relação ao
              manifesto consultado, mas não prova, sozinha, que um programa é
              seguro. Se o navegador, o antivírus ou o sistema indicar ameaça,
              pare e procure orientação antes de prosseguir.{" "}
              <a href="https://github.com/luizcordeiro155/Enturma" target="_blank" rel="noopener noreferrer">Conheça o código-fonte oficial</a>.
            </span>
          </div>
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
