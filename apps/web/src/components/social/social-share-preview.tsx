"use client";
/* eslint-disable @next/next/no-img-element -- authorized media preview */
import { useEffect, useRef, useState } from "react";
import { Play, Images } from "lucide-react";
import { api } from "@/lib/api";
import { mediaUrl, socialLink, type SocialPost } from "@/lib/social";
import { sharedSocialPostId } from "@/lib/social-stream-state";
import "./social-share-preview.css";
export function SocialSharePreview({ text }: { text: string }) {
  const id = sharedSocialPostId(text);
  return id ? <AuthorizedCard id={id} text={text} /> : null;
}
function AuthorizedCard({ id, text }: { id: string; text: string }) {
  const [post, setPost] = useState<SocialPost>(),
    [error, setError] = useState("");
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    let alive = true,
      visible = false,
      running = false;
    async function load() {
      if (!alive || !visible || running || document.hidden) return;
      running = true;
      try {
        const item = await api<SocialPost>(`/social/posts/${id}`, {
          cache: "no-store",
        });
        if (alive) {
          setPost(item);
          setError("");
        }
      } catch {
        if (alive) {
          setPost(undefined);
          setError("Publica\u00e7\u00e3o indispon\u00edvel.");
        }
      } finally {
        running = false;
      }
    }
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              visible = entries.some((entry) => entry.isIntersecting);
              if (visible) void load();
            },
            { rootMargin: "100px" },
          );
    if (observer && root.current) observer.observe(root.current);
    else {
      visible = true;
      void load();
    }
    const resume = () => void load(),
      logout = () => {
        setPost(undefined);
        setError("Publica\u00e7\u00e3o indispon\u00edvel.");
      };
    const timer = setInterval(resume, 30000);
    window.addEventListener("enturma-social_changed", resume);
    window.addEventListener("focus", resume);
    window.addEventListener("enturma-session-changed", logout);
    return () => {
      alive = false;
      observer?.disconnect();
      clearInterval(timer);
      window.removeEventListener("enturma-social_changed", resume);
      window.removeEventListener("focus", resume);
      window.removeEventListener("enturma-session-changed", logout);
    };
  }, [id]);
  const note = text
    .replace(/https:\/\/enturma-flax\.vercel\.app\/social\?[^\s<>]+/g, "")
    .trim();
  return (
    <article ref={root} className="shared-social-message">
      {note && <p>{note}</p>}
      {post ? (
        <a
          className="social-share-preview"
          href={socialLink("post", id)}
          aria-label={`Abrir ${post.kind === "CLIP" ? "Clip" : "publica\u00e7\u00e3o"} de ${post.name}`}
        >
          <strong>
            {post.name}
            <small>@{post.username}</small>
          </strong>
          {post.media[0] && (
            <div className="social-share-preview-art">
              <img
                src={mediaUrl(post.media[0].id, true)}
                alt=""
                loading="lazy"
                onError={() => {
                  setPost(undefined);
                  setError("Publica\u00e7\u00e3o indispon\u00edvel.");
                }}
              />
              {post.media[0].kind === "VIDEO" ? (
                <Play className="social-share-play" fill="currentColor" />
              ) : post.media.length > 1 ? (
                <Images className="social-share-stack" />
              ) : null}
            </div>
          )}
          {!!post.body && (
            <p>
              {post.body.slice(0, 180)}
              {post.body.length > 180 ? "\u2026" : ""}
            </p>
          )}
        </a>
      ) : (
        <small role="status">
          {error || "Carregando publica\u00e7\u00e3o\u2026"}
        </small>
      )}
    </article>
  );
}
