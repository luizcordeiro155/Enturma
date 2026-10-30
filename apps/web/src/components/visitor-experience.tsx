"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Car,
  GraduationCap,
  Home,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { EnturmaAppIcon } from "./enturma-app-icon";
import { PublicThemeControl } from "./public-theme-control";
import { isDesktop, isMobileApp } from "./desktop-updates";
import { playMotion } from "@/lib/motion";

export function VisitorLink({ className }: { className?: string }) {
  const [web, setWeb] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setWeb(!isDesktop() && !isMobileApp()), 0);
    return () => clearTimeout(timer);
  }, []);
  return web ? (
    <Link className={className} href="/visitante">
      Explorar como visitante <ArrowRight size={16} />
    </Link>
  ) : null;
}

const sections = [
  { id: "inicio", title: "Início", Icon: Home },
  { id: "catalogo", title: "Catálogo acadêmico", Icon: GraduationCap },
  { id: "salas", title: "Salas de estudo", Icon: Users },
  { id: "cadernos", title: "Cadernos IA", Icon: BookOpen },
  { id: "caronas", title: "Caronas", Icon: Car },
] as const;
type Section = (typeof sections)[number]["id"];
type Entry = { id: string; name: string };

export function VisitorExperience() {
  const [section, setSection] = useState<Section>("inicio");
  const [gate, setGate] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [resource, setResource] = useState("institutions");
  const [items, setItems] = useState<Entry[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const content = useRef<HTMLElement>(null);
  useEffect(() => {
    if (isDesktop() || isMobileApp()) window.location.replace("/home");
  }, []);
  useEffect(() => {
    if (section !== "catalogo") return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `/api/backend/catalog/${resource}?search=${encodeURIComponent(query)}&page=${page}`,
          { signal: controller.signal },
        );
        if (!response.ok)
          throw Error("O catálogo não está disponível agora. Tente novamente.");
        const data = await response.json();
        if (!controller.signal.aborted) {
          setItems(data.items);
          setHasMore(data.hasMore);
        }
      } catch (failure) {
        if (!controller.signal.aborted) setError((failure as Error).message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [section, resource, query, page]);
  useEffect(() => {
    if (!gate || !dialog.current) return;
    const element = dialog.current;
    element.showModal();
    const animation = playMotion(element, [
      { opacity: 0.5, transform: "translateY(16px) scale(.97)" },
      { opacity: 1, transform: "none" },
    ]);
    return () => {
      animation?.cancel();
      element.close();
    };
  }, [gate]);
  useEffect(() => {
    const animation =
      content.current &&
      playMotion(content.current, [
        { opacity: 0.65, transform: "translateY(8px)" },
        { opacity: 1, transform: "none" },
      ]);
    return () => animation?.cancel();
  }, [section]);
  function dismiss() {
    setGate(null);
    setSection("inicio");
  }
  return (
    <div className="visitor-shell">
      <header className="visitor-header">
        <Link href="/start" className="brand">
          <EnturmaAppIcon size={38} />
          enturma.
        </Link>
        <span>Modo visitante</span>
        <PublicThemeControl compact />
        <Link className="button" href="/login">
          Entrar
        </Link>
      </header>
      <nav className="visitor-nav" aria-label="Explorar o Enturma">
        {sections.map(({ id, title, Icon }) => (
          <button
            key={id}
            aria-current={section === id ? "page" : undefined}
            onClick={() =>
              id === "caronas" ? setGate("combinar uma carona") : setSection(id)
            }
          >
            <Icon size={21} />
            {title}
          </button>
        ))}
      </nav>
      <main ref={content} className="visitor-content">
        {section === "inicio" ? (
          <>
            <div className="visitor-welcome">
              <div>
                <h1>Seu próximo estudo começa aqui.</h1>
                <p>
                  Conheça o Enturma e explore o catálogo acadêmico. Sua conta
                  conecta você às conversas, aos cadernos e à sua turma.
                </p>
                <button
                  className="button"
                  onClick={() => setSection("catalogo")}
                >
                  Explorar o catálogo <ArrowRight size={18} />
                </button>
              </div>
              <Image
                width={1024}
                height={1024}
                src="/start/book-world.webp"
                alt="Livro aberto na identidade verde do Enturma"
              />
            </div>
            <section className="visitor-actions" aria-label="Participar">
              <button onClick={() => setGate("escolher suas matérias")}>
                Escolher minhas matérias <GraduationCap />
              </button>
              <button onClick={() => setGate("publicar na comunidade")}>
                Publicar na comunidade <Users />
              </button>
              <button onClick={() => setGate("personalizar seu perfil")}>
                Personalizar meu perfil <ShieldCheck />
              </button>
            </section>
          </>
        ) : section === "catalogo" ? (
          <>
            <h1>Encontre seu caminho.</h1>
            <p>
              Consulte instituições, cursos e matérias do catálogo público. Para
              escolher suas matérias, entre na sua conta.
            </p>
            <form
              className="visitor-search"
              onSubmit={(event) => {
                event.preventDefault();
                setPage(0);
                setQuery(search.trim());
              }}
            >
              <label>
                Consultar
                <select
                  value={resource}
                  onChange={(event) => {
                    setResource(event.target.value);
                    setPage(0);
                    setItems([]);
                  }}
                >
                  <option value="institutions">Instituições</option>
                  <option value="courses">Cursos</option>
                  <option value="subjects">Matérias</option>
                </select>
              </label>
              <label>
                Buscar no catálogo
                <input
                  value={search}
                  maxLength={100}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nome da instituição, curso ou matéria"
                />
              </label>
              <button className="button" type="submit">
                <Search size={18} />
                Buscar
              </button>
            </form>
            {loading ? (
              <p role="status">Consultando o catálogo…</p>
            ) : error ? (
              <p role="alert">{error}</p>
            ) : (
              <>
                <ul className="visitor-catalog">
                  {items.map((item) => (
                    <li key={item.id}>
                      <GraduationCap size={22} />
                      <strong>{item.name}</strong>
                      <button
                        className="secondary"
                        onClick={() =>
                          setGate(
                            "adicionar essa opção ao seu perfil acadêmico",
                          )
                        }
                      >
                        Tenho interesse <ArrowRight size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
                {!items.length && (
                  <p>Nenhum resultado encontrado. Experimente outro nome.</p>
                )}
                <div className="actions">
                  <button
                    className="secondary"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    <ArrowLeft size={16} />
                    Anterior
                  </button>
                  <span>Página {page + 1}</span>
                  <button
                    className="secondary"
                    disabled={!hasMore}
                    onClick={() => setPage(page + 1)}
                  >
                    Próxima <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <section className="visitor-feature">
            <EnturmaAppIcon size={72} />
            <h1>
              {section === "salas"
                ? "Aprender fica melhor junto."
                : "Uma conversa para cada descoberta."}
            </h1>
            <p>
              {section === "salas"
                ? "Nas salas, você conversa com estudantes, compartilha materiais e participa de chamadas para estudar. As conversas e os participantes ficam protegidos pelo acesso acadêmico."
                : "Nos Cadernos IA, reúna suas fontes e converse com o Enturma APP sobre os assuntos que está estudando. Seus cadernos são privados."}
            </p>
            <button
              className="button"
              onClick={() =>
                setGate(
                  section === "salas"
                    ? "participar de uma sala"
                    : "criar seu caderno",
                )
              }
            >
              {section === "salas"
                ? "Encontrar minha turma"
                : "Criar meu caderno"}
              <ArrowRight size={18} />
            </button>
          </section>
        )}
      </main>
      {gate && (
        <dialog
          ref={dialog}
          className="visitor-gate"
          aria-labelledby="visitor-gate-title"
          onCancel={dismiss}
        >
          <button
            className="icon-control visitor-close"
            aria-label="Voltar ao início"
            onClick={dismiss}
          >
            <X size={20} />
          </button>
          <EnturmaAppIcon size={64} />
          <h2 id="visitor-gate-title">Faça parte da turma.</h2>
          <p>Para {gate}, crie sua conta ou entre no Enturma.</p>
          <Link className="button wide" href="/register">
            Criar minha conta <ArrowRight size={18} />
          </Link>
          <Link className="button secondary wide" href="/login">
            Já tenho uma conta
          </Link>
          <button className="text-button" onClick={dismiss}>
            Continuar explorando o início
          </button>
        </dialog>
      )}
    </div>
  );
}
