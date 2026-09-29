"use client";
import { ForumLinks } from "./forum-links";
import { useLiveRefresh } from "@/lib/live-updates";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, MessageCircle, ThumbsUp, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { UserIdentity, type PublicProfile } from "./user-identity";

type Highlight = PublicProfile & {
  authorId: string;
  title: string;
  excerpt: string;
  createdAt: string;
  likes: number;
  reactionCount: number;
  commentsCount: number;
};

export function ForumHighlights() {
  const [items, setItems] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true,
      running = false;
    async function refresh() {
      if (running) return;
      running = true;
      try {
        const posts = await api<Highlight[]>("/forum/highlights");
        if (active) {
          setItems(posts);
          setFailed(false);
        }
      } catch {
        if (active) setFailed(true);
      } finally {
        running = false;
        if (active) setLoading(false);
      }
    }
    void refresh();
    const visible = () => {
      if (!document.hidden) void refresh();
    };
    const timer = setInterval(visible, 60000);
    document.addEventListener("visibilitychange", visible);
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [attempt]);
  useLiveRefresh("forum_changed", async () => {
    try {
      setItems(await api<Highlight[]>("/forum/highlights"));
      setFailed(false);
    } catch {
      setFailed(true);
    }
  });

  return (
    <section className="home-forum" aria-labelledby="home-forum-title">
      <div className="section-heading">
        <h2 id="home-forum-title">Em destaque no fórum</h2>
        <Link href="/forum">
          Ver fórum <ArrowRight size={16} />
        </Link>
      </div>
      <p className="home-forum-caption">
        Conversas dos últimos 30 dias com mais curtidas e reações.
      </p>
      {loading ? (
        <p role="status">Buscando as conversas da comunidade…</p>
      ) : null}
      {failed ? (
        <div className="home-forum-notice" role="status">
          <p>Não foi possível atualizar os destaques.</p>
          <button
            className="secondary"
            onClick={() => {
              setLoading(true);
              setAttempt((v) => v + 1);
            }}
            disabled={loading}
          >
            Tentar novamente
          </button>
        </div>
      ) : null}
      {!loading && !failed && items.length === 0 ? (
        <div className="home-forum-empty">
          <MessageCircle size={28} />
          <div>
            <h3>A próxima boa conversa pode ser sua.</h3>
            <p>Compartilhe uma dúvida ou descoberta com a comunidade.</p>
            <Link href="/forum">
              Começar uma conversa <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      ) : null}
      <div className="home-forum-list">
        {items.map((item) => (
          <article key={item.id} className="home-forum-card">
            <header>
              <UserIdentity user={{ ...item, id: item.authorId }} />
              <time dateTime={item.createdAt}>
                {new Date(item.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                })}
              </time>
            </header>
            <Link href={`/forum/${item.id}`} className="home-forum-post">
              <h3>{item.title}</h3>
            </Link>
            <p className="home-forum-excerpt">
              <ForumLinks
                text={item.excerpt.replace(/```[^\n]*\n?|```/g, " ").trim()}
              />
            </p>
            <div className="home-forum-stats">
              <span>
                <ThumbsUp size={15} />
                {item.likes} {item.likes === 1 ? "curtida" : "curtidas"}
              </span>
              <span>
                <Sparkles size={15} />
                {item.reactionCount}{" "}
                {item.reactionCount === 1 ? "reação" : "reações"}
              </span>
              <Link href={`/forum/${item.id}`}>
                <MessageCircle size={15} />
                {item.commentsCount}{" "}
                {item.commentsCount === 1 ? "comentário" : "comentários"}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
