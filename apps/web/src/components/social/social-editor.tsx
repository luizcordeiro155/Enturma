"use client";
/* eslint-disable @next/next/no-img-element -- local files and authenticated media */
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CloudUpload,
  Film,
  ImagePlus,
  Save,
  Send,
  Trash2,
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
import { prepareCover } from "@/lib/social-cover";
import { normalizeSocialGalleryFile } from "@/lib/social-gallery";
import { ImageEditor } from "./image-editor";
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
export type SocialEditorProgress = {
  state: "idle" | "working" | "done" | "error";
  message: string;
  percent: number;
};
type Step = "pick" | "edit" | "details";
const STEPS = [
  ["pick", "Escolher"],
  ["edit", "Editar"],
  ["details", "Detalhes"],
] as const;
function LocalFile({
  item,
  changed,
  overlay,
  coverChanged,
}: {
  item: DraftFile;
  changed: (recipe: VideoRecipe) => void;
  overlay?: ReactNode;
  coverChanged: (file: File | undefined) => void;
}) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!item.file) return;
    const blob = URL.createObjectURL(item.file),
      timer = setTimeout(() => setUrl(blob), 0);
    return () => {
      clearTimeout(timer);
      URL.revokeObjectURL(blob);
    };
  }, [item.file]);
  if (item.media?.state === "READY" && !item.file)
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
        )}{" "}
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
        coverFile={item.coverFile}
        onCoverFile={coverChanged}
      />
    );
  return (
    <ImageEditor
      url={url}
      value={item.recipe ?? { ...defaultRecipe(1), aspect: "4:5" }}
      onChange={changed}
      overlay={overlay}
    />
  );
}
async function videoDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const element = document.createElement("video"),
      url = URL.createObjectURL(file);
    let settled = false;
    const done = () => {
      settled = true;
      clearTimeout(timer);
      element.onloadedmetadata =
        element.ondurationchange =
        element.onseeked =
        element.onerror =
          null;
      element.removeAttribute("src");
      element.load();
      URL.revokeObjectURL(url);
    };
    const timer = setTimeout(() => {
      done();
      reject(new Error("Não foi possível ler a duração do vídeo."));
    }, 15000);
    const accept = (duration: number) => {
      if (settled) return;
      done();
      if (!Number.isFinite(duration) || duration <= 0 || duration > 3600)
        reject(new Error("Escolha um vídeo de até uma hora."));
      else resolve(duration);
    };
    element.onloadedmetadata = () => {
      if (Number.isFinite(element.duration)) accept(element.duration);
      else {
        element.ondurationchange = () => {
          if (Number.isFinite(element.duration) && element.duration > 0)
            accept(element.duration);
        };
        element.onseeked = () =>
          accept(
            Number.isFinite(element.duration)
              ? element.duration
              : element.currentTime,
          );
        element.currentTime = 3601;
      }
    };
    element.onerror = () => {
      done();
      reject(new Error("Formato de vídeo não suportado neste aparelho."));
    };
    element.preload = "metadata";
    element.src = url;
  });
}
export function SocialEditor({
  user,
  mediaEnabled,
  initialKind,
  published,
  onProgress,
}: {
  user: string;
  mediaEnabled: boolean;
  initialKind: "POST" | "STORY" | "CLIP";
  published: (kind: "POST" | "STORY" | "CLIP") => void;
  onProgress?: (progress: SocialEditorProgress) => void;
}) {
  const [draft, setDraft] = useState<SocialDraft | null>(null),
    [savedDrafts, setSavedDrafts] = useState<
      { id: string; body: string; kind: string }[]
    >([]);
  const [portfolio, setPortfolio] = useState<Portfolio>(),
    [portfolioError, setPortfolioError] = useState("");
  const [error, setError] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0);
  const [capture, setCapture] = useState(false),
    [discard, setDiscard] = useState(false),
    [step, setStep] = useState<Step>("pick");
  const busyRef = useRef(false),
    alive = useRef(true),
    current = useRef(draft),
    notify = useRef(onProgress),
    completed = useRef(published);
  useEffect(() => {
    current.current = draft;
    notify.current = onProgress;
    completed.current = published;
  }, [draft, onProgress, published]);
  const processing = Boolean(
    draft?.files.some(
      (file) =>
        file.media && ["QUEUED", "PROCESSING"].includes(file.media.state ?? ""),
    ),
  );
  useEffect(() => {
    notify.current?.({
      state: error
        ? "error"
        : busy || processing
          ? "working"
          : status
            ? "done"
            : "idle",
      message:
        error ||
        status ||
        (processing
          ? "Processando mídia…"
          : busy
            ? "Preparando publicação…"
            : ""),
      percent: progress,
    });
  }, [error, busy, processing, status, progress]);
  useEffect(() => {
    alive.current = true;
    void localSocialDraft(user)
      .then((value) => {
        if (alive.current) {
          const restored = value ?? {
            ...emptySocialDraft(),
            kind: initialKind,
          };
          setDraft(restored);
          if (restored.files.length) setStep("edit");
        }
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
      .then((value) => {
        if (alive.current) setSavedDrafts(value);
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
    // A view switch keeps the editor and its draft mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  useEffect(() => {
    const timer = setTimeout(
      () =>
        setDraft((value) =>
          value && !value.body && !value.files.length && !value.version
            ? { ...value, kind: initialKind }
            : value,
        ),
      0,
    );
    return () => clearTimeout(timer);
  }, [initialKind]);
  useEffect(() => {
    if (!draft) return;
    const timer = setTimeout(() => {
      void localSocialDraft(user, draft).catch(() => {
        if (alive.current)
          setError(
            "Não foi possível guardar o rascunho neste aparelho. Salve-o na conta.",
          );
      });
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
    if (!processing) return;
    let pending = false;
    const timer = setInterval(() => {
      if (document.hidden || pending || busyRef.current) return;
      pending = true;
      const id = current.current?.id;
      void Promise.all(
        (current.current?.files ?? []).map(async (file) =>
          file.media &&
          ["QUEUED", "PROCESSING"].includes(file.media.state ?? "")
            ? {
                ...file,
                media: await api<SocialMedia>(`/social/media/${file.id}`, {
                  cache: "no-store",
                }),
              }
            : file,
        ),
      )
        .then((files) => {
          if (!alive.current || current.current?.id !== id) return;
          setDraft((value) =>
            value && value.id === id
              ? {
                  ...value,
                  files: value.files.map((file) => {
                    const update = files.find((next) => next.id === file.id);
                    return update?.media
                      ? { ...file, media: update.media }
                      : file;
                  }),
                }
              : value,
          );
          const failed = files.find((file) => file.media?.state === "FAILED");
          if (failed) {
            setError(
              failed.media?.error ||
                "Não foi possível processar a mídia. Seu rascunho foi preservado.",
            );
            return;
          }
          setError("");
          if (files.every((file) => file.media?.state === "READY")) {
            setStatus(
              "Exportação concluída. Confira a prévia final antes de publicar.",
            );
            setProgress(100);
            setStep("details");
          } else setStatus("Processando a mídia…");
        })
        .catch((cause) => {
          if (alive.current) setError(cause.message);
        })
        .finally(() => {
          pending = false;
        });
    }, 4000);
    return () => clearInterval(timer);
  }, [processing]);
  async function choose(files: File[]) {
    if (!draft || busyRef.current || !files.length || !mediaEnabled) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      if (draft.files.length + files.length > (draft.kind === "POST" ? 10 : 1))
        throw new Error(
          draft.kind === "POST"
            ? "Use até 10 mídias por publicação."
            : "Use uma mídia por Story ou Clip.",
        );
      const next: DraftFile[] = [];
      for (const original of files) {
        const file = normalizeSocialGalleryFile(original);
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
          recipe: duration
            ? defaultRecipe(duration)
            : {
                ...defaultRecipe(1),
                aspect: draft.kind === "STORY" ? "9:16" : "4:5",
              },
        });
      }
      if (alive.current) {
        setDraft((value) =>
          value ? { ...value, files: [...value.files, ...next] } : value,
        );
        setStep("edit");
      }
    } catch (cause) {
      if (alive.current) setError((cause as Error).message);
    } finally {
      busyRef.current = false;
      if (alive.current) setBusy(false);
    }
  }
  async function saveCovers(files: DraftFile[]) {
    for (const item of files) {
      if (
        item.coverFile &&
        !item.coverUploaded &&
        item.media?.kind === "VIDEO" &&
        item.media.state === "READY"
      ) {
        setStatus("Salvando capa do v\u00eddeo\u2026");
        await api(`/social/media/${item.id}/cover`, {
          method: "PUT",
          headers: { "Content-Type": "image/jpeg" },
          body: await prepareCover(item.coverFile),
        });
        item.coverUploaded = true;
      }
    }
  }
  async function save(exportMedia: boolean, publishAfter = false) {
    if (!draft || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setProgress(0);
    setStatus("Salvando seu rascunho…");
    let work = { ...draft, files: [...draft.files] },
      wasPublished = false;
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
          if (
            !Number.isInteger(state.chunkBytes) ||
            state.chunkBytes <= 0 ||
            state.chunkBytes > 2 * 1024 * 1024
          )
            throw new Error(
              "O servidor retornou um tamanho de bloco inválido. Tente novamente.",
            );
          for (
            let offset = state.receivedBytes, part = state.partCount;
            offset < item.file.size;
            offset += state.chunkBytes, part++
          ) {
            if (!alive.current) return;
            setStatus(`Enviando mídia ${i + 1} de ${work.files.length}`);
            setProgress(
              Math.round(
                ((i + offset / item.file.size) / work.files.length) * 80,
              ),
            );
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
        mediaIds: work.files.map((file) => file.id),
        files: undefined,
      });
      work = { ...work, version: result.version };
      await localSocialDraft(user, work).catch(() => {});
      if (!alive.current) return;
      setSavedDrafts((previous) => [
        { id: work.id, kind: work.kind, body: work.body },
        ...previous.filter((value) => value.id !== work.id),
      ]);
      if (publishAfter) {
        const deadline = Date.now() + 120000;
        for (let i = 0; i < work.files.length; i++) {
          let state = work.files[i].media;
          while (state?.state !== "READY") {
            if (state?.state === "FAILED")
              throw new Error(
                state.error ||
                  "Não foi possível processar a mídia. Seu rascunho foi salvo para tentar novamente.",
              );
            if (Date.now() >= deadline)
              throw new Error(
                "A mídia ainda está sendo processada. Seu rascunho está salvo; volte em instantes para publicar.",
              );
            setStatus(`Preparando mídia ${i + 1} de ${work.files.length}…`);
            setProgress(80);
            await new Promise<void>((resolve) => setTimeout(resolve, 2300));
            if (!alive.current) return;
            state = await api<SocialMedia>(
              `/social/media/${work.files[i].id}`,
              { cache: "no-store" },
            );
            work.files[i] = { ...work.files[i], media: state };
          }
        }
        await saveCovers(work.files);
        setStatus("Finalizando publicação…");
        await socialWrite(
          `/posts/${work.id}/publish`,
          { version: result.version },
          "POST",
        );
        await localSocialDraft(user, null).catch(() => {});
        wasPublished = true;
        if (alive.current) {
          setSavedDrafts((previous) =>
            previous.filter((value) => value.id !== work.id),
          );
          setDraft({ ...emptySocialDraft(), kind: work.kind });
          setStep("pick");
          setStatus("Publicado no Enturma.");
          setProgress(100);
          window.dispatchEvent(
            new CustomEvent("enturma-social-published", {
              detail: { id: work.id, kind: work.kind },
            }),
          );
          completed.current(work.kind);
        }
      } else {
        setStatus(
          exportMedia &&
            work.files.some((file) => file.media?.state !== "READY")
            ? "Na fila de exportação. Você pode voltar ao Feed; o rascunho está salvo."
            : "Rascunho salvo na sua conta.",
        );
        setProgress(
          exportMedia &&
            work.files.some((file) => file.media?.state !== "READY")
            ? 80
            : 100,
        );
      }
    } catch (cause) {
      if (alive.current) setError((cause as Error).message);
    } finally {
      if (alive.current) {
        if (!wasPublished) setDraft(work);
        setBusy(false);
      }
      busyRef.current = false;
    }
  }
  async function load(id: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const value = await api<
        Omit<SocialDraft, "files"> & { media: SocialMedia[] }
      >(`/social/drafts/${id}`, { cache: "no-store" });
      if (alive.current) {
        setDraft({
          ...value,
          projectUrl: value.projectUrl ?? "",
          files: value.media.map((media) => ({
            id: media.id,
            media,
            recipe: media.recipe,
          })),
        });
        setStep(value.media.length ? "edit" : "details");
      }
    } catch (cause) {
      if (alive.current) setError((cause as Error).message);
    } finally {
      busyRef.current = false;
      if (alive.current) setBusy(false);
    }
  }
  async function remove(item: DraftFile) {
    if (!draft || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      if (item.media)
        await socialWrite(`/media/${item.id}`, undefined, "DELETE");
      if (alive.current)
        setDraft((value) =>
          value
            ? {
                ...value,
                files: value.files.filter((file) => file.id !== item.id),
              }
            : value,
        );
    } catch (cause) {
      if (alive.current) setError((cause as Error).message);
    } finally {
      busyRef.current = false;
      if (alive.current) setBusy(false);
    }
  }
  if (!draft) return <p role="status">Recuperando seu rascunho…</p>;
  const pending = draft.files.some((file) => file.media?.state !== "READY"),
    hasContent = !!draft.body.trim() || draft.files.length > 0;
  const canPublish =
    hasContent &&
    (!draft.files.length || mediaEnabled) &&
    draft.files.every((file) => !!file.file || !!file.media) &&
    (draft.kind !== "CLIP" ||
      (draft.files.length === 1 &&
        (draft.files[0].media?.kind === "VIDEO" ||
          draft.files[0].file?.type.startsWith("video/"))));
  const canAdvance =
    hasContent && (draft.kind !== "CLIP" || draft.files.length > 0);
  const submitLabel = pending
    ? "Enviar e publicar"
    : `Publicar ${draft.kind === "STORY" ? "Story" : draft.kind === "CLIP" ? "Clip" : "Post"}`;
  return (
    <section
      className="social-editor social-create-flow"
      aria-label="Central de criação"
      data-step={step}
    >
      <header className="social-create-heading">
        <h2>
          {step === "pick"
            ? "Nova publicação"
            : step === "edit"
              ? "Edite sua mídia"
              : "Pronto para compartilhar?"}
        </h2>
        <button
          className="text-button"
          disabled={busy}
          onClick={() => setDiscard(true)}
        >
          Novo rascunho
        </button>
      </header>
      <ol className="social-create-steps" aria-label="Etapas da publicação">
        {STEPS.map(([key, label], index) => (
          <li key={key} aria-current={step === key ? "step" : undefined}>
            <span>{index + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <div className="social-create-step-actions">
        {step !== "pick" && (
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={() =>
              setStep(
                step === "details" && draft.files.length ? "edit" : "pick",
              )
            }
          >
            <ArrowLeft size={18} />
            Voltar
          </button>
        )}
        {step !== "details" && (
          <button
            type="button"
            disabled={busy || !canAdvance}
            onClick={() =>
              setStep(
                step === "pick" && draft.files.length ? "edit" : "details",
              )
            }
          >
            Avançar
            <ArrowRight size={18} />
          </button>
        )}
      </div>
      <fieldset disabled={busy} className="social-editor-fields">
        <div hidden={step !== "pick"} className="social-create-pick">
          <div className="social-segments" aria-label="Formato da publicação">
            {(["POST", "STORY", "CLIP"] as const).map((kind) => (
              <button
                type="button"
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
              <ImagePlus size={22} />
              <div>
                <strong>Fotos e vídeos ainda não estão liberados</strong>
                <p>
                  O servidor precisa habilitar o armazenamento e o
                  processamento. Você ainda pode publicar textos.
                </p>
              </div>
            </div>
          )}
          <div
            className="social-upload"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (mediaEnabled)
                void choose(Array.from(event.dataTransfer.files));
            }}
          >
            <ImagePlus size={36} />
            <strong>
              {mediaEnabled
                ? "Adicione fotos ou vídeos"
                : "Galeria temporariamente indisponível"}
            </strong>
            <span>
              Até 10 arquivos por post · 1 por Story ou Clip · 128 MB cada
            </span>
            <div className="social-row">
              <label className="social-file-button">
                Escolher mídia
                <input
                  type="file"
                  accept={draft.kind === "CLIP" ? "video/*" : "image/*,video/*"}
                  multiple={draft.kind === "POST"}
                  disabled={!mediaEnabled || busy}
                  onChange={(event) => {
                    void choose(Array.from(event.target.files ?? []));
                    event.target.value = "";
                  }}
                />
              </label>
              {draft.kind !== "CLIP" && (
                <label className="social-file-button">
                  Fotos da galeria
                  <input
                    type="file"
                    accept="image/*"
                    multiple={draft.kind === "POST"}
                    disabled={!mediaEnabled || busy}
                    onChange={(event) => {
                      void choose(Array.from(event.target.files ?? []));
                      event.target.value = "";
                    }}
                  />
                </label>
              )}
              <button
                type="button"
                className="secondary"
                disabled={!mediaEnabled || busy || draft.files.length > 0}
                onClick={() => setCapture(true)}
              >
                <Camera size={18} />
                Gravar
              </button>
            </div>
          </div>
          {!!savedDrafts.length && (
            <details>
              <summary>
                <CloudUpload size={16} />
                Rascunhos salvos na conta
              </summary>
              {savedDrafts.map((saved) => (
                <button
                  className="secondary"
                  key={saved.id}
                  disabled={busy}
                  onClick={() => {
                    if (draft.body || draft.files.length) {
                      setError(
                        "Salve seu rascunho atual e use Novo rascunho antes de abrir outro.",
                      );
                      return;
                    }
                    void load(saved.id);
                  }}
                >
                  {saved.kind} · {saved.body.slice(0, 70) || "Sem legenda"}
                </button>
              ))}
            </details>
          )}
        </div>
        <div hidden={step !== "edit"} className="social-create-edit">
          {draft.files.map((item, index) => (
            <div className="social-edit-media" key={item.id}>
              <div className="social-row">
                <strong>
                  {`Mídia ${index + 1}`}
                  {item.media
                    ? ` · ${item.media.state === "READY" ? "Pronta" : item.media.state === "FAILED" ? "Falha no processamento" : "Em preparação"}`
                    : ""}
                </strong>
                {draft.files.length > 1 &&
                  [-1, 1].map((delta) => (
                    <button
                      type="button"
                      key={delta}
                      className="icon-control"
                      aria-label={`${delta < 0 ? "Antecipar" : "Adiar"} mídia ${index + 1}`}
                      disabled={
                        busy ||
                        index + delta < 0 ||
                        index + delta >= draft.files.length
                      }
                      onClick={() => {
                        const files = [...draft.files];
                        [files[index], files[index + delta]] = [
                          files[index + delta],
                          files[index],
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
                  type="button"
                  className="icon-control"
                  disabled={busy}
                  aria-label={`Remover mídia ${index + 1}`}
                  onClick={() => void remove(item)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="social-edit-stage">
                <LocalFile
                  item={item}
                  coverChanged={(coverFile) =>
                    setDraft(
                      (previous) =>
                        previous && {
                          ...previous,
                          files: previous.files.map((file) =>
                            file.id === item.id
                              ? { ...file, coverFile, coverUploaded: false }
                              : file,
                          ),
                        },
                    )
                  }
                  overlay={
                    draft.kind === "STORY" ? (
                      <StoryDecorations items={draft.storyOverlays ?? []} />
                    ) : undefined
                  }
                  changed={(recipe) =>
                    setDraft(
                      (previous) =>
                        previous && {
                          ...previous,
                          files: previous.files.map((file) =>
                            file.id === item.id
                              ? {
                                  ...file,
                                  recipe,
                                  ...(file.media?.state === "READY" && file.file
                                    ? {
                                        id: crypto.randomUUID(),
                                        media: undefined,
                                        coverUploaded: false,
                                      }
                                    : {}),
                                }
                              : file,
                          ),
                        },
                    )
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
                  <p className="social-story-text">
                    {draft.body || "Seu Story"}
                  </p>
                  <StoryDecorations items={draft.storyOverlays ?? []} />
                </div>
              )}
              <StoryDecorationEditor
                items={draft.storyOverlays ?? []}
                change={(storyOverlays) =>
                  setDraft({ ...draft, storyOverlays })
                }
              />
            </>
          )}
        </div>
        <label>
          O que você quer compartilhar?
          <textarea
            className="resize-none"
            value={draft.body}
            maxLength={4000}
            rows={3}
            placeholder="Escreva uma legenda… Use #assuntos e @pessoas."
            onChange={(event) =>
              setDraft({ ...draft, body: event.target.value })
            }
          />
        </label>
        <div hidden={step !== "details"} className="social-create-details">
          {!!draft.files.length && (
            <p className="social-note">
              {`${draft.files.length} arquivo${draft.files.length > 1 ? "s" : ""} selecionado${draft.files.length > 1 ? "s" : ""}.`}
              <button
                type="button"
                className="text-button"
                onClick={() => setStep("edit")}
              >
                Revisar mídia
              </button>
            </p>
          )}
          {draft.kind === "STORY" && !draft.files.length && (
            <button
              type="button"
              className="secondary"
              onClick={() => setStep("edit")}
            >
              Personalizar Story
            </button>
          )}
          <div className="social-edit-controls">
            <label>
              Quem pode ver
              <select
                value={draft.visibility}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    visibility: event.target.value as SocialDraft["visibility"],
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
                onChange={(event) =>
                  setDraft({ ...draft, projectUrl: event.target.value })
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
                      (value) => value.id === event.target.value,
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
        </div>
        <p className="social-note">
          {draft.visibility === "PUBLIC"
            ? "Visibilidade: Comunidade Enturma."
            : "Visibilidade: Meus seguidores."}{" "}
          A privacidade da conta prevalece. Publique apenas conteúdo que você
          tem autorização para compartilhar.
        </p>
        {error && (
          <p role="alert" className="social-error">
            {error}
          </p>
        )}
        {status && <p role="status">{status}</p>}
        {(busy || processing) && (
          <progress
            value={progress}
            max={100}
            aria-label="Progresso do envio"
          />
        )}
        <footer className="social-row social-create-publish-actions">
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={() => void save(false)}
          >
            <Save size={18} />
            Salvar rascunho
          </button>
          {pending && (
            <button
              type="button"
              className="secondary"
              disabled={busy || !mediaEnabled}
              onClick={() => void save(true)}
            >
              <Film size={18} />
              Exportar e revisar
            </button>
          )}
          <button
            type="button"
            disabled={busy || !canPublish}
            onClick={() => void save(true, true)}
          >
            <Send size={18} />
            {busy ? "Publicando…" : submitLabel}
          </button>
        </footer>
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
            <p>Alterações ainda não salvas serão descartadas deste aparelho.</p>
            <div className="social-row">
              <button className="secondary" onClick={() => setDiscard(false)}>
                Continuar editando
              </button>
              <button
                onClick={() => {
                  void localSocialDraft(user, null).catch(() => {});
                  setDraft({ ...emptySocialDraft(), kind: initialKind });
                  setDiscard(false);
                  setStep("pick");
                  setError("");
                  setStatus("");
                  setProgress(0);
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
