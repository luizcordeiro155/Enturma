"use client";
import { SocialMentionInput } from "./social-mention-input";
import { SocialDraftPreview } from "./social-draft-preview";
import { SocialDraftsShelf, type SavedDraft } from "./social-drafts-shelf";
/* eslint-disable @next/next/no-img-element -- local files and authenticated media */
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Clock3,
  Crop,
  Film,
  ImagePlus,
  LayoutGrid,
  Save,
  Send,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  defaultRecipe,
  exportDuration,
  MAX_VIDEO_SECONDS,
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
import { bestAspect } from "@/lib/social-editing";
import { normalizeSocialGalleryFile } from "@/lib/social-gallery";
import { importPhoto } from "@/lib/photo-import";
import { SocialMediaStrip } from "./social-media-strip";
import { usePhotoAccept } from "@/lib/photo-accept";
import { ImageEditor } from "./image-editor";
import { VideoEditor } from "./video-editor";
import { SocialCapture } from "./social-capture";
import { SocialDialog } from "./social-dialog";
import { StoryDecorations, StoryDecorationEditor } from "./story-decorations";
import { NavigationLink } from "../navigation-link";
import { linkedProject } from "@/lib/social-project-link";
type Portfolio = {
  username: string;
  publicProfile: boolean;
  projects: { id: string; name: string; archived?: boolean }[];
};
export type SocialEditorProgress = {
  state: "idle" | "working" | "done" | "error";
  message: string;
  percent: number;
};
type Step = "pick" | "edit" | "details";
const FORMATS = {
  POST: {
    name: "Post",
    title: "Post",
    hint: "Fotos e vídeos · vídeos também vão para os Clips",
    icon: LayoutGrid,
  },
  STORY: {
    name: "Story · 24h",
    title: "Story",
    hint: "Some em 24 horas",
    icon: Clock3,
  },
} as const;
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
async function videoInfo(file: File) {
  return new Promise<{ duration: number; width: number; height: number }>(
    (resolve, reject) => {
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
      const width = element.videoWidth,
        height = element.videoHeight;
      done();
      if (!Number.isFinite(duration) || duration <= 0 || duration > 3600)
        reject(new Error("Escolha um vídeo de até uma hora."));
      else resolve({ duration, width, height });
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
    },
  );
}
/** A photo's own size, used to pick its framing. */
async function imageSize(file: File): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      const size = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return size;
    } catch {
      /* Fall back to an image element below. */
    }
  }
  return new Promise((resolve) => {
    const image = new Image(),
      url = URL.createObjectURL(file);
    let settled = false;
    const finish = (width: number, height: number) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      resolve({ width, height });
    };
    // Without a size the feed default framing is used.
    const timer = setTimeout(() => finish(0, 0), 400);
    image.onload = () => finish(image.naturalWidth, image.naturalHeight);
    image.onerror = () => finish(0, 0);
    image.src = url;
  });
}
/** Videos are published as Posts and also play in Clips. */
const composerKind = (kind: SocialDraft["kind"]): "POST" | "STORY" =>
  kind === "STORY" ? "STORY" : "POST";
export function SocialEditor({
  user,
  mediaEnabled,
  initialKind,
  linkProject,
  published,
  onProgress,
}: {
  user: string;
  mediaEnabled: boolean;
  initialKind: "POST" | "STORY" | "CLIP";
  /** A portfolio project the post was asked to present ("Publicar no Enturma Social"). */
  linkProject?: string | null;
  published: (kind: "POST" | "STORY" | "CLIP") => void;
  onProgress?: (progress: SocialEditorProgress) => void;
}) {
  // on a computer the file window also lists HEIC and RAW
  const mediaAccept = usePhotoAccept("video/*");
  const [draft, setDraft] = useState<SocialDraft | null>(null),
    [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio>(),
    [portfolioError, setPortfolioError] = useState("");
  const [error, setError] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0);
  const [capture, setCapture] = useState(false),
    [discard, setDiscard] = useState(false),
    [step, setStep] = useState<Step>("pick");
  // Which media is open: one at a time, in the editor and in the review alike.
  const [reviewIndex, setReviewIndex] = useState(0);
  const picker = useRef<HTMLInputElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  // On a phone the end of the form sits behind the sticky actions, so a
  // problem with the chosen file is shown and brought into view at the top.
  const pickError = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (error && step === "pick")
      pickError.current?.scrollIntoView?.({ block: "center", behavior: "smooth" });
  }, [error, step]);
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
          const restored = value
            ? { ...value, kind: composerKind(value.kind) }
            : { ...emptySocialDraft(), kind: composerKind(initialKind) };
          setDraft(restored);
          if (restored.files.length) setStep("edit");
        }
      })
      .catch(() => {
        if (alive.current) {
          setDraft({ ...emptySocialDraft(), kind: composerKind(initialKind) });
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
  // Arriving from the portfolio: the project's link goes into the draft once, and the
  // request leaves the address so a reload does not link it again.
  const linkedOnce = useRef(false);
  const draftReady = draft !== null;
  useEffect(() => {
    if (linkedOnce.current || !linkProject || !draftReady || !portfolio) return;
    const project = linkedProject(linkProject, portfolio);
    const timer = setTimeout(() => {
      linkedOnce.current = true;
      if (project) {
        setDraft((value) => (value ? { ...value, projectUrl: project.url } : value));
        setStatus(`O projeto ${project.name} vai junto na publicação. Escolha a mídia.`);
      } else
        setError(
          "Não foi possível vincular o projeto. Deixe o portfólio público e o projeto ativo.",
        );
      const url = new URL(window.location.href);
      url.searchParams.delete("projeto");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }, 0);
    return () => clearTimeout(timer);
  }, [linkProject, draftReady, portfolio]);
  useEffect(() => {
    const timer = setTimeout(
      () =>
        setDraft((value) =>
          value && !value.body && !value.files.length && !value.version
            ? { ...value, kind: composerKind(initialKind) }
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
        // HEIC from phone cameras and RAW become a JPG here, before anything else looks at them.
        const prepared = await importPhoto(original);
        const file = normalizeSocialGalleryFile(prepared);
        if (!/^(image\/(jpeg|png|webp|gif)|video\/)/.test(file.type))
          throw new Error("Use uma foto ou um vídeo.");
        const video = file.type.startsWith("video/")
          ? await videoInfo(file)
          : undefined;
        const size = video ?? (await imageSize(file));
        // The best framing is chosen for the person: the shape that keeps the
        // most of the original, wherever it is shown.
        const aspect = bestAspect(size.width, size.height);
        next.push({
          id: crypto.randomUUID(),
          file,
          autoAspect: aspect,
          duration: video?.duration,
          recipe: video
            ? { ...defaultRecipe(video.duration), aspect }
            : { ...defaultRecipe(1), aspect },
        });
      }
      if (alive.current) {
        // The first of what was just added is the one that opens.
        setReviewIndex(draft.files.length);
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
            (exportDuration(item.recipe) > MAX_VIDEO_SECONDS ||
              item.recipe.cover >= exportDuration(item.recipe))
          )
            throw new Error(
              "Revise a duração (até 3 minutos) e a posição da capa.",
            );
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
        {
          id: work.id,
          kind: work.kind,
          body: work.body,
          updatedAt: new Date().toISOString(),
          mediaCount: work.files.length,
          coverId: work.files[0]?.media?.id ?? null,
          coverKind: work.files[0]?.media?.kind ?? null,
          coverState: work.files[0]?.media?.state ?? null,
        },
        ...previous.filter((value) => value.id !== work.id),
      ]);
      if (publishAfter) {
        // A 3-minute video can take a few minutes to export.
        const deadline = Date.now() + 600000;
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
              detail: {
                id: work.id,
                kind: work.kind,
                // A post that starts with a video also plays in Clips.
                video:
                  work.files[0]?.media?.kind === "VIDEO" ||
                  !!work.files[0]?.file?.type.startsWith("video/"),
              },
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
          kind: composerKind(value.kind),
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
  async function deleteSaved(id: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      await socialWrite(`/posts/${id}`, undefined, "DELETE");
      if (!alive.current) return;
      setSavedDrafts((previous) => previous.filter((value) => value.id !== id));
      // Deleting the draft that is open here leaves a clean editor behind.
      if (current.current?.id === id) {
        await localSocialDraft(user, null).catch(() => {});
        setDraft({ ...emptySocialDraft(), kind: current.current.kind });
        setStep("pick");
      }
      setStatus("Rascunho excluído.");
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
      if (alive.current) {
        const remaining = draft.files.filter((file) => file.id !== item.id);
        setDraft((value) =>
          value
            ? {
                ...value,
                files: value.files.filter((file) => file.id !== item.id),
              }
            : value,
        );
        // With nothing left to edit, the flow starts again at Escolher.
        if (!remaining.length) {
          setStep("pick");
          setReviewIndex(0);
        }
      }
    } catch (cause) {
      if (alive.current) setError((cause as Error).message);
    } finally {
      busyRef.current = false;
      if (alive.current) setBusy(false);
    }
  }
  if (!draft) return <p role="status">Recuperando seu rascunho…</p>;
  const openIndex = Math.max(0, Math.min(reviewIndex, draft.files.length - 1));
  const pending = draft.files.some((file) => file.media?.state !== "READY"),
    hasContent = !!draft.body.trim() || draft.files.length > 0;
  const canPublish =
    hasContent &&
    (!draft.files.length || mediaEnabled) &&
    draft.files.every((file) => !!file.file || !!file.media);
  const canAdvance = hasContent;
  const submitLabel = pending
    ? "Enviar e publicar"
    : `Publicar ${draft.kind === "STORY" ? "Story" : "Post"}`;
  return (
    <section
      className="social-editor social-create-flow"
      aria-label="Central de criação"
      data-step={step}
      data-has-media={draft.files.length > 0}
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
        {STEPS.map(([key, label], index) => {
          const position = STEPS.findIndex(([value]) => value === step);
          const state =
            index < position ? "done" : index === position ? "current" : "next";
          return (
            <li
              key={key}
              data-state={state}
              aria-current={step === key ? "step" : undefined}
            >
              <span aria-hidden="true">
                {state === "done" ? <Check size={14} /> : index + 1}
              </span>
              {label}
            </li>
          );
        })}
      </ol>
      <div className="social-create-step-actions" hidden={step === "pick"}>
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
        {step === "edit" && (
          <button
            type="button"
            disabled={busy || !canAdvance}
            onClick={() => setStep("details")}
          >
            Avançar
            <ArrowRight size={18} />
          </button>
        )}
      </div>
      <fieldset disabled={busy} className="social-editor-fields">
        <div hidden={step !== "pick"} className="social-create-pick">
          <div className="social-segments" aria-label="Formato da publicação">
            {(["POST", "STORY"] as const).map((kind) => {
              const format = FORMATS[kind];
              return (
                <button
                  type="button"
                  key={kind}
                  className="secondary social-format-card"
                  aria-label={format.name}
                  disabled={busy || draft.files.length > 0}
                  aria-pressed={draft.kind === kind}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      kind,
                      storyOverlays:
                        kind === "STORY" ? draft.storyOverlays : [],
                    })
                  }
                >
                  <format.icon size={22} aria-hidden="true" />
                  <strong>{format.title}</strong>
                  <small>{format.hint}</small>
                </button>
              );
            })}
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
              {draft.kind === "STORY"
                ? "Uma foto ou vídeo de até 3 min · 512 MB"
                : "Até 10 fotos ou vídeos · vídeos de até 3 min · 512 MB cada"}
            </span>
            <span className="social-upload-auto">
              <Crop size={14} aria-hidden="true" />
              O melhor enquadramento é escolhido automaticamente.
            </span>
            {busy && (
              <p className="social-pick-busy" aria-live="polite">
                Preparando sua mídia…
              </p>
            )}
            {error && step === "pick" && (
              <p role="alert" className="social-error social-pick-error" ref={pickError}>
                {error}
              </p>
            )}
            <div className="social-row">
              <label className="social-file-button social-file-button-primary">
                Escolher mídia
                <input
                  ref={picker}
                  type="file"
                  accept={mediaAccept}
                  multiple={draft.kind === "POST"}
                  disabled={!mediaEnabled || busy}
                  onChange={(event) => {
                    void choose(Array.from(event.target.files ?? []));
                    event.target.value = "";
                  }}
                />
              </label>
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
          <SocialDraftsShelf
            drafts={savedDrafts}
            busy={busy}
            onDelete={(id) => void deleteSaved(id)}
            onOpen={(id) => {
              if (draft.id !== id && (draft.body || draft.files.length)) {
                setError(
                  "Salve seu rascunho atual e use Novo rascunho antes de abrir outro.",
                );
                return;
              }
              void load(id);
            }}
          />
        </div>
        <div hidden={step !== "edit"} className="social-create-edit">
          {/* One media at a time, like the publication itself; the line below chooses which. */}
          {draft.files.map((item, index) =>
            index !== openIndex ? null : (
            // The frame stays while its content changes, so the arrows keep the focus.
            <div className="social-edit-media" key="open">
              <div className="social-row">
                <strong>
                  {`Mídia ${index + 1}${draft.files.length > 1 ? ` de ${draft.files.length}` : ""}`}
                  {item.media
                    ? ` · ${item.media.state === "READY" ? "Pronta" : item.media.state === "FAILED" ? "Falha no processamento" : "Em preparação"}`
                    : ""}
                </strong>
                {item.recipe?.aspect && (
                  <span className="social-framing-chip">
                    <Crop size={14} aria-hidden="true" />
                    {item.recipe.aspect === item.autoAspect
                      ? `Enquadramento automático · ${item.recipe.aspect}`
                      : `Enquadramento ${item.recipe.aspect}`}
                  </span>
                )}
                {draft.files.length > 1 && (
                  <span className="social-edit-order">Ordem</span>
                )}
                {draft.files.length > 1 &&
                  [-1, 1].map((delta) => (
                    <button
                      type="button"
                      key={delta}
                      className="icon-control"
                      title={delta < 0 ? "Passar para antes" : "Passar para depois"}
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
                        // the open media goes along to its new place
                        setReviewIndex(index + delta);
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
              {draft.kind === "POST" && (
                <SocialMediaStrip
                  items={draft.files}
                  current={openIndex}
                  onSelect={setReviewIndex}
                  disabled={busy || !mediaEnabled}
                  onAdd={
                    draft.files.length < 10
                      ? () => picker.current?.click()
                      : undefined
                  }
                />
              )}
              <div className="social-edit-stage">
                <LocalFile
                  key={item.id}
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
            ),
          )}
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
        {step === "details" && draft.files.length > 0 && (
          <div
            className="social-create-preview"
            // A sideways swipe on the still preview goes to the next media, as in the feed.
            data-social-gesture={draft.files.length > 1 ? "ignore" : undefined}
            onTouchStart={(event) => {
              const touch = event.touches[0];
              swipe.current = touch
                ? { x: touch.clientX, y: touch.clientY }
                : null;
            }}
            onTouchEnd={(event) => {
              const from = swipe.current;
              const touch = event.changedTouches[0];
              swipe.current = null;
              if (!from || !touch || draft.files.length < 2) return;
              const across = touch.clientX - from.x;
              const down = touch.clientY - from.y;
              if (Math.abs(across) < 48 || Math.abs(across) < Math.abs(down) * 1.5)
                return;
              setReviewIndex(
                Math.max(
                  0,
                  Math.min(
                    draft.files.length - 1,
                    openIndex + (across < 0 ? 1 : -1),
                  ),
                ),
              );
            }}
          >
            <SocialDraftPreview
              showFeedPreview={
                draft.kind !== "STORY" &&
                (draft.files[
                  openIndex
                ].file?.type.startsWith("video/") === true ||
                  draft.files[openIndex]
                    .media?.kind === "VIDEO")
              }
              key={
                draft.files[openIndex].id
              }
              item={draft.files[openIndex]}
              overlay={
                draft.kind === "STORY" ? (
                  <StoryDecorations items={draft.storyOverlays ?? []} />
                ) : undefined
              }
            />
            {draft.files.length > 1 && (
              <SocialMediaStrip
                items={draft.files}
                current={openIndex}
                onSelect={setReviewIndex}
              />
            )}
          </div>
        )}
        <div className="social-caption-field">
          <label htmlFor="social-caption">O que você quer compartilhar?</label>
          <SocialMentionInput
            id="social-caption"
            className="resize-none"
            value={draft.body}
            maxLength={4000}
            rows={3}
            placeholder="Escreva uma legenda… Use #assuntos e @pessoas."
            onValueChange={(body) => setDraft({ ...draft, body })}
          />
        </div>
        <div hidden={step !== "details"} className="social-create-details">
          {!!draft.files.length && (
            <p className="social-note social-create-selected">
              <Film size={16} aria-hidden="true" />
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
                  {portfolio.projects
                    .filter((project) => !project.archived)
                    .map((project) => (
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
        <p className="social-note social-create-privacy">
          <ShieldCheck size={16} aria-hidden="true" />
          {draft.visibility === "PUBLIC"
            ? "Visibilidade: Comunidade Enturma."
            : "Visibilidade: Meus seguidores."}{" "}
          A privacidade da conta prevalece. Publique apenas conteúdo que você
          tem autorização para compartilhar.
        </p>
        {error && step !== "pick" && (
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
          {step === "pick" && (
            <button
              type="button"
              className="secondary"
              disabled={busy || !canAdvance}
              onClick={() => setStep(draft.files.length ? "edit" : "details")}
            >
              Avançar
              <ArrowRight size={18} />
            </button>
          )}
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
                  setDraft({
                    ...emptySocialDraft(),
                    kind: composerKind(initialKind),
                  });
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
