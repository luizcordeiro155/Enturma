"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BellOff, BookOpen, Brain, Clock3, Lock, Settings } from "lucide-react";
import {
  focusMode,
  nativeFocusSupport,
  requestNativeFocusPermission,
  syncNativeFocus,
  useFocusMode,
  type FocusState,
} from "@/lib/focus-mode";

const hour = (iso?: string) =>
  iso ? new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "";

/** Shown instead of the Social while the student is in class or studying with the AI. */
export function FocusBlock({ focus }: { focus: FocusState }) {
  const study = focus.kind === "STUDY";
  return (
    <section className="focus-block" aria-labelledby="focus-block-title">
      <div className="focus-block-card">
        <span className="focus-block-orb" aria-hidden>
          <Lock size={30} />
        </span>
        <span className="home-section-kicker">Modo foco</span>
        <h1 id="focus-block-title">O Enturma Social está pausado agora</h1>
        <p className="focus-block-reason">
          {study ? <Brain size={18} aria-hidden /> : <BookOpen size={18} aria-hidden />}
          <span>
            {study ? "Estudo com a IA" : "Aula"}
            {focus.title ? (
              <>
                {" "}
                de <strong>{focus.title}</strong>
              </>
            ) : null}
          </span>
        </p>
        {focus.until ? (
          <p className="focus-block-until">
            <Clock3 size={16} aria-hidden /> Volta às {hour(focus.until)}
          </p>
        ) : null}
        <p>
          Durante aulas e estudos com a IA, o Social e as notificações dele ficam em pausa para você manter o foco. Você
          pode desativar isso nas configurações do Enturma.
        </p>
        <div className="focus-block-actions">
          {study && focus.studyId ? (
            <Link className="button" href={`/study/${focus.studyId}`}>
              Voltar para a sala de estudo
            </Link>
          ) : (
            <Link className="button" href="/home#enturma-study">
              Ir para o Enturma Study
            </Link>
          )}
          <Link className="secondary focus-block-settings" href="/settings#modo-foco">
            <Settings size={16} aria-hidden /> Configurar modo foco
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Settings card: turn focus mode on or off and, on Android, allow silencing other apps. */
export function FocusModeSettings() {
  const { focus, setFocus } = useFocusMode();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [native, setNative] = useState({ supported: false, granted: false });
  useEffect(() => {
    const check = () => setNative(nativeFocusSupport());
    check();
    document.addEventListener("visibilitychange", check);
    return () => document.removeEventListener("visibilitychange", check);
  }, []);
  const enabled = focus?.enabled ?? true;
  return (
    <section className="focus-settings" id="modo-foco" aria-labelledby="focus-settings-title">
      <div className="focus-settings-head">
        <span className="focus-settings-icon" aria-hidden>
          <BellOff size={20} />
        </span>
        <div>
          <h2 id="focus-settings-title" className="section-heading">
            Modo foco nos estudos
          </h2>
          <p>
            Durante as aulas da sua agenda e os estudos com a IA, o Enturma Social fica pausado e as notificações dele
            esperam até você terminar.
          </p>
        </div>
      </div>
      <label className="focus-switch">
        <input
          type="checkbox"
          role="switch"
          checked={enabled}
          disabled={busy || !focus}
          onChange={async (event) => {
            const next = event.currentTarget.checked;
            setBusy(true);
            setError("");
            try {
              const state = await focusMode.set(next);
              setFocus(state);
              syncNativeFocus(state);
            } catch (cause) {
              setError((cause as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        />
        <span className="focus-switch-track" aria-hidden>
          <span />
        </span>
        <span>{enabled ? "Ativado" : "Desativado"}</span>
      </label>
      {focus?.blocked ? (
        <p className="focus-settings-now" role="status">
          Em foco agora{focus.title ? ` · ${focus.title}` : ""}
          {focus.until ? ` até ${hour(focus.until)}` : ""}.
        </p>
      ) : null}
      {native.supported ? (
        <div className="focus-settings-native">
          <p>
            <strong>No celular:</strong> com permissão, o Enturma ativa o “Não perturbe” do Android no período de foco.
            Ligações e mensagens de conversas, como o WhatsApp, continuam chegando.
          </p>
          {native.granted ? (
            <p className="focus-settings-granted">Permissão concedida.</p>
          ) : (
            <button type="button" className="secondary" onClick={requestNativeFocusPermission}>
              Permitir “Não perturbe”
            </button>
          )}
        </div>
      ) : null}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </section>
  );
}
