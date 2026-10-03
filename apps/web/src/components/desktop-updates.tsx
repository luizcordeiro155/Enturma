"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Download, RefreshCw, X } from "lucide-react";
import { useCallSession } from "./call-session-provider";
export type UpdateState = {
  status:
    | "idle"
    | "checking"
    | "available"
    | "downloading"
    | "ready"
    | "installing"
    | "error"
    | "current"
    | "unsupported";
  currentVersion: string;
  version?: string;
  progress: number;
  message?: string;
  downloadUrl?: string;
};
type MobileBridge = {
  setLightTheme?: (light: boolean) => void;
  installUpdate?: (downloadUrl: string) => void;
};
type AndroidRelease = {
  version: string;
  downloadUrl: string;
};
type DesktopBridge = {
  isDesktop: boolean;
  getInfo: () => Promise<{ version: string; platform: string }>;
  getUpdateState?: () => Promise<UpdateState>;
  onUpdateState?: (callback: (state: UpdateState) => void) => () => void;
  checkForUpdates: () => Promise<unknown>;
  installUpdate?: () => Promise<unknown>;
  openExternal: (url: string) => Promise<unknown>;
};
declare global {
  interface Window {
    enturmaDesktop?: DesktopBridge;
    EnturmaNative?: MobileBridge;
  }
}
export function isDesktop() {
  return (
    typeof window !== "undefined" &&
    (window.enturmaDesktop?.isDesktop === true ||
      /EnturmaDesktop\//.test(navigator.userAgent))
  );
}

export function isMobileApp() {
  return (
    typeof window !== "undefined" &&
    /EnturmaMobile\//.test(navigator.userAgent)
  );
}

export function isPwaApp() {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true ||
    document.referrer.startsWith("android-app://")
  );
}

export function isInstalledApp() {
  if (isDesktop() || isMobileApp() || isPwaApp()) return true;
  if (typeof window === "undefined") return false;
  try { return localStorage.getItem("enturma-pwa-installed") === "1"; }
  catch { return false; }
}
const androidUpdateOrigin =
  "https://enturma-android-download-v3-production.up.railway.app";
function mobileVersion() {
  if (typeof window === "undefined") return "0.0.0";
  return (
    navigator.userAgent.match(/EnturmaMobile\/(\d+\.\d+\.\d+)/)?.[1] ??
    "0.0.0"
  );
}
function isNewer(remote: string, current: string) {
  const a = remote.split(".").map(Number);
  const b = current.split(".").map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av !== bv) return av > bv;
  }
  return false;
}
const Context = createContext<{
  state: UpdateState | null;
  open: () => void;
  check: () => void;
}>({
  state: null,
  open: () => {},
  check: () => {},
});
export function useAppUpdateState() {
  return useContext(Context).state;
}
const labels: Record<UpdateState["status"], string> = {
  idle: "Atualizações",
  checking: "Verificando atualização…",
  available: "Nova versão disponível",
  downloading: "Baixando atualização",
  ready: "Atualização pronta",
  installing: "Reiniciando…",
  error: "Falha na atualização",
  current: "Você está atualizado",
  unsupported: "Atualizações do aplicativo",
};
export function DesktopUpdateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<UpdateState | null>(null),
    [open, setOpen] = useState(false);
  const [legacyWindows, setLegacyWindows] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const prompted = useRef("");
  const { session } = useCallSession();
  useEffect(() => {
    const bridge = window.enturmaDesktop;
    if (bridge) {
      let live = true;
      const receive = (next: UpdateState) => {
        if (!live) return;
        setState(next);
        if (next.status === "ready" && prompted.current !== next.version) {
          prompted.current = next.version ?? "";
          setOpen(true);
        }
      };
      if (bridge.getUpdateState)
        void bridge.getUpdateState().then(receive).catch(() => {});
      else
        void bridge
          .getInfo()
          .then((info) => {
            const legacy = info.platform === "win32";
            if (!live) return;
            setLegacyWindows(legacy);
            receive({
              status: "unsupported",
              progress: 0,
              currentVersion: info.version,
              message: legacy
                ? "Atualize o aplicativo antigo pelo instalador oficial para ativar as próximas atualizações automáticas."
                : "Use a página de downloads para atualizar este sistema.",
            });
            if (legacy) {
              try {
                if (sessionStorage.getItem("enturma-legacy-update") !== info.version) {
                  sessionStorage.setItem("enturma-legacy-update", info.version);
                  setOpen(true);
                }
              } catch {
                setOpen(true);
              }
            }
          })
          .catch(() => {});
      const unsubscribe = bridge.onUpdateState?.(receive);
      return () => {
        live = false;
        unsubscribe?.();
      };
    }

    if (!isMobileApp()) return;
    document.documentElement.dataset.enturmaUpdateUi = "web";
    let live = true;
    const currentVersion = mobileVersion();
    const check = async () => {
      try {
        const response = await fetch(
          androidUpdateOrigin + "/latest-android.json?ts=" + Date.now(),
          { cache: "no-store" },
        );
        if (!response.ok)
          throw new Error("Não foi possível verificar a atualização.");
        const release = (await response.json()) as AndroidRelease;
        if (
          !/^\d+\.\d+\.\d+$/.test(release.version) ||
          !release.downloadUrl?.startsWith(androidUpdateOrigin + "/")
        )
          throw new Error("Manifesto de atualização inválido.");

        if (!live) return;
        if (isNewer(release.version, currentVersion)) {
          const next: UpdateState = {
            status: "available",
            progress: 0,
            currentVersion,
            version: release.version,
            downloadUrl: release.downloadUrl,
            message:
              "Uma nova versão do Enturma para Android está pronta para instalar.",
          };
          setState((current) => {
            if (
              current?.status === "downloading" &&
              current.version === release.version
            )
              return current;
            return next;
          });
        } else {
          setState({
            status: "current",
            progress: 100,
            currentVersion,
            version: release.version,
          });
        }
      } catch (error) {
        if (!live) return;
        setState({
          status: "error",
          progress: 0,
          currentVersion,
          message: (error as Error).message,
        });
      }
    };
    const onCheck = () => void check();
    void check();
    const interval = window.setInterval(check, 15 * 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    window.addEventListener("enturma-mobile-update-check", onCheck);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      live = false;
      delete document.documentElement.dataset.enturmaUpdateUi;
      window.clearInterval(interval);
      window.removeEventListener("enturma-mobile-update-check", onCheck);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  useEffect(() => {
    if (!open || !dialog.current) return;
    const el = dialog.current;
    el.showModal();
    const previous = document.activeElement as HTMLElement | null;
    const animation =
      document.documentElement.dataset.reducedMotion === "true" ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
        ? undefined
        : el.animate(
            [
              { opacity: 0, transform: "translateY(15px)" },
              { opacity: 1, transform: "none" },
            ],
            { duration: 240 },
          );
    return () => {
      animation?.cancel();
      el.close();
      previous?.focus();
    };
  }, [open]);
  return (
    <Context.Provider
      value={{
        state,
        open: () => {
          if (
            isMobileApp() &&
            state?.status === "available" &&
            state.downloadUrl &&
            window.EnturmaNative?.installUpdate
          ) {
            window.EnturmaNative.installUpdate(state.downloadUrl);
            setState({
              ...state,
              status: "downloading",
              message:
                "Baixando atualização em segundo plano. Você pode continuar usando o Enturma.",
            });
            return;
          }
          if (isMobileApp() && state?.status === "downloading") return;
          setOpen(true);
        },
        check: () => {
          if (isMobileApp()) {
            window.dispatchEvent(new Event("enturma-mobile-update-check"));
            return;
          }
          void window.enturmaDesktop?.checkForUpdates().catch(() => {});
        },
      }}
    >
      {children}
      {open && state && !isMobileApp() && (
        <dialog
          ref={dialog}
          className="desktop-update-dialog"
          aria-labelledby="desktop-update-title"
          onCancel={() => setOpen(false)}
        >
          <header>
            <Download />
            <h2 id="desktop-update-title">{labels[state.status]}</h2>
            <button
              className="icon-control"
              aria-label="Fechar atualizador"
              onClick={() => setOpen(false)}
            >
              <X />
            </button>
          </header>
          <p>
            Instalada: {state.currentVersion}
            {state.version ? ` · Nova versão: ${state.version}` : ""}
          </p>
          {state.status === "downloading" && (
            <>
              <progress max={100} value={state.progress} />
              <p aria-live="polite">{state.progress}% baixado</p>
            </>
          )}
          {state.message && <p role="status">{state.message}</p>}
          {isMobileApp() && state.status === "available" ? (
            <>
              <p>
                Atualização Android {state.version} disponível. Recomendamos manter
                o Enturma atualizado para receber correções e novos recursos.
              </p>
              <div className="actions">
                <button
                  onClick={() => {
                    if (!state.downloadUrl) return;
                    if (window.EnturmaNative?.installUpdate) {
                      window.EnturmaNative.installUpdate(state.downloadUrl);
                      setState({
                        ...state,
                        status: "downloading",
                        message:
                          "Download iniciado. O Android pedirá sua confirmação para instalar a atualização.",
                      });
                    } else {
                      window.location.href = state.downloadUrl;
                    }
                  }}
                >
                  Atualizar agora
                </button>
                <button className="secondary" onClick={() => setOpen(false)}>
                  Depois
                </button>
              </div>
            </>
          ) : isMobileApp() && state.status === "downloading" ? (
            <>
              <p>
                O Android está baixando a atualização. Quando terminar, confirme
                a instalação mostrada pelo sistema.
              </p>
              <button className="secondary" onClick={() => setOpen(false)}>
                Continuar usando o Enturma
              </button>
            </>
          ) : legacyWindows ? (
            <>
              <p>
                O atualizador desta versão pode fechar sem concluir. Não é
                necessário excluir sua conta nem desinstalar o aplicativo.
              </p>
              <ol>
                <li>Baixe o instalador oficial abaixo.</li>
                <li>Feche o Enturma antigo e execute o arquivo baixado.</li>
                <li>
                  Abra o Enturma pelo novo atalho. Seus dados e sua conta
                  permanecem disponíveis.
                </li>
              </ol>
              {session && (
                <p>Finalize sua chamada antes de fechar o aplicativo.</p>
              )}
              <div className="actions">
                <button
                  onClick={() =>
                    void window.enturmaDesktop
                      ?.openExternal(
                        "https://enturma-desktop-download-v5-production.up.railway.app/Enturma-Windows.exe",
                      )
                      .catch((e) => setState({ ...state, message: e.message }))
                  }
                >
                  Baixar atualização oficial
                </button>
                <button className="secondary" onClick={() => setOpen(false)}>
                  Depois
                </button>
              </div>
            </>
          ) : state.status === "ready" ? (
            <>
              <p>
                A atualização foi baixada e verificada. O Enturma será fechado e
                aberto novamente.
              </p>
              {session && (
                <p>Sua chamada em andamento será encerrada ao reiniciar.</p>
              )}
              <div className="actions">
                <button
                  onClick={() => {
                    void window.enturmaDesktop?.installUpdate?.().catch((e) =>
                      setState({
                        ...state,
                        status: "error",
                        message: e.message,
                      }),
                    );
                  }}
                >
                  Atualizar e reiniciar
                </button>
                <button className="secondary" onClick={() => setOpen(false)}>
                  Depois
                </button>
              </div>
            </>
          ) : (
            <button
              disabled={["checking", "downloading", "installing"].includes(
                state.status,
              )}
              onClick={() => {
                if (isMobileApp()) {
                  window.dispatchEvent(new Event("enturma-mobile-update-check"));
                  return;
                }
                void window.enturmaDesktop
                  ?.checkForUpdates()
                  .catch((e) =>
                    setState({ ...state, status: "error", message: e.message }),
                  );
              }}
            >
              Verificar novamente
            </button>
          )}
        </dialog>
      )}
    </Context.Provider>
  );
}
export function DesktopUpdateButton() {
  const { state, open } = useContext(Context);
  const label = state
    ? `Atualizações: ${labels[state.status]}${state.status === "downloading" ? ` · ${state.progress}%` : ""}`
    : "Atualizações";
  return state ? (
    <button
      type="button"
      className={`icon-control desktop-update-icon ${state.status}`}
      aria-label={label}
      title={label}
      aria-haspopup={isMobileApp() ? undefined : "dialog"}
      onClick={open}
    >
      <RefreshCw size={20} aria-hidden="true" />
      {["available", "downloading", "ready"].includes(state.status) ? (
        <span className="app-update-dot" aria-hidden="true" />
      ) : null}
    </button>
  ) : null;
}

export function AppUpdateSettingsCard() {
  const { state, open, check } = useContext(Context);
  const card = useRef<HTMLElement>(null);
  const [attention, setAttention] = useState(false);
  const status = state?.status;
  const version = state?.version;

  useEffect(() => {
    if (!status || !isInstalledApp()) return;
    const requested =
      new URLSearchParams(window.location.search).get("update") === "1";
    const pending = ["available", "downloading", "ready"].includes(status);
    if (!requested || !pending) return;
    const reduced =
      document.documentElement.dataset.reducedMotion === "true" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const frame = window.requestAnimationFrame(() => {
      setAttention(true);
      const element = card.current;
      if (!element) return;
      element.scrollIntoView({
        behavior: reduced ? "auto" : "smooth",
        block: "center",
      });
      element.focus({ preventScroll: true });
      if (!reduced)
        element.animate(
          [
            { transform: "scale(.985)" },
            { transform: "scale(1.018)" },
            { transform: "scale(1)" },
          ],
          { duration: 760, easing: "cubic-bezier(.2,.9,.2,1)" },
        );
    });
    const clear = window.setTimeout(() => setAttention(false), 8000);
    const url = new URL(window.location.href);
    url.searchParams.delete("update");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(clear);
    };
  }, [status, version]);

  if (!state || !isInstalledApp()) return null;

  const mobile = isMobileApp();
  const available = state?.status === "available";
  const downloading = state?.status === "downloading";
  const current = state?.status === "current";
  const error = state?.status === "error";
  const busy = state?.status === "checking" || downloading || state?.status === "installing";

  return (
    <section
      ref={card}
      tabIndex={-1}
      className={`app-update-settings-card ${state?.status ?? "checking"}${attention ? " attention" : ""}`}
    >
      <div className="app-update-settings-icon" aria-hidden="true">
        <RefreshCw size={22} />
        {available || downloading || state?.status === "ready" ? (
          <span className="app-update-dot" />
        ) : null}
      </div>
      <div className="app-update-settings-copy">
        <strong>Atualização do aplicativo</strong>
        <span>
          {state
            ? labels[state.status]
            : "Verificando se há uma nova versão…"}
        </span>
        {state?.currentVersion ? (
          <small>
            Instalada: {state.currentVersion}
            {state.version ? ` · Disponível: ${state.version}` : ""}
          </small>
        ) : null}
        {state?.message ? <small>{state.message}</small> : null}
      </div>
      <div className="app-update-settings-actions">
        {mobile && available ? (
          <button type="button" onClick={open}>
            Atualizar agora
          </button>
        ) : mobile && downloading ? (
          <button type="button" disabled>
            Baixando…
          </button>
        ) : current ? (
          <button type="button" className="secondary" onClick={check}>
            Verificar novamente
          </button>
        ) : error ? (
          <button type="button" onClick={check}>
            Tentar novamente
          </button>
        ) : (
          <button type="button" className="secondary" disabled={busy} onClick={check}>
            {busy ? "Verificando…" : "Verificar atualização"}
          </button>
        )}
      </div>
    </section>
  );
}
