"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Check,
  ArrowRight,
  CircleHelp,
  Trophy,
  X,
  Users,
  MessageCircle,
  Sparkles,
  Bell,
  Accessibility,
  Car,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { post } from "@/lib/api";
import { playMotion } from "@/lib/motion";
import { useLiveRefresh } from "@/lib/live-updates";

type Journey = {
  steps: { key: string; completed: boolean; xp: number }[];
  completed: number;
  totalXp: number;
  level: number;
  xpAwarded: number;
  tutorialSeen: boolean;
};
const steps = [
  {
    title: "Escolha sua matéria",
    body: "Salve as matérias do seu perfil acadêmico.",
    action: "Escolher matérias",
    href: "/subjects",
  },
  {
    title: "Encontre sua turma",
    body: "Entre em uma sala ou crie a sua para estudar.",
    action: "Encontrar turma",
    href: "/home",
  },
  {
    title: "Aprenda em companhia",
    body: "Envie sua primeira mensagem em uma sala.",
    action: "Conversar na turma",
    href: "/rooms",
  },
];
const lessons = [
  {
    title: "Seu espaço, seu próximo passo",
    icon: Trophy,
    body: "O painel acompanha suas primeiras conquistas no Enturma. Faça as atividades de verdade e volte ao início para acompanhar os verificados.",
    tip: "20 XP pela matéria + 30 XP pela turma + 50 XP pela primeira mensagem. Cada recompensa é recebida uma única vez.",
    action: "Ver meu progresso",
    href: "/home",
  },
  {
    title: "Comece pelas suas matérias",
    icon: BookOpen,
    body: "Complete universidade, campus, curso e período no perfil acadêmico. Selecione as matérias que está estudando para encontrar conteúdo e colegas do mesmo assunto.",
    tip: "Você pode revisar sua seleção em Minhas matérias. Os jogos de programação aparecem para quem estuda cursos ou matérias de TI.",
    action: "Escolher minhas matérias",
    href: "/subjects",
  },
  {
    title: "Encontre companhia para estudar",
    icon: Users,
    body: "No Início, veja as salas abertas, filtre por assunto e encontre universidades, cursos e disciplinas no catálogo. Estudar agora ajuda você a criar uma sessão com matéria, assunto e duração.",
    tip: "Não encontrou uma sala? Crie a sua e compartilhe o estudo com outros estudantes.",
    action: "Ver salas no Início",
    href: "/home",
  },
  {
    title: "Converse, participe e compartilhe",
    icon: MessageCircle,
    body: "Na sala, use Conversa para enviar uma dúvida ou imagem. Em Chamada, ative seu microfone, câmera ou compartilhe a tela. Materiais reúne as fontes da turma e Enturma AI ajuda a revisá-las.",
    tip: "Envie sua primeira mensagem para concluir a jornada. Use @usuario para mencionar alguém; as permissões de câmera e microfone são opcionais.",
    action: "Ver minhas turmas",
    href: "/rooms",
  },
  {
    title: "Continue a conversa no fórum",
    icon: MessageCircle,
    body: "Publique dúvidas, procure discussões por assunto, comente e reaja. O início mostra publicações em destaque e o fórum recebe novidades automaticamente.",
    tip: "Links externos mostram o endereço e pedem sua confirmação antes de abrir outra página.",
    action: "Abrir o fórum",
    href: "/forum",
  },
  {
    title: "Transforme fontes em estudo",
    icon: Sparkles,
    body: "Nos Cadernos IA, organize documentos, links e imagens do assunto. Peça explicações, resumos ou questões e confira as fontes citadas para revisar o que aprendeu.",
    tip: "Escolha um assunto por caderno e faça perguntas específicas sobre os materiais adicionados.",
    action: "Conhecer os cadernos",
    href: "/notebooks",
  },
  {
    title: "Mantenha seus colegas por perto",
    icon: Car,
    body: "Em Amigos, adicione colegas e converse no privado. Em Caronas, ofereça ou solicite uma viagem e acompanhe a busca enquanto navega pelo app.",
    tip: "Depois do aceite da carona, combine os detalhes na conversa do match. Os chats privados entre amigos usam criptografia de ponta a ponta.",
    action: "Encontrar amigos",
    href: "/friends",
  },
  {
    title: "Acompanhe sem precisar recarregar",
    icon: Bell,
    body: "O sino reúne curtidas, respostas, menções e mensagens. Clique no aviso para ir ao conteúdo, marque tudo como lido ou limpe a caixa quando quiser.",
    tip: "Se você já está no chat, a mensagem é destacada ali, sem aumentar o contador de notificações.",
    action: "Voltar ao início",
    href: "/home",
  },
  {
    title: "Deixe o Enturma confortável para você",
    icon: Accessibility,
    body: "Ao lado do sino, escolha o tema claro, escuro ou do sistema. Em Acessibilidade, ajuste o tamanho do texto, o contraste, o foco e o movimento reduzido.",
    tip: "Você pode sair do guia a qualquer momento e reabri-lo em Seu espaço de estudo. Agora é só dar o primeiro passo.",
    action: "Começar a estudar",
    href: "/home",
  },
];
export function StudyJourney({ enrolled }: { enrolled: boolean }) {
  const [data, setData] = useState<Journey>();
  const [error, setError] = useState("");
  const [guide, setGuide] = useState(false);
  const [reward, setReward] = useState(0);
  const panel = useRef<HTMLElement>(null);
  const mounted = useRef(true),
    running = useRef(false);
  async function refresh() {
    if (running.current) return;
    running.current = true;
    try {
      const result = await post<Journey>("/study-journey/sync");
      if (!mounted.current) return;
      setData(result);
      setError("");
      if (result.xpAwarded) setReward(result.xpAwarded);
    } catch {
      if (mounted.current) setError("Não foi possível carregar seu progresso.");
    } finally {
      running.current = false;
    }
  }
  useEffect(() => {
    mounted.current = true;
    const timer = setTimeout(() => void refresh(), 0);
    return () => {
      mounted.current = false;
      clearTimeout(timer);
    };
  }, []);
  useLiveRefresh("notifications_changed", refresh, 15000);
  const completed = data?.completed;
  useEffect(() => {
    if (completed === undefined || !panel.current) return;
    const animations: (Animation | undefined)[] = [];
    for (const el of panel.current.querySelectorAll(".journey-check")) {
      animations.push(
        playMotion(
          el,
          [
            { transform: "scale(.6)", opacity: 0.3 },
            { transform: "scale(1)", opacity: 1 },
          ],
          { duration: 420 },
        ),
      );
    }
    const bar = panel.current.querySelector(".journey-meter-fill");
    if (bar)
      animations.push(
        playMotion(
          bar,
          [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
          { duration: 500 },
        ),
      );
    return () => animations.forEach((a) => a?.cancel());
  }, [completed]);
  useEffect(() => {
    if (!reward || !panel.current) return;
    const el = panel.current.querySelector(".journey-reward");
    const animation = el
      ? playMotion(
          el,
          [
            { opacity: 0, transform: "translateY(8px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 500 },
        )
      : undefined;
    return () => animation?.cancel();
  }, [reward]);
  async function dismiss() {
    try {
      await post("/study-journey/tutorial-seen");
      setData((old) => (old ? { ...old, tutorialSeen: true } : old));
    } catch {
      setError(
        "Não foi possível salvar a preferência do guia. Tente novamente.",
      );
    }
  }
  return (
    <aside
      ref={panel}
      className="study-guide study-journey"
      aria-labelledby="journey-title"
    >
      <div className="journey-heading">
        <h2 id="journey-title">Seu espaço de estudo</h2>
        <Trophy size={24} aria-hidden="true" />
      </div>
      <p className="journey-intro">
        Três passos para estudar em companhia. Até 100 XP para começar.
      </p>
      {error ? (
        <p role="alert">
          {error}{" "}
          <button className="text-button" onClick={() => void refresh()}>
            Tentar novamente
          </button>
        </p>
      ) : null}
      {!data && !error ? <p role="status">Carregando seu progresso…</p> : null}
      {data ? (
        <>
          <div className="journey-progress-label">
            <strong>{data.completed} de 3 concluídos</strong>
            <span>
              Nível {data.level} · {data.totalXp} XP
            </span>
          </div>
          <div
            className="journey-meter"
            role="progressbar"
            aria-label="Etapas concluídas"
            aria-valuenow={data.completed}
            aria-valuemin={0}
            aria-valuemax={3}
          >
            <span
              className="journey-meter-fill"
              style={{ width: `${(data.completed / 3) * 100}%` }}
            />
          </div>
          <ol className="journey-steps">
            {steps.map((step, i) => {
              const saved = data.steps[i],
                href = !enrolled && i === 0 ? "/onboarding" : step.href;
              return (
                <li key={step.title} className={saved.completed ? "done" : ""}>
                  <span
                    className="journey-marker"
                    aria-label={
                      saved.completed ? "Concluído" : `Etapa ${i + 1}`
                    }
                  >
                    {saved.completed ? (
                      <Check className="journey-check" size={21} />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                    <div className="journey-step-action">
                      <Link href={href}>
                        {saved.completed ? "Revisitar" : step.action}{" "}
                        <ArrowRight size={14} />
                      </Link>
                      <span>
                        {saved.completed ? "Recebido" : "+"} {saved.xp} XP
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          <div aria-live="polite" className="journey-result">
            {reward ? (
              <p className="journey-reward">
                <Sparkles size={17} /> +{reward} XP recebidos nesta jornada!
              </p>
            ) : null}
            {data.completed === 3 ? (
              <p className="journey-finished">
                <Check size={18} /> Jornada concluída. Bom estudo!
              </p>
            ) : null}
          </div>
          {!data.tutorialSeen ? (
            <div className="guide-welcome">
              <strong>Primeira vez por aqui?</strong>
              <p>
                Conheça as matérias, salas, conversas e recursos do Enturma com
                um guia passo a passo.
              </p>
              <button onClick={() => setGuide(true)}>
                Começar guia <ArrowRight size={16} />
              </button>
              <button className="text-button" onClick={() => void dismiss()}>
                Agora não
              </button>
            </div>
          ) : null}
        </>
      ) : null}
      <button
        className="text-button journey-help"
        onClick={() => setGuide(true)}
      >
        <CircleHelp size={17} /> Guia do Enturma
      </button>
      {guide ? (
        <StudyTutorial
          onClose={() => {
            setGuide(false);
            void dismiss();
          }}
        />
      ) : null}
    </aside>
  );
}
function StudyTutorial({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null),
    body = useRef<HTMLDivElement>(null),
    title = useRef<HTMLHeadingElement>(null);
  const lesson = lessons[step],
    Icon = lesson.icon;
  useEffect(() => {
    const el = dialog.current!,
      previous = document.activeElement as HTMLElement | null;
    el.showModal();
    const animation = playMotion(el, [
      { opacity: 0.5, transform: "translateY(12px)" },
      { opacity: 1, transform: "none" },
    ]);
    return () => {
      animation?.cancel();
      el.close();
      previous?.focus();
    };
  }, []);
  useEffect(() => {
    title.current?.focus({ preventScroll: true });
    const animation = body.current
      ? playMotion(
          body.current,
          [
            { opacity: 0.3, transform: "translateX(10px)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 240 },
        )
      : undefined;
    return () => animation?.cancel();
  }, [step]);
  return (
    <dialog
      ref={dialog}
      className="study-tutorial"
      aria-labelledby="tutorial-title"
      onCancel={onClose}
    >
      <header>
        <strong>Guia do Enturma</strong>
        <button
          className="icon-control"
          aria-label="Fechar guia"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </header>
      <div
        className="tutorial-progress"
        aria-label={`Passo ${step + 1} de ${lessons.length}`}
      >
        {lessons.map((l, i) => (
          <button
            key={l.title}
            aria-label={`Passo ${i + 1}: ${l.title}`}
            aria-current={step === i ? "step" : undefined}
            onClick={() => setStep(i)}
            className={i <= step ? "reached" : ""}
          />
        ))}
      </div>
      <div ref={body} className="tutorial-body">
        <Icon size={36} aria-hidden="true" />
        <p className="tutorial-count">
          Passo {step + 1} de {lessons.length}
        </p>
        <h2 ref={title} tabIndex={-1} id="tutorial-title">
          {lesson.title}
        </h2>
        <p>{lesson.body}</p>
        <p className="tutorial-tip">{lesson.tip}</p>
        <Link className="tutorial-action" href={lesson.href} onClick={onClose}>
          {lesson.action} <ArrowRight size={17} />
        </Link>
      </div>
      <footer>
        <button
          className="secondary"
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
        >
          <ChevronLeft size={17} /> Anterior
        </button>
        <button
          onClick={() =>
            step === lessons.length - 1 ? onClose() : setStep(step + 1)
          }
        >
          {step === lessons.length - 1 ? "Concluir guia" : "Próximo"}
          <ChevronRight size={17} />
        </button>
      </footer>
      <button className="text-button tutorial-skip" onClick={onClose}>
        Explorar por conta própria
      </button>
    </dialog>
  );
}
