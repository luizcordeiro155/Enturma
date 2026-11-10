"use client";
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
} from "lucide-react";
import {
  exportDuration,
  sourceTime,
  videoPreviewFrame,
  type VideoRecipe,
} from "@/lib/social";

export function VideoEditor({
  url,
  sourceDuration,
  value,
  onChange,
  overlay,
}: {
  url: string;
  sourceDuration: number;
  value: VideoRecipe;
  onChange: (r: VideoRecipe) => void;
  overlay?: ReactNode;
}) {
  const video = useRef<HTMLVideoElement>(null),
    undo = useRef<VideoRecipe[]>([]),
    redo = useRef<VideoRecipe[]>([]);
  const [position, setPosition] = useState(0),
    [playing, setPlaying] = useState(false),
    [selected, setSelected] = useState(0),
    [available, setAvailable] = useState({ undo: false, redo: false });
  const [caption, setCaption] = useState("");
  const [sourceSize, setSourceSize] = useState({ width: 720, height: 1280 });
  const duration = exportDuration(value),
    segment = value.segments[selected] ?? value.segments[0];
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
  }, [value.volume, value.mute]);
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
      if (playFrom < elapsed + s.end - s.start) break;
      elapsed += s.end - s.start;
      segmentIndex++;
    }
    segmentIndex = Math.min(segmentIndex, value.segments.length - 1);
    element.currentTime = sourceTime(value, playFrom);
    void element.play().catch(() => setPlaying(false));
    const update = () => {
      const s = value.segments[segmentIndex];
      if (element.currentTime >= s.end - 0.04) {
        elapsed += s.end - s.start;
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
          Math.max(0, element.currentTime - value.segments[segmentIndex].start),
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
        position > offset + 0.1 && position < offset + s.end - s.start - 0.1;
      if (!match) offset += s.end - s.start;
      return match;
    });
    if (index < 0 || value.segments.length >= 12) return;
    const s = value.segments[index],
      at = s.start + position - offset;
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
      <div className="social-edit-preview">
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
          style={videoPreviewFrame(sourceSize.width, sourceSize.height, value)}
        />
        {value.captions
          .filter((c) => position >= c.start && position <= c.end)
          .map((c, i) => (
            <span
              className="social-edit-caption"
              key={i}
              style={{
                top: `${c.y * 100}%`,
                transform: `translateY(-${c.y * 100}%)`,
              }}
            >
              {c.text}
            </span>
          ))}
        {overlay}
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
            {position.toFixed(1)} / {duration.toFixed(1)} s
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
