"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Car,
  Check,
  GraduationCap,
  MessageCircle,
  Mic,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import styles from "@/app/start/start.module.css";

/** The public presentation uses local geometry and WAAPI; no video download blocks entry. */
export function StartExperience() {
  const router = useRouter();
  const root = useRef<HTMLElement>(null);
  const transition = useRef<Animation | null>(null);
  const [entering, setEntering] = useState(false);
  const [, navigate] = useTransition();
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const animations: Animation[] = [];
    const clear = () => {
      animations.splice(0).forEach((animation) => animation.cancel());
    };
    const animate = () => {
      clear();
      if (
        document.hidden ||
        media.matches ||
        document.documentElement.dataset.reducedMotion === "true"
      )
        return;
      root.current
        ?.querySelectorAll<HTMLElement>("[data-float]")
        .forEach((element, i) => {
          if (!element.animate) return;
          animations.push(
            element.animate(
              [
                { transform: "translateY(0)" },
                { transform: `translateY(${i % 2 ? -9 : 9}px)` },
                { transform: "translateY(0)" },
              ],
              {
                duration: 5000 + i * 900,
                iterations: Infinity,
                easing: "ease-in-out",
              },
            ),
          );
        });
    };
    animate();
    media.addEventListener("change", animate);
    document.addEventListener("visibilitychange", animate);
    return () => {
      clear();
      transition.current?.cancel();
      media.removeEventListener("change", animate);
      document.removeEventListener("visibilitychange", animate);
    };
  }, []);

  async function participate(event: React.MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    if (entering) return;
    setEntering(true);
    router.prefetch("/login");
    const panel =
      root.current?.querySelector<HTMLElement>(`[data-start-content]`);
    if (
      panel?.animate &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches &&
      document.documentElement.dataset.reducedMotion !== "true"
    ) {
      transition.current = panel.animate(
        [
          { opacity: 1, transform: "translateY(0) scale(1)" },
          { opacity: 0.45, transform: "translateY(-12px) scale(.985)" },
        ],
        {
          duration: 300,
          fill: "forwards",
          easing: "cubic-bezier(.22,1,.36,1)",
        },
      );
      await transition.current.finished.catch(() => {});
    }
    // Hold the final frame until React commits the next route, avoiding an exit flash.
    navigate(() => router.push("/login"));
  }

  return (
    <main ref={root} className={styles.page}>
      <header className={styles.header}>
        <Link
          href="/start"
          className={styles.brand}
          aria-label="Enturma, apresentação"
        >
          <BookOpen size={32} strokeWidth={1.7} />
          <span>
            enturma<span className={styles.dot}>.</span>
          </span>
        </Link>
        <nav aria-label="Apresentação">
          <a href="#descobrir" className={styles.discoverLink}>
            Conheça o Enturma
          </a>
          <Link href="/login" className={styles.login}>
            Entrar <ArrowRight size={16} />
          </Link>
        </nav>
      </header>
      <div data-start-content>
        <section className={styles.hero} aria-labelledby="start-title">
          <div className={styles.copy}>
            <h1 id="start-title">
              Sua faculdade.
              <br />
              Muito mais
              <br />
              <span>em companhia.</span>
            </h1>
            <p>
              Uma dúvida vira conversa. Uma conversa vira descoberta. Encontre
              sua turma e faça da vida acadêmica uma experiência compartilhada.
            </p>
            <div className={styles.actions}>
              <Link
                href="/login"
                onClick={participate}
                className={styles.participate}
                aria-busy={entering}
              >
                {entering ? "Vamos entrar…" : "Quero participar"}
                <ArrowRight size={21} />
              </Link>
              <Link href="/download" className={styles.download}>
                Baixar o aplicativo
              </Link>
            </div>
            <div className={styles.platforms}>
              <span>Web</span>
              <i />
              <span>Windows</span>
              <i />
              <span>Android</span>
            </div>
          </div>
          <div
            className={styles.world}
            aria-label="Estudar, conversar e compartilhar no Enturma"
          >
            <div className={styles.orbit} aria-hidden="true" />
            <div className={styles.study} data-float>
              <header>
                <span className={styles.roomIcon}>
                  <GraduationCap size={23} />
                </span>
                <div>
                  <strong>Uma matéria. Várias ideias.</strong>
                  <small>Seu espaço para aprender junto</small>
                </div>
                <span className={styles.liveDot} />
              </header>
              <div className={styles.book} aria-hidden="true">
                <div>
                  <BookOpen size={110} strokeWidth={1} />
                </div>
                <span className={styles.bookTab}>enturma.</span>
              </div>
              <div className={styles.roomPeople}>
                <span>Você</span>
                <span>Sua turma</span>
                <span>
                  <Plus size={14} />
                </span>
                <Mic size={17} />
              </div>
              <footer>
                <MessageCircle size={17} />
                <span>Onde as boas perguntas encontram companhia.</span>
              </footer>
            </div>
            <div className={styles.note} data-float>
              <Sparkles size={22} />
              <div>
                <strong>Seu caderno. Sua conversa.</strong>
                <span>Entenda suas fontes com o Enturma APP.</span>
              </div>
            </div>
            <div className={styles.ride} data-float>
              <Car size={23} />
              <span>
                O caminho também
                <br />
                <strong>pode ser junto.</strong>
              </span>
              <ArrowRight size={19} />
            </div>
            <div className={styles.bookmark} aria-hidden="true">
              <BookOpen size={25} />
            </div>
          </div>
        </section>
        <section
          id="descobrir"
          className={styles.discover}
          aria-labelledby="discover-title"
        >
          <div className={styles.discoverHeading}>
            <h2 id="discover-title">
              Mais conexão.
              <br />
              Do primeiro assunto ao próximo passo.
            </h2>
            <ArrowDown size={28} aria-hidden="true" />
          </div>
          <div className={styles.features}>
            <article>
              <Users size={24} />
              <h3>Encontre sua turma</h3>
              <p>
                Salas por matéria, conversas e chamadas para construir
                conhecimento em conjunto.
              </p>
            </article>
            <article>
              <BookOpen size={24} />
              <h3>Dê espaço às ideias</h3>
              <p>
                Reúna fontes nos Cadernos IA, tire dúvidas e apresente seus
                projetos no portfólio.
              </p>
            </article>
            <article>
              <Car size={24} />
              <h3>Vá além da aula</h3>
              <p>
                Conheça estudantes, compartilhe conquistas e combine caronas com
                sua comunidade.
              </p>
            </article>
          </div>
          <div className={styles.community}>
            <span>
              <Check size={19} /> Uma comunidade feita para estudantes.
            </span>
            <Link href="/login" onClick={participate}>
              Encontre seu lugar <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </div>
      <footer className={styles.footer}>
        <span>
          enturma. <span>Estude em companhia.</span>
        </span>
        <nav aria-label="Informações">
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/termos">Termos de uso</Link>
          <a href="/start/poster.png" target="_blank" rel="noreferrer">
            Imagem de apresentação
          </a>
        </nav>
      </footer>
    </main>
  );
}
