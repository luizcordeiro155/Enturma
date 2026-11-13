"use client";
/* eslint-disable @next/next/no-img-element -- private authenticated social media */
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { mediaUrl, type SocialMedia } from "@/lib/social";
import { mediaAspect } from "@/lib/social-media";
import { useAutoplayInView } from "./use-autoplay-in-view";

function FeedVideo({
  media,
  autoplay,
}: {
  media: SocialMedia;
  autoplay: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  useAutoplayInView(ref, autoplay);
  return (
    <>
      <video
        ref={ref}
        data-testid="post-video"
        src={mediaUrl(media.id)}
        poster={mediaUrl(media.id, true)}
        muted={muted}
        loop
        playsInline
        draggable={false}
        preload="none"
        // Without autoplay the person starts playback, so the native controls stay.
        controls={!autoplay}
        onClick={(event) => {
          if (!autoplay) return;
          const video = event.currentTarget;
          if (video.paused) void video.play()?.catch(() => {});
          else video.pause();
        }}
      />
      {autoplay && (
        <button
          type="button"
          className="social-media-sound"
          aria-label={muted ? "Ativar som do vídeo" : "Silenciar vídeo"}
          aria-pressed={!muted}
          onClick={(event) => {
            event.stopPropagation();
            setMuted((value) => !value);
          }}
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      )}
    </>
  );
}

/**
 * Edge-to-edge media for one publication. With several items it is a swipeable
 * strip with position dots; it only claims the horizontal gesture in that case.
 */
export function SocialMediaCarousel({
  media,
  authorName,
  autoplay,
}: {
  media: SocialMedia[];
  authorName: string;
  autoplay: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const many = media.length > 1;
  function go(next: number) {
    const target = Math.max(0, Math.min(media.length - 1, next));
    setIndex(target);
    const strip = track.current;
    strip?.scrollTo?.({
      left: target * strip.clientWidth,
      behavior: matchMedia?.("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }
  return (
    <div
      className="social-carousel"
      data-single={!many}
      data-social-gesture={many ? "ignore" : undefined}
      aria-label="Mídias da publicação"
      style={
        {
          "--social-media-aspect": mediaAspect(
            media[0]?.width,
            media[0]?.height,
          ),
        } as React.CSSProperties
      }
    >
      <div
        ref={track}
        className="social-carousel-track"
        tabIndex={many ? 0 : undefined}
        onScroll={(event) => {
          const strip = event.currentTarget;
          if (strip.clientWidth)
            setIndex(Math.round(strip.scrollLeft / strip.clientWidth));
        }}
        onKeyDown={(event) => {
          if (!many) return;
          if (event.key === "ArrowRight") go(index + 1);
          if (event.key === "ArrowLeft") go(index - 1);
        }}
      >
        {media.map((item, position) => (
          <figure key={item.id}>
            {item.kind === "VIDEO" ? (
              <FeedVideo media={item} autoplay={autoplay} />
            ) : (
              <img
                src={mediaUrl(item.id)}
                alt={`Imagem ${position + 1} da publicação de ${authorName}`}
                loading="lazy"
                draggable={false}
              />
            )}
          </figure>
        ))}
      </div>
      {many && (
        <>
          <button
            type="button"
            className="social-carousel-arrow social-carousel-previous"
            aria-label="Mídia anterior"
            disabled={index === 0}
            onClick={(event) => {
              event.stopPropagation();
              go(index - 1);
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            className="social-carousel-arrow social-carousel-next"
            aria-label="Próxima mídia"
            disabled={index === media.length - 1}
            onClick={(event) => {
              event.stopPropagation();
              go(index + 1);
            }}
          >
            <ChevronRight size={20} />
          </button>
          <div
            className="social-carousel-dots"
            role="tablist"
            aria-label="Posição no carrossel"
          >
            {media.map((item, position) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={position === index}
                aria-label={`Mídia ${position + 1} de ${media.length}`}
                onClick={(event) => {
                  event.stopPropagation();
                  go(position);
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
