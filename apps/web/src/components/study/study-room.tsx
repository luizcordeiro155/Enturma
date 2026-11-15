"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarPlus,
  Check,
  CheckCircle2,
  Clock3,
  ListChecks,
  LoaderCircle,
  RotateCcw,
  SendHorizontal,
  Sparkles,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { Shell } from "../shell";
import { StudyAnswer } from "../study-notebooks";
import { ComposerMedia } from "../composer-media";
import {
  isMobileTextEntryContext,
  resizeMessageComposerTextarea,
  setNativeChatComposerFocused,
} from "@/lib/native-chat-ime";
import {
  PERSONALITIES,
  study,
  tutorGreeting,
  type QuizGrade,
  type StudyMessage,
  type StudyRoom as Room,
  type TutorPersonality,
} from "@/lib/study";

const busyStatus = (message: StudyMessage) => message.status === "PENDING" || message.status === "PROCESSING";
const newId = () => crypto.randomUUID();
const pad = (value: number) => String(value).padStart(2, "0");

/** The study room: the AI tutor, quizzes, and what to do once the session ends. */
export function StudyRoom({ id }: { id: string }) {
  const router = useRouter();
  const [room, setRoom] = useState<Room>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const end = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const follow = useRef(true);

  const load = useCallback(async () => {
    try {
      const next = await study.room(id);
      setRoom(next);
      setError("");
      return next;
    } catch (cause) {
      setError((cause as Error).message);
    }
  }, [id]);

  useEffect(() => () => setNativeChatComposerFocused(false), []);
  useEffect(() => {
    let alive = true;
    void study
      .room(id)
      .then((next) => alive && setRoom(next))
      .catch((cause: Error) => alive && setError(cause.message));
    return () => {
      alive = false;
    };
  }, [id]);

  const pending = room?.messages.some(busyStatus) ?? false;
  useEffect(() => {
    if (!pending) return;
    const timer = window.setInterval(() => void load(), 1500);
    return () => window.clearInterval(timer);
  }, [pending, load]);

  const active = room?.session.status === "ACTIVE";
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(timer);
  }, [active]);

  const count = room?.messages.length ?? 0;
  useEffect(() => {
    if (follow.current && count) end.current?.scrollIntoView?.({ block: "end", behavior: "smooth" });
  }, [count, pending]);

  async function act(action: () => Promise<unknown>, reload = true) {
    setBusy(true);
    setError("");
    try {
      await action();
      if (reload) await load();
      return true;
    } catch (cause) {
      setError((cause as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || busy || pending) return;
    follow.current = true;
    if (await act(() => study.message(id, newId(), text))) {
      setDraft("");
      requestAnimationFrame(() => resizeMessageComposerTextarea(field.current));
    }
  }

  const readyChats = room?.messages.filter((message) => message.kind === "CHAT" && message.status === "READY").length ?? 0;
  const lastQuiz = [...(room?.messages ?? [])].reverse().find((message) => message.kind === "QUIZ");
  const openQuiz = lastQuiz && lastQuiz.status === "READY" && !lastQuiz.attempt;

  const startedAt = room?.session.startedAt;
  const finishedAt = room?.session.finishedAt;
  const elapsed = startedAt
    ? Math.max(0, Math.round(((finishedAt ? Date.parse(finishedAt) : now) - Date.parse(startedAt)) / 60000))
    : 0;

  if (!room)
    return (
      <Shell>
        <section className="study-room study-room-loading" aria-busy={!error}>
          {error ? (
            <div className="study-room-intro">
              <h1>Sala indisponível</h1>
              <p role="alert">{error}</p>
              <Link className="button" href="/home#enturma-study">
                Voltar ao Enturma Study
              </Link>
            </div>
          ) : (
            <div className="study-room-skeleton" aria-label="Carregando sala de estudo">
              <span />
              <span />
              <span />
            </div>
          )}
        </section>
      </Shell>
    );

  const { session } = room;
  const personality = session.personality;
  const notebook = session.notebookId;

  return (
    <Shell>
      <section className="study-room" data-status={session.status} data-personality={personality}>
        <header className="study-room-head">
          <Link className="study-room-back" href="/home#enturma-study" aria-label="Voltar ao Enturma Study">
            <ArrowLeft size={18} aria-hidden />
          </Link>
          <div className="study-room-title">
            <span className="home-section-kicker">Sala de estudo</span>
            <h1>{session.subjectName}</h1>
            {session.goal ? <p>{session.goal}</p> : null}
          </div>
          <div className="study-room-meta">
            {session.status !== "PLANNED" && session.status !== "SKIPPED" ? (
              <span className="study-room-timer" aria-label={`${elapsed} de ${session.minutes} minutos`}>
                <Clock3 size={15} aria-hidden /> {Math.floor(elapsed / 60) ? `${Math.floor(elapsed / 60)}h${pad(elapsed % 60)}` : `${elapsed} min`}{" "}
                <small>/ {session.minutes} min</small>
              </span>
            ) : null}
            {session.status === "DONE" ? (
              <span className="study-room-pill done">
                <CheckCircle2 size={15} aria-hidden /> Concluída
              </span>
            ) : null}
          </div>
        </header>

        {session.status === "ACTIVE" || session.status === "DONE" ? (
          <div className="study-room-personality" role="radiogroup" aria-label="Jeito do tutor">
            {PERSONALITIES.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={personality === option.value}
                disabled={busy || session.status === "DONE"}
                title={option.hint}
                onClick={() =>
                  void act(() => study.personality(id, option.value as TutorPersonality))
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}

        {error && (
          <p role="alert" className="error study-room-error">
            {error}
          </p>
        )}

        {session.status === "PLANNED" || session.status === "SKIPPED" ? (
          <div className="study-room-intro">
            <span className="study-room-orb" aria-hidden>
              <Sparkles size={30} />
            </span>
            <h2>Pronto para estudar {session.subjectName}?</h2>
            <p>
              {session.minutes} minutos com um tutor de IA que pergunta sua dificuldade, explica no seu ritmo e, no final,
              monta um quiz para ver o que você aprendeu.
            </p>
            <div className="study-room-intro-actions">
              <button type="button" className="button" disabled={busy} onClick={() => void act(() => study.start(id))}>
                Começar estudo
              </button>
              {session.status === "PLANNED" ? (
                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={() =>
                    void act(async () => {
                      await study.skip(id);
                      router.push("/home#enturma-study");
                    }, false)
                  }
                >
                  Desistir desta vez
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <div
              className="study-room-chat"
              aria-live="polite"
              onScroll={(event) => {
                const node = event.currentTarget;
                follow.current = node.scrollHeight - node.scrollTop - node.clientHeight < 120;
              }}
            >
              <TutorBubble>
                <p>{tutorGreeting(personality, session.subjectName, session.goal)}</p>
              </TutorBubble>
              {room.messages.map((message) =>
                message.kind === "QUIZ" ? (
                  <QuizCard
                    key={message.id}
                    message={message}
                    sessionId={id}
                    disabled={busy || session.status !== "ACTIVE"}
                    graded={() => void load()}
                  />
                ) : (
                  <div key={message.id} className="study-room-turn">
                    <p className="study-room-student">{message.question}</p>
                    <TutorBubble pending={busyStatus(message)}>
                      {message.status === "READY" && message.answer ? (
                        <StudyAnswer content={message.answer} onCitation={() => undefined} />
                      ) : message.status === "FAILED" ? (
                        <p className="error">{message.error || "Não consegui responder agora. Tente de novo."}</p>
                      ) : null}
                    </TutorBubble>
                  </div>
                ),
              )}
              {session.status === "DONE" ? (
                <div className="study-room-done" role="status">
                  <Trophy size={34} aria-hidden />
                  <h2>Sessão concluída!</h2>
                  <p>
                    Obrigado por estudar comigo. Tudo o que vimos fica salvo neste caderno para você revisar quando
                    quiser.
                  </p>
                  <div className="study-room-intro-actions">
                    {notebook ? (
                      <Link className="button" href={`/notebooks/${notebook}`}>
                        <BookOpen size={16} aria-hidden /> Abrir caderno
                      </Link>
                    ) : null}
                    {confirmDelete ? (
                      <button
                        type="button"
                        className="danger"
                        disabled={busy}
                        onClick={() =>
                          void act(async () => {
                            await study.remove(id);
                            router.push("/home#enturma-study");
                          }, false)
                        }
                      >
                        <Trash2 size={16} aria-hidden /> Confirmar exclusão
                      </button>
                    ) : (
                      <button type="button" className="secondary" onClick={() => setConfirmDelete(true)}>
                        <Trash2 size={16} aria-hidden /> Excluir caderno
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
              {lastQuiz?.attempt && session.status === "ACTIVE" ? (
                <div className="study-room-next" role="group" aria-label="Próximo passo">
                  <p>
                    Vamos fechar essas lacunas: <strong>{lastQuiz.attempt.wrongTopics.join(", ") || "revisão"}</strong>.
                  </p>
                  <div className="study-room-intro-actions">
                    <button
                      type="button"
                      className="button"
                      disabled={busy || pending}
                      onClick={() =>
                        void act(() =>
                          study.message(
                            id,
                            newId(),
                            `Quero continuar agora e reforçar: ${lastQuiz.attempt!.wrongTopics.join(", ") || "os pontos que errei"}.`,
                          ),
                        )
                      }
                    >
                      <RotateCcw size={16} aria-hidden /> Continuar agora
                    </button>
                    <button type="button" className="secondary" disabled={busy} onClick={() => setScheduling((open) => !open)}>
                      <CalendarPlus size={16} aria-hidden /> Agendar outra aula
                    </button>
                  </div>
                  {scheduling && !scheduled ? (
                    <form
                      className="study-inline-form"
                      noValidate
                      onSubmit={(event) => {
                        event.preventDefault();
                        const data = new FormData(event.currentTarget);
                        const when = new Date(String(data.get("when")));
                        if (Number.isNaN(when.getTime()) || when.getTime() < Date.now()) {
                          setError("Esse horário já passou. Escolha um dia e horário a partir de agora.");
                          return;
                        }
                        void act(async () => {
                          await study.continueLater(
                            id,
                            when.toISOString(),
                            Number(data.get("minutes")),
                          );
                          setScheduled(true);
                        }, false);
                      }}
                    >
                      <label>
                        Quando
                        <input
                          name="when"
                          type="datetime-local"
                          required
                          min={localInput(new Date(now + 60000))}
                          defaultValue={tomorrowAt(session.startsAt)}
                        />
                      </label>
                      <label>
                        Duração
                        <select name="minutes" defaultValue={String(session.minutes)}>
                          {[15, 25, 30, 45, 60, 90, 120].map((minutes) => (
                            <option key={minutes} value={minutes}>
                              {minutes} min
                            </option>
                          ))}
                        </select>
                      </label>
                      <button type="submit" disabled={busy}>
                        Agendar
                      </button>
                    </form>
                  ) : null}
                  {scheduled ? (
                    <p className="study-room-scheduled" role="status">
                      <Check size={16} aria-hidden /> Próxima aula agendada no mesmo caderno. Vou te chamar na hora.
                    </p>
                  ) : null}
                </div>
              ) : null}
              <div ref={end} />
            </div>

            {session.status === "ACTIVE" ? (
              <form
                className="study-room-composer enturma-message-composer"
                onSubmit={(event) => void send(event)}
              >
                <div className="composer-main-row">
                  <button
                    type="button"
                    className="composer-icon-button study-room-quiz-button"
                    aria-label="Gerar quiz"
                    title={readyChats ? "Gerar quiz para avaliar o que você aprendeu" : "Converse com o tutor antes do quiz"}
                    disabled={busy || pending || !readyChats || Boolean(openQuiz)}
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => {
                      follow.current = true;
                      void act(() => study.quiz(id, newId()));
                    }}
                  >
                    <ListChecks size={20} aria-hidden />
                  </button>
                  <label className="composer-text-field">
                    <span className="sr-only">Mensagem para o tutor</span>
                    <textarea
                      ref={field}
                      aria-label="Mensagem para o tutor"
                      value={draft}
                      maxLength={2000}
                      rows={1}
                      enterKeyHint="enter"
                      placeholder={readyChats ? "Responda ao tutor…" : "Qual é a sua dificuldade?"}
                      onFocus={() => {
                        setNativeChatComposerFocused(true);
                        follow.current = true;
                        requestAnimationFrame(() => end.current?.scrollIntoView?.({ block: "end" }));
                      }}
                      onBlur={() => setNativeChatComposerFocused(false)}
                      onChange={(event) => {
                        setDraft(event.target.value);
                        resizeMessageComposerTextarea(event.currentTarget);
                      }}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          !event.shiftKey &&
                          !event.nativeEvent.isComposing &&
                          !isMobileTextEntryContext()
                        ) {
                          event.preventDefault();
                          void send();
                        }
                      }}
                    />
                  </label>
                  <ComposerMedia
                    disabled={busy}
                    onEmoji={(emoji) => setDraft((value) => (value + emoji).slice(0, 2000))}
                  />
                  <button
                    type="submit"
                    className="composer-send-button"
                    aria-label="Enviar"
                    disabled={busy || pending || !draft.trim()}
                    onPointerDown={(event) => event.preventDefault()}
                  >
                    {busy || pending ? <LoaderCircle size={20} className="spin" /> : <SendHorizontal size={20} />}
                  </button>
                </div>
              </form>
            ) : null}
          </>
        )}
      </section>
    </Shell>
  );
}

function localInput(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

/** Same time on the next day, never in the past. */
function tomorrowAt(iso: string) {
  const date = new Date(iso);
  date.setDate(date.getDate() + 1);
  const soon = Date.now() + 24 * 3600000;
  return localInput(date.getTime() < Date.now() ? new Date(soon) : date);
}

function TutorBubble({ pending = false, children }: { pending?: boolean; children?: React.ReactNode }) {
  return (
    <div className="study-room-tutor" data-pending={pending || undefined}>
      <span className="study-room-avatar" aria-hidden>
        <Sparkles size={16} />
      </span>
      <div className="study-room-bubble">
        {pending ? (
          <span className="study-room-typing" aria-label="O tutor está escrevendo">
            <i />
            <i />
            <i />
          </span>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function QuizCard({
  message,
  sessionId,
  disabled,
  graded,
}: {
  message: StudyMessage;
  sessionId: string;
  disabled: boolean;
  graded: () => void;
}) {
  const questions = message.quiz ?? [];
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    message.attempt ? message.attempt.answers : questions.map(() => null),
  );
  const [grade, setGrade] = useState<QuizGrade>();
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  if (busyStatus(message))
    return (
      <TutorBubble pending>
        <span />
      </TutorBubble>
    );
  if (message.status === "FAILED")
    return (
      <TutorBubble>
        <p className="error">{message.error || "Não consegui montar o quiz agora. Gere outro."}</p>
      </TutorBubble>
    );

  const done = Boolean(grade || message.attempt);
  const keyOf = (index: number) => (grade ? grade.results[index]?.answer : questions[index]?.answer);
  const score = grade?.score ?? message.attempt?.score;
  const total = grade?.total ?? message.attempt?.total ?? questions.length;

  return (
    <form
      className="study-quiz"
      data-done={done || undefined}
      onSubmit={async (event) => {
        event.preventDefault();
        if (answers.some((answer) => answer === null)) {
          setError("Responda todas as questões antes de enviar.");
          return;
        }
        setSending(true);
        setError("");
        try {
          setGrade(await study.answer(sessionId, message.id, answers));
          graded();
        } catch (cause) {
          setError((cause as Error).message);
        } finally {
          setSending(false);
        }
      }}
    >
      <header>
        <ListChecks size={18} aria-hidden />
        <div>
          <h3>Quiz da sessão</h3>
          <p>{done ? `Você acertou ${score} de ${total}.` : `${questions.length} questões para ver o que ficou.`}</p>
        </div>
        {done ? (
          <span className={`study-quiz-score ${score === total ? "perfect" : ""}`}>
            {score}/{total}
          </span>
        ) : null}
      </header>
      <ol>
        {questions.map((question, index) => {
          const key = keyOf(index);
          const chosen = answers[index];
          const explanation = grade?.results[index]?.explanation ?? question.explanation;
          return (
            <li key={index}>
              <fieldset disabled={done || disabled || sending}>
                <legend>
                  <small>{question.topic}</small>
                  {question.question}
                </legend>
                {question.options.map((option, optionIndex) => {
                  const state = !done
                    ? undefined
                    : optionIndex === key
                      ? "right"
                      : optionIndex === chosen
                        ? "wrong"
                        : undefined;
                  return (
                    <label key={optionIndex} className="study-quiz-option" data-state={state}>
                      <input
                        type="radio"
                        name={`${message.id}-${index}`}
                        checked={chosen === optionIndex}
                        onChange={() =>
                          setAnswers((current) => current.map((value, i) => (i === index ? optionIndex : value)))
                        }
                      />
                      <span>{option}</span>
                      {state === "right" ? <Check size={16} aria-label="Resposta certa" /> : null}
                      {state === "wrong" ? <X size={16} aria-label="Sua resposta" /> : null}
                    </label>
                  );
                })}
                {done && explanation ? <p className="study-quiz-explanation">{explanation}</p> : null}
              </fieldset>
            </li>
          );
        })}
      </ol>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {!done ? (
        <button type="submit" className="button" disabled={disabled || sending}>
          {sending ? "Corrigindo…" : "Enviar respostas"}
        </button>
      ) : null}
    </form>
  );
}
