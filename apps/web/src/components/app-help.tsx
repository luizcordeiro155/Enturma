"use client";
import { useEffect, useRef, useState } from "react";
import { BookOpen, Send, Sparkles } from "lucide-react";
import { api, post } from "@/lib/api";
import { RichMessage } from "./rich-message";
import { profileEntrance } from "./profile-motion";
export function AppHelp() {
  const [available, setAvailable] = useState<boolean>();
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<
    { question: string; answer: string }[]
  >([]);
  const last = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let live = true;
    api<{ available: boolean }>("/help")
      .then((v) => {
        if (live) setAvailable(v.available);
      })
      .catch(() => {
        if (live) setAvailable(false);
      });
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (last.current) {
      const animation = profileEntrance(last.current);
      return () => animation?.cancel();
    }
  }, [messages]);
  async function send() {
    if (busy || !question.trim()) return;
    const input = question;
    setBusy(true);
    setError("");
    try {
      const result = await post<{ answer: string }>("/help", {
        question: input,
      });
      setMessages((old) => [
        ...old.slice(-7),
        { question: input, answer: result.answer },
      ]);
      setQuestion("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="app-help-card">
      <header>
        <span>
          <BookOpen size={28} />
        </span>
        <div>
          <small>MONITOR ENTURMA</small>
          <h2>Ajuda por IA</h2>
          <p>Encontre o caminho para usar o Enturma.</p>
        </div>
      </header>
      <div className="app-help-suggestions">
        {[
          "Como personalizar meu mural?",
          "Como entrar em uma sala por código?",
          "Como recuperar minhas conversas?",
          "Como funciona a segurança da carona?",
        ].map((q) => (
          <button
            type="button"
            key={q}
            className="secondary"
            onClick={() => setQuestion(q)}
          >
            {q}
          </button>
        ))}
      </div>
      <div
        className="app-help-conversation"
        role="log"
        aria-label="Respostas da ajuda"
      >
        {messages.map((m, i) => (
          <div key={i} ref={i === messages.length - 1 ? last : undefined}>
            <p className="app-help-question">{m.question}</p>
            <div className="app-help-answer">
              <Sparkles size={18} />
              <RichMessage text={m.answer} />
            </div>
          </div>
        ))}
      </div>
      {available === false && (
        <p role="status">
          A ajuda por IA está indisponível agora. O Guia do Enturma continua
          disponível no Início.
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <label>
          O que você quer fazer?
          <textarea
            value={question}
            maxLength={1200}
            rows={2}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Pergunte sobre um recurso do aplicativo…"
          />
        </label>
        <button disabled={busy || !available || !question.trim()}>
          <Send size={18} />
          {busy ? "Preparando resposta…" : "Perguntar"}
        </button>
      </form>
      {error && <p role="status">{error}</p>}
    </section>
  );
}
