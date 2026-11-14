"use client";
import { Volume2, VolumeX } from "lucide-react";

export function SocialVideoVolume({
  volume,
  onVolumeChange,
  muted,
  onMutedChange,
}: {
  volume: number;
  onVolumeChange: (volume: number) => void;
  muted: boolean;
  onMutedChange: (muted: boolean) => void;
}) {
  return (
    <div
      className="social-video-volume"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="social-volume-slider">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          aria-label="Volume do vídeo"
          aria-valuetext={`${Math.round((muted ? 0 : volume) * 100)}%`}
          value={muted ? 0 : volume}
          onChange={(event) => {
            const next = Number(event.target.value);
            onVolumeChange(next);
            onMutedChange(next === 0);
          }}
        />
      </div>
      <button
        type="button"
        className="social-media-sound"
        aria-label={muted ? "Ativar som do vídeo" : "Silenciar vídeo"}
        aria-pressed={!muted}
        onClick={() => {
          if (muted && volume === 0) {
            onVolumeChange(1);
          }
          onMutedChange(!muted);
        }}
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
    </div>
  );
}
