"use client";
/* eslint-disable @next/next/no-img-element -- local selected files and authenticated media */
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Camera,
  CloudUpload,
  Film,
  ImagePlus,
  Save,
  Send,
  Trash2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  defaultRecipe,
  exportDuration,
  mediaUrl,
  socialWrite,
  type SocialMedia,
  type VideoRecipe,
} from "@/lib/social";
import {
  emptySocialDraft,
  localSocialDraft,
  type SocialDraft,
  type DraftFile,
} from "@/lib/social-draft";
import { VideoEditor } from "./video-editor";
import { SocialCapture } from "./social-capture";
import { SocialDialog } from "./social-dialog";
import { StoryDecorations, StoryDecorationEditor } from "./story-decorations";
import { NavigationLink } from "../navigation-link";

type Portfolio = {
  username: string;
  publicProfile: boolean;
  projects: { id: string; name: string }[];
};

function LocalFile({
  item,
  changed,
  overlay,
}: {
  item: DraftFile;
  changed: (r: VideoRecipe) => void;
  overlay?: ReactNode;
}) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!item.file) return;
    const blob = URL.createObjectURL(item.file);
    const timer = setTimeout(() => setUrl(blob), 0);
    return () => {
      clearTimeout(timer);
      URL.revokeObjectURL(blob);
    };
  }, [item.file]);
  if (item.media?.state === "READY")
    return (
      <div className={overlay ? "social-story-stage" : "social-edit-stage"}>
        {item.media.kind === "VIDEO" ? (
          <video
            className="social-export-preview"
            controls
            playsInline
            preload="metadata"
            src={mediaUrl(item.id)}
            poster={mediaUrl(item.id, true)}
          />
        ) : (
          <img
            className="social-export-preview"
            alt="Mídia pronta para publicar"
            src={mediaUrl(item.id)}
          />
        )}
        {overlay}
      </div>
    );
  if (!url) return <p>Mídia salva. Consulte o processamento para continuar.</p>;
  if (item.recipe && item.duration)
    return (
      <VideoEditor
        url={url}
        sourceDuration={item.duration}
        value={item.recipe}
        onChange={changed}
        overlay={overlay}
      />
    );
  return (
    <div className={overlay ? "social-story-stage" : "social-edit-stage"}>
      <img
        className="social-export-preview"
        src={url}
        alt="Prévia da imagem escolhida"
      />
      {overlay}
    </div>
  );
}
async function videoDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const el = document.createElement("video"),
      url = URL.createObjectURL(file);
    let settled = false;
    const done = () => {
      settled = true;
      clearTimeout(timer);
      el.onloadedmetadata =
        el.ondurationchange =
        el.onseeked =
        el.onerror =
          null;
      el.removeAttribute("src");
      el.load();
      URL.revokeObjectURL(url);
    };
    const timer = setTimeout(() => {
      done();
      reject(new Error("Não foi possível ler a duração do vídeo."));
    }, 15000);
    const accept = (d: number) => {
      if (settled) return;
      done();
      if (!Number.isFinite(d) || d <= 0 || d > 3600)
        reject(new Error("Escolha um vídeo de até uma hora."));
      else resolve(d);
    };
    el.onloadedmetadata = () => {
      if (Number.isFinite(el.duration)) accept(el.duration);
      else {
        // MediaRecorder WebM may omit Duration. Seeking forces the browser to
        // inspect the final cluster without decoding/playing the whole recording.
        el.ondurationchange = () => {
          if (Number.isFinite(el.duration) && el.duration > 0)
            accept(el.duration);
        };
        el.onseeked = () =>
          accept(Number.isFinite(el.duration) ? el.duration : el.currentTime);
        el.currentTime = 3601;
      }
    };
    el.onerror = () => {
      done();
      reject(new Error("Formato de vídeo não suportado neste aparelho."));
    };
    el.preload = "metadata";
    el.src = url;
  });
}
export function SocialEditor({
  user,
  mediaEnabled,
  initialKind,
  published,
}: {
  user: string;
  mediaEnabled: boolean;
  initialKind: "POST" | "STORY" | "CLIP";
  published: () => void;
}) {
  const [draft, setDraft] = useState<SocialDraft | null>(null),
    [savedDrafts, setSavedDrafts] = useState<
      { id: string; body: string; kind: string }[]
    >([]);
  const [portfolio, setPortfolio] = useState<Portfolio>();
  const [portfolioError, setPortfolioError] = useState("");
  const [error, setError] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [capture, setCapture] = useState(false),
    [discard, setDiscard] = useState(false);
  const busyRef = useRef(false),
    alive = useRef(true),
    current = useRef(draft);
  useEffect(() => {
    current.current = draft;
  }, [draft]);
  useEffect(() => {
    alive.current = true;
    void localSocialDraft(user)
      .then((d) => {
        if (alive.current)
          setDraft(d ?? { ...emptySocialDraft(), kind: initialKind });
      })
      .catch(() => {
        if (alive.current) {
          setDraft({ ...emptySocialDraft(), kind: initialKind });
          setError(
            "Armazenamento local indisponível. Use Salvar rascunho antes de sair.",
          );
        }
      });
    void api<typeof savedDrafts>("/social/drafts", { cache: "no-store" })
      .then((r) => {
        if (alive.current) setSavedDrafts(r);
      })
      .catch(() => {});
    void api<Portfolio>("/portfolio/me", { cache: "no-store" })
      .then((value) => {
        if (alive.current) setPortfolio(value);
      })
      .catch(() => {
        if (alive.current)
          setPortfolioError(
            "Não foi possível carregar seus projetos. Você ainda pode informar um link.",
          );
      });
    return () => {
      alive.current = false;
    };
    // A view switch keeps the editor mounted, including its draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  useEffect(() => {
    // A new creation destination can change an empty editor without discarding work.
    const timer = setTimeout(
      () =>
        setDraft((d) =>
          d && !d.body && !d.files.length && !d.version
            ? { ...d, kind: initialKind }
            : d,
        ),
      0,
    );
    return () => clearTimeout(timer);
  }, [initialKind]);
  useEffect(() => {
    if (!draft) return;
    const timer = setTimeout(() => {
      void localSocialDraft(user, draft).catch(() =>
        setError(
          "Não foi possível guardar o rascunho neste aparelho. Salve-o na conta.",
        ),
      );
    }, 500);
    return () => clearTimeout(timer);
  }, [draft, user]);
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => {
      if (busyRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", unload);
    return () => window.removeEventListener("beforeunload", unload);
  }, []);
  useEffect(() => {
    if (
      !draft?.files.some(
        (f) =>
          f.media && ["QUEUED", "PROCESSING"].includes(f.media.state ?? ""),
      )
    )
      return;
    let pending = false;
    const timer = setInterval(() => {
      if (document.hidden || pending) return;
      pending = true;
      const draftId = current.current?.id;
      void Promise.all(
        (current.current?.files ?? []).map(async (f) =>
          f.media && ["QUEUED", "PROCESSING"].includes(f.media.state ?? "")
            ? {
                ...f,
                media: await api<SocialMedia>(`/social/media/${f.id}`, {
                  cache: "no-store",
                }),
              }
            : f,
        ),
      )
        .then((files) => {
          if (alive.current && current.current?.id === draftId) {
            setDraft((d) =>
              d && d.id === draftId
                ? {
                    ...d,
                    files: d.files.map((f) => {
                      const update = files.find((next) => next.id === f.id);
                      return update?.media ? { ...f, media: update.media } : f;
                    }),
                  }
                : d,
            );
            setStatus(
              files.every((f) => f.media?.state === "READY")
                ? "Exportação concluída. Confira a prévia final antes de publicar."
                : "Processando a mídia…",
            );
          }
        })
        .catch((e) => {
          if (alive.current) setError(e.message);
        })
        .finally(() => {
          pending = false;
        });
    }, 4000);
    return () => clearInterval(timer);
  }, [draft?.files]);
  async function choose(files: File[]) {
    if (!draft || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      setError("");
      const next: DraftFile[] = [];
      if (draft.files.length + files.length > (draft.kind === "POST" ? 10 : 1))
        throw new Error(
          draft.kind === "POST"
            ? "Use até 10 mídias por publicação."
            : "Use uma mídia por Story ou Clip.",
        );
      for (const file of files) {
        if (
          !/^(image\/(jpeg|png|webp|gif)|video\/)/.test(file.type) ||
          file.size > 128 * 1024 * 1024
        )
          throw new Error("Use imagem ou vídeo de até 128 MB.");
        if (draft.kind === "CLIP" && !file.type.startsWith("video/"))
          throw new Error("Escolha um vídeo para o Clip.");
        const duration = file.type.startsWith("video/")
          ? await videoDuration(file)
          : undefined;
        next.push({
          id: crypto.randomUUID(),
          file,
          duration,
          recipe: duration ? defaultRecipe(duration) : undefined,
        });
      }
      setDraft((d) => (d ? { ...d, files: [...d.files, ...next] } : d));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function save(exportMedia: boolean, publishAfter = false) {
    if (!draft || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    let work = { ...draft, files: [...draft.files] };
    let wasPublished = false;
    try {
      for (let i = 0; i < work.files.length; i++) {
        let item = work.files[i];
        if (!item.media || item.media.state === "UPLOADING") {
          if (!item.file)
            throw new Error(
              "Selecione novamente o arquivo original para retomar este envio.",
            );
          const state = await socialWrite<{
            receivedBytes: number;
            partCount: number;
            chunkBytes: number;
          }>(
            "/media",
            {
              id: item.id,
              kind: item.file.type.startsWith("video/") ? "VIDEO" : "IMAGE",
              size: item.file.size,
            },
            "POST",
          );
          for (
            let offset = state.receivedBytes, part = state.partCount;
            offset < item.file.size;
            offset += state.chunkBytes, part++
          ) {
            setStatus(`Enviando mídia ${i + 1} de ${work.files.length}`);
            setProgress(Math.round((offset / item.file.size) * 100));
            await api(`/social/media/${item.id}/parts/${part}`, {
              method: "PUT",
              headers: { "Content-Type": "application/octet-stream" },
              body: item.file.slice(offset, offset + state.chunkBytes),
            });
          }
          item = {
            ...item,
            media: await api<SocialMedia>(`/social/media/${item.id}`, {
              cache: "no-store",
            }),
          };
          work.files[i] = item;
        }
        if (
          exportMedia &&
          ["UPLOADING", "FAILED"].includes(item.media?.state ?? "")
        ) {
          if (
            item.recipe &&
            (exportDuration(item.recipe) > 90 ||
              item.recipe.cover >= exportDuration(item.recipe))
          )
            throw new Error("Revise a duração (até 90s) e a posição da capa.");
          work.files[i] = {
            ...item,
            media: await socialWrite<SocialMedia>(
              `/media/${item.id}/export`,
              { recipe: item.recipe ?? null },
              "POST",
            ),
          };
        }
      }
      const result = await socialWrite<{ version: number }>("/drafts", {
        ...work,
        mediaIds: work.files.map((f) => f.id),
        files: undefined,
      });
      work = { ...work, version: result.version };
      setSavedDrafts((old) => [
        { id: work.id, kind: work.kind, body: work.body },
        ...old.filter((d) => d.id !== work.id),
      ]);
      if (publishAfter) {
        const deadline = Date.now() + 120_000;
        for (let i = 0; i < work.files.length; i++) {
          let state = work.files[i].media;
          while (state?.state !== "READY") {
            if (state?.state === "FAILED")
              throw new Error(state.error || "Não foi possível processar a mídia. Seu rascunho foi salvo para tentar novamente.");
            if (Date.now() >= deadline)
              throw new Error("A mídia ainda está sendo processada. Seu rascunho está salvo; volte em instantes para publicar.");
            setStatus(`Preparando mídia ${i + 1} de ${work.files.length}…`);
            await new Promise<void>((resolve) => setTimeout(resolve, 2300));
            if (!alive.current) return;
            state = await api<SocialMedia>(`/social/media/${work.files[i].id}`, { cache: "no-store" });
            work.files[i] = { ...work.files[i], media: state };
          }
        }
        setStatus("Finalizando publicação…");
        await socialWrite(`/posts/${work.id}/publish`, { version: result.version }, "POST");
        await localSocialDraft(user, null).catch(() => {});
        setSavedDrafts((old) => old.filter((d) => d.id !== work.id));
        wasPublished = true;
        setDraft(emptySocialDraft());
        setStatus("Publicado no Enturma.");
        setProgress(100);
        published();
      } else {
        setStatus(
          exportMedia && work.files.some((f) => f.media?.state !== "READY")
            ? "Na fila de exportação. Você pode voltar ao Feed; o rascunho está salvo."
            : "Rascunho salvo na sua conta.",
        );
        setProgress(100);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      if (alive.current) {
        if (!wasPublished) setDraft(work);
        setBusy(false);
      }
      busyRef.current = false;
    }
  }
  async function publish() {
    if (!draft || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await socialWrite<{ version: number }>("/drafts", {
        ...draft,
        mediaIds: draft.files.map((f) => f.id),
        files: undefined,
      });
      const updated = { ...draft, version: result.version };
      setDraft(updated);
      await socialWrite(
        `/posts/${draft.id}/publish`,
        { version: result.version },
        "POST",
      );
      await localSocialDraft(user, null).catch(() => {});
      setSavedDrafts((old) => old.filter((d) => d.id !== draft.id));
      setDraft(emptySocialDraft());
      setStatus("Publicado no Enturma.");
      published();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function load(id: string) {
    try {
      const d = await api<
        Omit<SocialDraft, "files"> & { media: SocialMedia[] }
      >(`/social/drafts/${id}`, { cache: "no-store" });
      setDraft({
        ...d,
        projectUrl: d.projectUrl ?? "",
        files: d.media.map((m) => ({ id: m.id, media: m, recipe: m.recipe })),
      });
    } catch (e) {
      setError((e as Error).message);
    }
  }
  if (!draft) return <p role="status">Recuperando seu rascunho…</p>;
  const hasPendingMedia = draft.files.some((f) => f.media?.state !== "READY");
  const canPublish =
    Boolean(draft.body.trim() || draft.files.length > 0) &&
    (!draft.files.length || mediaEnabled) &&
    draft.files.every((f) => !!f.file || !!f.media) &&
    (draft.kind !== "CLIP" ||
      (draft.files.length === 1 &&
        (draft.files[0].media?.kind === "VIDEO" ||
          draft.files[0].file?.type.startsWith("video/"))));
  return (
    <section
      className="social-editor"
      aria-label="Central de criação"
    >
      <header className="social-section-heading">
        <div>
          <small>SEU PRÓXIMO ASSUNTO</small>
          <h2>Uma ideia merece companhia.</h2>
          <p>Crie, revise e compartilhe com a sua comunidade.</p>
        </div>
        <button
          className="text-button"
          onClick={() => setDiscard(true)}
          disabled={busy}
        >
          Novo rascunho
        </button>
      </header>
      <fieldset disabled={busy} className="social-editor-fields">
        <div className="social-segments" aria-label="Formato da publicação">
          {(["POST", "STORY", "CLIP"] as const).map((kind) => (
            <button
              key={kind}
              className="secondary"
              disabled={busy || draft.files.length > 0}
              aria-pressed={draft.kind === kind}
              onClick={() =>
                setDraft({
                  ...draft,
                  kind,
                  storyOverlays: kind === "STORY" ? draft.storyOverlays : [],
                })
              }
            >
              {kind === "POST"
                ? "Post"
                : kind === "STORY"
                  ? "Story · 24h"
                  : "Clip · até 90s"}
            </button>
          ))}
        </div>
        {!mediaEnabled && (
          <div className="social-media-status" role="status">
            <ImagePlus size={22} aria-hidden="true" />
            <div>
              <strong>Fotos e vídeos ainda não estão liberados</strong>
              <p>O armazenamento privado e o processamento de mídia precisam ser ativados na API do Enturma. Você pode publicar textos normalmente; os botões de mídia ficam indisponíveis até o servidor confirmar a ativação.</p>
            </div>
          </div>
        )}
        <div
          className="social-upload"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (mediaEnabled) void choose(Array.from(e.dataTransfer.files));
          }}
        >
          <ImagePlus size={26} />
          <strong>{mediaEnabled ? "Adicione fotos ou vídeos" : "Galeria temporariamente indisponível"}</strong>
          <span>Até 10 arquivos por post · 1 por Story ou Clip · 128 MB cada</span>
          <div className="social-row">
            <label className="social-file-button">
              Escolher mídia
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/*"
                multiple={draft.kind === "POST"}
                disabled={!mediaEnabled || busy}
                onChange={(e) => {
                  void choose(Array.from(e.target.files ?? []));
                  e.target.value = "";
                }}
              />
            </label>
            <button
              className="secondary"
              disabled={!mediaEnabled || busy || draft.files.length > 0}
              onClick={() => setCapture(true)}
            >
              <Camera size={18} /> Gravar
            </button>
          </div>
        </div>
        {draft.files.map((item, i) => (
          <div className="social-edit-media" key={item.id}>
            <div className="social-row">
              <strong>
                Mídia {i + 1}
                {item.media
                  ? ` · ${item.media.state === "READY" ? "Pronta" : item.media.state === "FAILED" ? "Falha no processamento" : "Em preparação"}`
                  : ""}
              </strong>
              {draft.files.length > 1 &&
                [-1, 1].map((delta) => (
                  <button
                    key={delta}
                    className="icon-control"
                    aria-label={`${delta < 0 ? "Antecipar" : "Adiar"} mídia ${i + 1}`}
                    disabled={
                      busy || i + delta < 0 || i + delta >= draft.files.length
                    }
                    onClick={() => {
                      const files = [...draft.files];
                      [files[i], files[i + delta]] = [
                        files[i + delta],
                        files[i],
                      ];
                      setDraft({ ...draft, files });
                    }}
                  >
                    {delta < 0 ? (
                      <ArrowLeft size={18} />
                    ) : (
                      <ArrowRight size={18} />
                    )}
                  </button>
                ))}
              <button
                className="icon-control"
                disabled={busy}
                aria-label={`Remover mídia ${i + 1}`}
                onClick={() => {
                  setDraft({
                    ...draft,
                    files: draft.files.filter((f) => f.id !== item.id),
                  });
                  if (item.media)
                    void socialWrite(
                      `/media/${item.id}`,
                      undefined,
                      "DELETE",
                    ).catch(() => {});
                }}
              >
                <Trash2 size={18} />
              </button>
            </div>
            <div className="social-edit-stage">
              <LocalFile
                item={item}
                overlay={
                  draft.kind === "STORY" ? (
                    <StoryDecorations items={draft.storyOverlays ?? []} />
                  ) : undefined
                }
                changed={(recipe) =>
                  setDraft({
                    ...draft,
                    files: draft.files.map((f) =>
                      f.id === item.id ? { ...f, recipe } : f,
                    ),
                  })
                }
              />
            </div>
            {item.media?.error && <p role="alert">{item.media.error}</p>}
          </div>
        ))}
        {draft.kind === "STORY" && (
          <>
            {!draft.files.length && (
              <div className="social-story-stage">
                <p className="social-story-text">{draft.body || "Seu Story"}</p>
                <StoryDecorations items={draft.storyOverlays ?? []} />
              </div>
            )}
            <StoryDecorationEditor
              items={draft.storyOverlays ?? []}
              change={(storyOverlays) => setDraft({ ...draft, storyOverlays })}
            />
          </>
        )}
        <label>
          O que você quer compartilhar?
          <textarea
            className="resize-none"
            value={draft.body}
            maxLength={4000}
            rows={4}
            placeholder="Uma descoberta, um projeto, uma pergunta… Use #assuntos e @pessoas."
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
          />
        </label>
        <div className="social-edit-controls">
          <label>
            Quem pode ver
            <select
              value={draft.visibility}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  visibility: e.target.value as SocialDraft["visibility"],
                })
              }
            >
              <option value="PUBLIC">Comunidade Enturma</option>
              <option value="FOLLOWERS">Meus seguidores</option>
            </select>
          </label>
          <label>
            Link do projeto ou portfólio
            <input
              type="url"
              placeholder="https://"
              maxLength={500}
              value={draft.projectUrl}
              onChange={(e) =>
                setDraft({ ...draft, projectUrl: e.target.value })
              }
            />
          </label>
        </div>
        <details>
          <summary>Vincular projeto do meu portfólio</summary>
          {portfolio?.publicProfile ? (
            <label>
              Projeto público
              <select
                value={
                  portfolio.projects.find(
                    (project) =>
                      draft.projectUrl ===
                      `https://enturma-flax.vercel.app/p/${encodeURIComponent(portfolio.username)}#projeto-${project.id}`,
                  )?.id ?? ""
                }
                onChange={(event) => {
                  const project = portfolio.projects.find(
                    (item) => item.id === event.target.value,
                  );
                  if (project)
                    setDraft({
                      ...draft,
                      projectUrl: `https://enturma-flax.vercel.app/p/${encodeURIComponent(portfolio.username)}#projeto-${project.id}`,
                    });
                }}
              >
                <option value="">Selecione um projeto</option>
                {portfolio.projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p>
              {portfolioError ||
                (portfolio
                  ? "Seu portfólio é privado. Torne-o público antes de compartilhar seus projetos."
                  : "Carregando projetos…")}
            </p>
          )}
          <NavigationLink href="/portfolio">
            Gerenciar meu portfólio
          </NavigationLink>
        </details>
        <p className="social-note">
          Publique apenas conteúdo que você tem autorização para compartilhar. A
          privacidade da sua conta prevalece sobre a opção Comunidade.
        </p>
        {error && (
          <p role="alert" className="social-error">
            {error}
          </p>
        )}
        <p role="status">{status}</p>
        {busy && (
          <progress
            value={progress}
            max={100}
            aria-label="Progresso do envio"
          />
        )}
        <footer className="social-row">
          <button
            className="secondary"
            disabled={busy}
            onClick={() => void save(false)}
          >
            <Save size={18} /> Salvar rascunho
          </button>
          {draft.files.some((f) => f.media?.state !== "READY") && (
            <button
              className="secondary"
              disabled={busy || !mediaEnabled}
              onClick={() => void save(true)}
            >
              <Film size={18} /> Exportar e revisar
            </button>
          )}
          <button disabled={busy || !canPublish} onClick={() => void (hasPendingMedia ? save(true, true) : publish())}>
            <Send size={18} /> {busy ? "Publicando…" : hasPendingMedia ? "Enviar e publicar" : "Publicar"}{" "}
            {!busy && !hasPendingMedia && (draft.kind === "STORY"
              ? "Story"
              : draft.kind === "CLIP"
                ? "Clip"
                : "Post")}
          </button>
        </footer>
        {!!savedDrafts.length && (
          <details>
            <summary>
              <CloudUpload size={16} /> Rascunhos salvos na conta
            </summary>
            {savedDrafts.map((d) => (
              <button
                className="secondary"
                key={d.id}
                disabled={busy}
                onClick={() => {
                  if (draft.body || draft.files.length) {
                    setError(
                      "Salve seu rascunho atual e use Novo rascunho antes de abrir outro.",
                    );
                    return;
                  }
                  void load(d.id);
                }}
              >
                {d.kind} · {d.body.slice(0, 70) || "Sem legenda"}
              </button>
            ))}
          </details>
        )}
      </fieldset>
      {capture && (
        <SocialCapture
          close={() => setCapture(false)}
          captured={(file) => void choose([file])}
        />
      )}
      {discard && (
        <SocialDialog
          title="Começar outro rascunho?"
          close={() => setDiscard(false)}
        >
          <div className="social-dialog-body">
            <p>
              Alterações que ainda não foram salvas na conta serão descartadas
              deste aparelho.
            </p>
            <div className="social-row">
              <button className="secondary" onClick={() => setDiscard(false)}>
                Continuar editando
              </button>
              <button
                onClick={() => {
                  setDraft(emptySocialDraft());
                  setDiscard(false);
                  setStatus("");
                }}
              >
                Descartar e começar
              </button>
            </div>
          </div>
        </SocialDialog>
      )}
    </section>
  );
}
