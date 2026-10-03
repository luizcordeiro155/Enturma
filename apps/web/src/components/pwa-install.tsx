"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Check, MoreVertical } from "lucide-react";
import { EnturmaAppIcon } from "./enturma-app-icon";
import styles from "./pwa-install.module.css";

type InstallChoice = {
  outcome: "accepted" | "dismissed";
  platform: string;
};

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<InstallChoice>;
}

type PwaPlatform = "android" | "ios" | "desktop";
type PwaState = "loading" | "installable" | "manual" | "installed";

type PwaContextValue = {
  state: PwaState;
  platform: PwaPlatform;
  install: () => Promise<boolean>;
};

const Context = createContext<PwaContextValue>({
  state: "loading",
  platform: "desktop",
  install: async () => false,
});

function platform(): PwaPlatform {
  if (typeof navigator === "undefined") return "desktop";
  if (/Android/i.test(navigator.userAgent)) return "android";
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) return "ios";
  return "desktop";
}

const PWA_INSTALLED_KEY = "enturma-pwa-installed";

export function isPwaMode() {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true ||
    document.referrer.startsWith("android-app://")
  );
}

export function isKnownPwaInstalled() {
  if (typeof window === "undefined") return false;
  if (isPwaMode()) return true;
  try { return localStorage.getItem(PWA_INSTALLED_KEY) === "1"; }
  catch { return false; }
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [state, setState] = useState<PwaState>("loading");
  const currentPlatform = useMemo(platform, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          // A aplicação continua funcionando normalmente sem cache offline.
        });
    }

    if (isKnownPwaInstalled()) {
      setState("installed");
      document.documentElement.dataset.pwaInstalled = "true";
      return;
    }

    const beforeInstall = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent;
      installEvent.preventDefault();
      setPromptEvent(installEvent);
      setState("installable");
    };

    const installed = () => {
      setPromptEvent(null);
      setState("installed");
      document.documentElement.dataset.pwaInstalled = "true";
      try { localStorage.setItem(PWA_INSTALLED_KEY, "1"); } catch {}
      window.dispatchEvent(new Event("enturma-pwa-installed"));
    };

    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", installed);

    const fallback = window.setTimeout(() => {
      setState((current) => (current === "loading" ? "manual" : current));
    }, 1400);

    return () => {
      window.clearTimeout(fallback);
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  const value = useMemo<PwaContextValue>(
    () => ({
      state,
      platform: currentPlatform,
      install: async () => {
        if (state === "installed") return true;
        if (!promptEvent) {
          setState("manual");
          return false;
        }

        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === "accepted") {
          setPromptEvent(null);
          setState("installed");
          document.documentElement.dataset.pwaInstalled = "true";
          try { localStorage.setItem(PWA_INSTALLED_KEY, "1"); } catch {}
          window.dispatchEvent(new Event("enturma-pwa-installed"));
          return true;
        }
        return false;
      },
    }),
    [currentPlatform, promptEvent, state],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePwaInstall() {
  return useContext(Context);
}

export function PwaInstallButton() {
  const { state, platform, install } = usePwaInstall();
  const [showHelp, setShowHelp] = useState(false);
  const [installing, setInstalling] = useState(false);

  const installed = state === "installed";
  const manual = state === "manual";

  async function startInstall() {
    setInstalling(true);
    try {
      const prompted = await install();
      if (!prompted && state !== "installed") setShowHelp(true);
    } finally {
      setInstalling(false);
    }
  }

  const manualCopy =
    platform === "ios"
      ? "No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início."
      : platform === "android"
        ? "No Chrome, abra o menu ⋮ e toque em Instalar app ou Adicionar à tela inicial."
        : "No Edge ou Chrome, use o ícone de instalar na barra de endereço ou abra o menu do navegador e escolha Instalar Enturma.";

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.install}
        disabled={installed || installing || state === "loading"}
        onClick={() => void startInstall()}
      >
        {installed ? <Check size={19} /> : <EnturmaAppIcon size={21} />}
        {installed
          ? "Enturma já está instalado"
          : installing
            ? "Abrindo instalação…"
            : "Instalar Enturma"}
      </button>

      {installed ? (
        <p className={styles.note}>
          O Enturma abre como aplicativo e continua usando a mesma conta.
        </p>
      ) : (
        <>
          <p className={styles.note}>
            Sem EXE ou APK: a instalação é feita pelo próprio navegador.
          </p>
          {manual ? (
            <button
              type="button"
              className={styles.helpButton}
              onClick={() => setShowHelp((value) => !value)}
            >
              <MoreVertical size={17} />
              Como instalar neste navegador
            </button>
          ) : null}
          {showHelp ? (
            <p className={styles.help} role="status">
              {manualCopy}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
