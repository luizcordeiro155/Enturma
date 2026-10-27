"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Car,
  Check,
  Globe,
  Monitor,
  Smartphone,
  Users,
} from "lucide-react";
import styles from "@/app/start/start.module.css";

/** The public presentation uses local geometry and WAAPI; no video download blocks entry. */
const features = [
  {
    id: "salas",
    label: "Salas de estudo",
    Icon: Users,
    title: "Encontre sua turma",
    text: "Salas por matéria, conversas e chamadas para construir conhecimento em conjunto.",
    details: ["Conversas", "Chamadas", "Materiais"],
  },
  {
    id: "cadernos",
    label: "Cadernos IA",
    Icon: BookOpen,
    title: "Dê espaço às ideias",
    text: "Reúna fontes nos Cadernos IA, tire dúvidas e apresente seus próprios projetos no portfólio.",
    details: ["Suas fontes", "Suas perguntas", "Novas descobertas"],
  },
  {
    id: "comunidade",
    label: "Vida acadêmica",
    Icon: Car,
    title: "Vá além da aula",
    text: "Conheça estudantes, compartilhe conquistas e combine caronas com sua comunidade.",
    details: ["Amizades", "Conquistas", "Caronas"],
  },
] as const;

export function StartExperience({
  displayClassName = "",
}: {
  displayClassName?: string;
}) {
  const router = useRouter();
  const root = useRef<HTMLElement>(null);
  const transition = useRef<Animation | null>(null);
  const [entering, setEntering] = useState(false);
  const [selected, setSelected] = useState(0);
  const featurePanel = useRef<HTMLDivElement>(null);
  const feature = features[selected];
  useEffect(() => {
    if (
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.reducedMotion === "true"
    )
      return;
    const animation = featurePanel.current?.animate(
      [
        { opacity: 0.55, transform: "translateY(8px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 240, easing: "cubic-bezier(.22,1,.36,1)" },
    );
    return () => animation?.cancel();
  }, [selected]);
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
                { transform: `translateY(${i % 2 ? -4 : 4}px)` },
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
    <main ref={root} className={`${styles.page} ${displayClassName}`}>
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
              <span>
                <Globe size={15} aria-hidden="true" /> Web
              </span>
              <span>
                <Monitor size={15} aria-hidden="true" /> Windows
              </span>
              <span>
                <Smartphone size={15} aria-hidden="true" /> Android
              </span>
            </div>
          </div>
          <figure className={styles.world}>
            <div className={styles.artMotion} data-float>
              <Image
                src="/start/book-world.webp"
                alt="Livro aberto com páginas que se encontram, lápis e balão de conversa em uma composição verde e lima."
                fill
                sizes="(max-width: 760px) 100vw, 50vw"
                preload
                className={styles.art}
              />
            </div>
            <div className={styles.artBrand} aria-hidden="true">
              <BookOpen size={23} strokeWidth={1.7} /> enturma.
            </div>
            <figcaption className={styles.artCaption}>
              <span>
                <strong>Uma matéria. Várias ideias.</strong>
                <span>Seu espaço para aprender junto.</span>
              </span>
              <BookOpen size={28} strokeWidth={1.4} aria-hidden="true" />
            </figcaption>
          </figure>
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
          <div
            className={styles.featureTabs}
            role="tablist"
            aria-label="Conheça os recursos"
          >
            {features.map(({ id, label, Icon }, index) => (
              <button
                key={id}
                id={`start-tab-${id}`}
                type="button"
                role="tab"
                aria-selected={selected === index}
                aria-controls="start-feature-panel"
                tabIndex={selected === index ? 0 : -1}
                onClick={() => setSelected(index)}
                onKeyDown={(event) => {
                  const offset =
                    event.key === "ArrowRight"
                      ? 1
                      : event.key === "ArrowLeft"
                        ? -1
                        : 0;
                  if (!offset && event.key !== "Home" && event.key !== "End")
                    return;
                  event.preventDefault();
                  const next =
                    event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? features.length - 1
                        : (index + offset + features.length) % features.length;
                  setSelected(next);
                  document
                    .getElementById(`start-tab-${features[next].id}`)
                    ?.focus();
                }}
              >
                <Icon size={20} aria-hidden="true" />
                <span>{label}</span>
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            ))}
          </div>
          <div
            ref={featurePanel}
            id="start-feature-panel"
            className={styles.featurePanel}
            role="tabpanel"
            aria-labelledby={`start-tab-${feature.id}`}
            tabIndex={0}
          >
            <h3>
              {feature.title}
              <span className={styles.dot}>.</span>
            </h3>
            <div>
              <p>{feature.text}</p>
              <ul>
                {feature.details.map((detail) => (
                  <li key={detail}>
                    <Check size={15} aria-hidden="true" />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
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
          <a href="/start/poster.png?v=2" target="_blank" rel="noreferrer">
            Imagem de apresentação
          </a>
        </nav>
      </footer>
    </main>
  );
}
