"use client";
/* eslint-disable @next/next/no-img-element -- local gallery cover preview */
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Undo2,
  Redo2,
  Scissors,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  RotateCw,
  ImagePlus,
} from "lucide-react";
import {
  exportDuration,
  sourceTime,
  videoPreviewFrame,
  type VideoRecipe,
} from "@/lib/social";

import { MediaTimeline } from "./media-timeline";
import { useVideoFrames } from "./use-video-frames";
import { EditableMediaFrame } from "./editable-media-frame";
import {
  MEDIA_ASPECTS,
  FILTERS,
  FILTER_CSS,
  FILTER_LABELS,
  trimSegment,
  captionRange,
  normalizeRecipe,
  timeLabel,
  frameTimes,
  type MediaAspect,
  type MediaFilter,
} from "@/lib/social-editing";

function GalleryCover({ file }: { file: File }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const source = URL.createObjectURL(file);
    const timer = setTimeout(() => setUrl(source), 0);
    return () => {
      clearTimeout(timer);
      URL.revokeObjectURL(source);
    };
  }, [file]);
  return url ? (
    <img
      className="studio-cover-preview"
      src={url}
      alt="Capa escolhida na galeria"
    />
  ) : null;
}
export function VideoEditor({
  url,
  sourceDuration,
  value,
  onChange,
  overlay,
  coverFile,
  onCoverFile,
}: {
  url: string;
  sourceDuration: number;
  value: VideoRecipe;
  onChange: (r: VideoRecipe) => void;
  overlay?: ReactNode;
  coverFile?: File;
  onCoverFile?: (file: File | undefined) => void;
}) {
  const video = useRef<HTMLVideoElement>(null),
    undo = useRef<VideoRecipe[]>([]),
    redo = useRef<VideoRecipe[]>([]);
  const [position, setPosition] = useState(0),
    [playing, setPlaying] = useState(false),
    [selected, setSelected] = useState(0),
    [available, setAvailable] = useState({ undo: false, redo: false });
  const [caption, setCaption] = useState("");
  const [coverMode, setCoverMode] = useState(false);
  const editedDuration = exportDuration(value);
  const coverTimes = frameTimes(editedDuration);
  const captured = useVideoFrames(
    url,
    sourceDuration,
    coverMode ? coverTimes.map((time) => sourceTime(value, time)) : undefined,
  );
  const frames = coverMode
    ? captured.map((frame, index) => ({ ...frame, time: coverTimes[index] }))
    : captured;
  const [coverError, setCoverError] = useState("");
  const gestureBase = useRef<VideoRecipe | null>(null);
  const [sourceSize, setSourceSize] = useState({ width: 720, height: 1280 });
  const duration = exportDuration(value),
    segment = value.segments[selected] ?? value.segments[0];
  function remember(previous: VideoRecipe) {
    undo.current.push(previous);
    if (undo.current.length > 50) undo.current.shift();
    redo.current = [];
    setAvailable({ undo: true, redo: false });
  }
  function gesture(next: VideoRecipe, commit: boolean) {
    if (!gestureBase.current) gestureBase.current = value;
    setPlaying(false);
    if (commit) {
      remember(gestureBase.current);
      gestureBase.current = null;
    }
    onChange(next);
  }
  function edit(next: VideoRecipe) {
    if (next.segments !== value.segments) {
      const end = exportDuration(next);
      next = {
        ...next,
        cover: Math.min(next.cover, Math.max(0, end - 0.1)),
        captions: next.captions
          .filter((c) => c.start < end)
          .map((c) => ({ ...c, end: Math.min(c.end, end) })),
      };
      setPlaying(false);
      setPosition(0);
    }
    undo.current.push(value);
    if (undo.current.length > 50) undo.current.shift();
    redo.current = [];
    setAvailable({
      undo: undo.current.length > 0,
      redo: redo.current.length > 0,
    });
    onChange(next);
  }
  function history(back: boolean) {
    const from = back ? undo.current : redo.current,
      to = back ? redo.current : undo.current;
    const next = from.pop();
    if (next) {
      to.push(value);
      setSelected(0);
      setPlaying(false);
      setPosition(0);
      onChange(next);
      setAvailable({
        undo: undo.current.length > 0,
        redo: redo.current.length > 0,
      });
    }
  }
  function seek(time: number) {
    setPosition(time);
    if (video.current) video.current.currentTime = sourceTime(value, time);
  }
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    element.volume = Math.min(1, value.volume);
    element.muted = value.mute;
    element.playbackRate = value.speed ?? 1;
  }, [value.volume, value.mute, value.speed]);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (!playing) {
      element.pause();
      return;
    }
    let segmentIndex = 0,
      elapsed = 0;
    const playFrom = position >= duration ? 0 : position;
    for (const s of value.segments) {
      if (playFrom < elapsed + (s.end - s.start) / (value.speed ?? 1)) break;
      elapsed += (s.end - s.start) / (value.speed ?? 1);
      segmentIndex++;
    }
    segmentIndex = Math.min(segmentIndex, value.segments.length - 1);
    element.currentTime = sourceTime(value, playFrom);
    void element.play().catch(() => setPlaying(false));
    const update = () => {
      const s = value.segments[segmentIndex];
      if (element.currentTime >= s.end - 0.04) {
        elapsed += (s.end - s.start) / (value.speed ?? 1);
        segmentIndex++;
        if (segmentIndex >= value.segments.length) {
          element.pause();
          setPlaying(false);
          setPosition(0);
          return;
        }
        element.currentTime = value.segments[segmentIndex].start;
      }
      setPosition(
        elapsed +
          Math.max(
            0,
            element.currentTime - value.segments[segmentIndex].start,
          ) /
            (value.speed ?? 1),
      );
    };
    const hide = () => {
      if (document.hidden) {
        element.pause();
        setPlaying(false);
      }
    };
    element.addEventListener("timeupdate", update);
    document.addEventListener("visibilitychange", hide);
    return () => {
      element.pause();
      element.removeEventListener("timeupdate", update);
      document.removeEventListener("visibilitychange", hide);
    };
    // Position is controlled by the playhead; restarting on each tick would skip playback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, value, duration]);
  function split() {
    let offset = 0;
    const index = value.segments.findIndex((s) => {
      const match =
        position > offset + 0.1 &&
        position < offset + (s.end - s.start) / (value.speed ?? 1) - 0.1;
      if (!match) offset += (s.end - s.start) / (value.speed ?? 1);
      return match;
    });
    if (index < 0 || value.segments.length >= 12) return;
    const s = value.segments[index],
      at = s.start + (position - offset) * (value.speed ?? 1);
    edit({
      ...value,
      segments: [
        ...value.segments.slice(0, index),
        { start: s.start, end: at },
        { start: at, end: s.end },
        ...value.segments.slice(index + 1),
      ],
    });
    setSelected(index);
  }
  function move(delta: number) {
    const segments = [...value.segments],
      next = selected + delta;
    if (next < 0 || next >= segments.length) return;
    [segments[selected], segments[next]] = [segments[next], segments[selected]];
    edit({ ...value, segments });
    setSelected(next);
  }
  return (
    <section
      className="social-video-editor"
      aria-label="Editor de vídeo"
      data-social-gesture="ignore"
    >
      <div className="studio-preview-column">
        <EditableMediaFrame
          value={value}
          source={sourceSize}
          position={position}
          change={gesture}
        >
          <video
            ref={video}
            src={url}
            playsInline
            preload="metadata"
            onLoadedMetadata={(event) => {
              const element = event.currentTarget;
              setSourceSize({
                width: element.videoWidth || 720,
                height: element.videoHeight || 1280,
              });
              element.currentTime = sourceTime(value, 0);
            }}
            style={{
              ...videoPreviewFrame(sourceSize.width, sourceSize.height, value),
              filter: FILTER_CSS[value.filter ?? "ORIGINAL"],
            }}
          />
          {overlay}
        </EditableMediaFrame>
        <p className="studio-preview-hint">
          Arraste a imagem ou o texto. Use dois dedos para ampliar.
        </p>
      </div>
      <div className="social-editor-tools">
        <div className="social-row">
          <button
            type="button"
            className="secondary"
            aria-label={playing ? "Pausar prévia" : "Reproduzir prévia"}
            onClick={() => setPlaying(!playing)}
          >
            {playing ? <Pause /> : <Play />}
          </button>
          <output>
            {timeLabel(position)} / {timeLabel(duration)}
          </output>
          <button
            type="button"
            className="icon-control"
            disabled={!available.undo}
            aria-label="Desfazer edição"
            onClick={() => history(true)}
          >
            <Undo2 />
          </button>
          <button
            type="button"
            className="icon-control"
            disabled={!available.redo}
            aria-label="Refazer edição"
            onClick={() => history(false)}
          >
            <Redo2 />
          </button>
        </div>
        <MediaTimeline
          duration={coverMode ? duration : sourceDuration}
          frames={frames}
          start={segment.start}
          end={segment.end}
          position={coverMode ? value.cover : sourceTime(value, position)}
          mode={coverMode ? "cover" : "trim"}
          seek={(time) => {
            setPlaying(false);
            if (coverMode) {
              const next = Math.min(time, Math.max(0, duration - 0.05));
              edit({ ...value, cover: next });
              seek(next);
              onCoverFile?.(undefined);
            } else {
              if (video.current) video.current.currentTime = time;
              let offset = 0;
              for (const part of value.segments) {
                if (time >= part.start && time <= part.end) {
                  setPosition(
                    offset + (time - part.start) / (value.speed ?? 1),
                  );
                  break;
                }
                offset += (part.end - part.start) / (value.speed ?? 1);
              }
            }
          }}
          change={(handle, time, commit) => {
            const next = trimSegment(
              value,
              selected,
              handle,
              time,
              sourceDuration,
            );
            gesture(next, commit);
            if (video.current)
              video.current.currentTime =
                handle === "end"
                  ? next.segments[selected].end - 0.05
                  : next.segments[selected].start;
            setPosition(
              value.segments
                .slice(0, selected)
                .reduce(
                  (total, part) =>
                    total + (part.end - part.start) / (value.speed ?? 1),
                  0,
                ),
            );
          }}
        />
        <div className="studio-mode-row">
          <button
            type="button"
            className="secondary"
            aria-pressed={!coverMode}
            onClick={() => setCoverMode(false)}
          >
            <Scissors size={16} />
            Cortar
          </button>
          <button
            type="button"
            className="secondary"
            aria-pressed={coverMode}
            onClick={() => {
              setCoverMode(true);
              setPlaying(false);
              seek(value.cover);
            }}
          >
            <ImagePlus size={16} />
            Escolher capa
          </button>
          {coverMode && onCoverFile && (
            <label className="social-file-button studio-cover-file">
              Capa da galeria
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setCoverError("");
                  if (
                    file &&
                    /image\/(jpeg|png|webp)$/.test(file.type) &&
                    file.size <= 16 * 1024 * 1024
                  )
                    onCoverFile(file);
                  else if (file)
                    setCoverError(
                      "Use uma imagem JPG, PNG ou WebP de at\u00e9 16 MB para a capa.",
                    );
                  event.target.value = "";
                }}
              />
            </label>
          )}
        </div>
        {coverError && <p role="alert">{coverError}</p>}
        {coverFile && <GalleryCover file={coverFile} />}
        {coverFile && (
          <p role="status">
            Capa selecionada: {coverFile.name}{" "}
            <button
              type="button"
              className="text-button"
              onClick={() => onCoverFile?.(undefined)}
            >
              Usar quadro do v&iacute;deo
            </button>
          </p>
        )}
        <label>
          Posição de reprodução
          <input
            type="range"
            min={0}
            max={duration}
            step={0.05}
            value={Math.min(position, duration)}
            onChange={(e) => {
              setPlaying(false);
              seek(Number(e.target.value));
            }}
          />
        </label>
        <div
          className="social-timeline"
          aria-label="Trechos na ordem de reprodução"
        >
          {value.segments.map((s, i) => (
            <button
              type="button"
              key={i}
              className="secondary"
              aria-pressed={selected === i}
              style={{ flexGrow: s.end - s.start }}
              onClick={() => {
                setSelected(i);
                setPlaying(false);
              }}
            >
              <span>Trecho {i + 1}</span>
              <small>
                {s.start.toFixed(1)}–{s.end.toFixed(1)} s
              </small>
            </button>
          ))}
        </div>
        <div className="social-edit-controls">
          <label>
            Começo (s)
            <input
              type="number"
              min={0}
              max={segment.end - 0.1}
              step={0.1}
              value={segment.start}
              onChange={(e) =>
                edit({
                  ...value,
                  segments: value.segments.map((s, i) =>
                    i === selected
                      ? {
                          ...s,
                          start: Math.max(
                            0,
                            Math.min(Number(e.target.value), s.end - 0.1),
                          ),
                        }
                      : s,
                  ),
                })
              }
            />
          </label>
          <label>
            Fim (s)
            <input
              type="number"
              min={segment.start + 0.1}
              max={sourceDuration}
              step={0.1}
              value={segment.end}
              onChange={(e) =>
                edit({
                  ...value,
                  segments: value.segments.map((s, i) =>
                    i === selected
                      ? {
                          ...s,
                          end: Math.min(
                            sourceDuration,
                            Math.max(Number(e.target.value), s.start + 0.1),
                          ),
                        }
                      : s,
                  ),
                })
              }
            />
          </label>
        </div>
        <div className="social-row">
          <button
            type="button"
            className="secondary"
            onClick={split}
            disabled={value.segments.length >= 12}
          >
            <Scissors size={16} /> Dividir aqui
          </button>
          <button
            type="button"
            className="icon-control"
            aria-label="Mover trecho para antes"
            disabled={selected === 0}
            onClick={() => move(-1)}
          >
            <ArrowLeft />
          </button>
          <button
            type="button"
            className="icon-control"
            aria-label="Mover trecho para depois"
            disabled={selected === value.segments.length - 1}
            onClick={() => move(1)}
          >
            <ArrowRight />
          </button>
          <button
            type="button"
            className="icon-control"
            aria-label="Excluir trecho"
            disabled={value.segments.length === 1}
            onClick={() => {
              edit({
                ...value,
                segments: value.segments.filter((_, i) => i !== selected),
              });
              setSelected(0);
            }}
          >
            <Trash2 />
          </button>
        </div>
        <details>
          <summary>Enquadramento, áudio e capa</summary>
          <div className="social-edit-controls">
            <label>
              Propor&ccedil;&atilde;o
              <select
                value={value.aspect ?? "9:16"}
                onChange={(event) =>
                  edit({ ...value, aspect: event.target.value as MediaAspect })
                }
              >
                {MEDIA_ASPECTS.map((aspect) => (
                  <option key={aspect}>{aspect}</option>
                ))}
              </select>
            </label>
            <label>
              Velocidade
              <select
                value={value.speed ?? 1}
                onChange={(event) =>
                  edit(
                    normalizeRecipe({
                      ...value,
                      speed: Number(event.target.value),
                    }),
                  )
                }
              >
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                  <option key={speed} value={speed}>
                    {speed}x
                  </option>
                ))}
              </select>
            </label>
            <label>
              Filtro
              <select
                value={value.filter ?? "ORIGINAL"}
                onChange={(event) =>
                  edit({ ...value, filter: event.target.value as MediaFilter })
                }
              >
                {FILTERS.map((filter) => (
                  <option key={filter} value={filter}>
                    {FILTER_LABELS[filter]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Zoom
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={value.zoom}
                onChange={(e) =>
                  edit({ ...value, zoom: Number(e.target.value) })
                }
              />
            </label>
            <button
              type="button"
              className="secondary"
              onClick={() =>
                edit({ ...value, rotation: (value.rotation + 90) % 360 })
              }
            >
              <RotateCw size={16} /> Girar {value.rotation}°
            </button>
            <label>
              Posição horizontal
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={value.x}
                onChange={(e) => edit({ ...value, x: Number(e.target.value) })}
              />
            </label>
            <label>
              Posição vertical
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={value.y}
                onChange={(e) => edit({ ...value, y: Number(e.target.value) })}
              />
            </label>
            <label>
              Volume
              <input
                type="range"
                min={0}
                max={2}
                step={0.05}
                value={value.volume}
                onChange={(e) =>
                  edit({ ...value, volume: Number(e.target.value) })
                }
              />
            </label>
            <label className="social-check">
              <input
                type="checkbox"
                checked={value.mute}
                onChange={(e) => edit({ ...value, mute: e.target.checked })}
              />{" "}
              Silenciar original
            </label>
            <label>
              Capa no segundo
              <input
                type="number"
                min={0}
                max={Math.max(0, duration - 0.1)}
                step={0.1}
                value={value.cover}
                onChange={(e) =>
                  edit({
                    ...value,
                    cover: Math.min(
                      Math.max(0, Number(e.target.value)),
                      duration - 0.1,
                    ),
                  })
                }
              />
            </label>
          </div>
        </details>
        <details>
          <summary>Textos e legendas</summary>
          {value.captions.map((c, i) => (
            <div className="social-caption-edit" key={i}>
              <MediaTimeline
                duration={duration}
                frames={[]}
                start={c.start}
                end={c.end}
                position={position}
                seek={(time) => {
                  setPlaying(false);
                  seek(time);
                }}
                change={(handle, time, commit) =>
                  gesture(
                    {
                      ...value,
                      captions: value.captions.map((item, index) =>
                        index === i
                          ? captionRange(item, handle, time, duration)
                          : item,
                      ),
                    },
                    commit,
                  )
                }
              />
              <div className="social-edit-controls">
                <label>
                  Tamanho do texto
                  <input
                    type="range"
                    min={20}
                    max={72}
                    step={2}
                    value={c.size ?? 36}
                    onChange={(event) =>
                      edit({
                        ...value,
                        captions: value.captions.map((item, index) =>
                          index === i
                            ? { ...item, size: Number(event.target.value) }
                            : item,
                        ),
                      })
                    }
                  />
                </label>
                <label>
                  Cor do texto
                  <select
                    value={c.color ?? "#ffffff"}
                    onChange={(event) =>
                      edit({
                        ...value,
                        captions: value.captions.map((item, index) =>
                          index === i
                            ? { ...item, color: event.target.value }
                            : item,
                        ),
                      })
                    }
                  >
                    {[
                      ["#ffffff", "Branco"],
                      ["#000000", "Preto"],
                      ["#ffeb3b", "Amarelo"],
                      ["#ff5a7a", "Rosa"],
                      ["#81e6d9", "Verde"],
                    ].map(([color, label]) => (
                      <option key={color} value={color}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Texto {i + 1}
                <input
                  value={c.text}
                  maxLength={240}
                  onChange={(e) =>
                    edit({
                      ...value,
                      captions: value.captions.map((v, k) =>
                        k === i ? { ...v, text: e.target.value } : v,
                      ),
                    })
                  }
                />
              </label>
              <div className="social-edit-controls">
                {(["start", "end", "y"] as const).map((field) => (
                  <label key={field}>
                    {
                      {
                        start: "Início (s)",
                        end: "Fim (s)",
                        y: "Altura (0–1)",
                      }[field]
                    }
                    <input
                      type="number"
                      min={0}
                      max={field === "y" ? 1 : duration}
                      step={0.1}
                      value={c[field]}
                      onChange={(e) =>
                        edit({
                          ...value,
                          captions: value.captions.map((v, k) =>
                            k === i
                              ? { ...v, [field]: Number(e.target.value) }
                              : v,
                          ),
                        })
                      }
                    />
                  </label>
                ))}
              </div>
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  edit({
                    ...value,
                    captions: value.captions.filter((_, k) => k !== i),
                  })
                }
              >
                Remover texto
              </button>
            </div>
          ))}
          <label>
            Nova legenda
            <input
              value={caption}
              maxLength={240}
              onChange={(e) => setCaption(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="secondary"
            disabled={!caption.trim() || value.captions.length >= 20}
            onClick={() => {
              edit({
                ...value,
                captions: [
                  ...value.captions,
                  { text: caption.trim(), start: 0, end: duration, y: 0.8 },
                ],
              });
              setCaption("");
            }}
          >
            Adicionar texto
          </button>
        </details>
        {duration > 90 && (
          <p role="alert">
            Reduza os trechos para até 90 segundos antes de exportar.
          </p>
        )}
        <small>
          A publicação usa a prévia final processada. O volume acima de 100% é
          aplicado na exportação.
        </small>
      </div>
    </section>
  );
}
