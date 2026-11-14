"use client";
import { Volume2, VolumeX } from "lucide-react";

export type SocialVolumeLabels = {
  unmute: string;
  mute: string;
  volume: string;
};

const VIDEO_LABELS: SocialVolumeLabels = {
  unmute: "Ativar som do vídeo",
  mute: "Silenciar vídeo",
  volume: "Volume do vídeo",
};

export function SocialVideoVolume({
  volume,
  onVolumeChange,
  muted,
  onMutedChange,
  labels = VIDEO_LABELS,
}: {
  volume: number;
  onVolumeChange: (volume: number) => void;
  muted: boolean;
  onMutedChange: (muted: boolean) => void;
  labels?: SocialVolumeLabels;
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
          aria-label={labels.volume}
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
        aria-label={muted ? labels.unmute : labels.mute}
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
