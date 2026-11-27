"use client";
import "@fontsource/playfair-display/700.css";
import "@fontsource/caveat/700.css";
import "@fontsource/bebas-neue/400.css";
import "@fontsource/space-mono/700.css";
import "@fontsource/fredoka/600.css";
import "./story-text.css";
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { StoryOverlay } from "@/lib/social";
import {
  inkOn,
  storyTextParts,
  styledStoryText,
} from "@/lib/social-story-text";
import { NavigationLink } from "../navigation-link";
import { announceHashtag, hashtagHref } from "./social-hashtag";

/** Position, size and look of one text, as CSS: the same in the editor and in the published Story. */
export function storyTextStyle(item: StoryOverlay) {
  const text = styledStoryText(item);
  return {
    style: {
      left: `${text.x * 100}%`,
      top: `${text.y * 100}%`,
      transform: `translate(-50%, -50%) rotate(${text.rotation}deg)`,
      "--story-size": String(text.size),
      "--story-ink": text.color,
      "--story-on": inkOn(text.color),
    } as CSSProperties,
    "data-font": text.font,
    "data-look": text.style,
    "data-align": text.align,
  };
}

type Mentioned = { id: string; username: string };

/** A text's words; in a published Story its @mentions and #hashtags can be opened. */
export function StoryTextContent({
  text,
  links = false,
  people = [],
  onPerson,
}: {
  text: string;
  links?: boolean;
  people?: readonly Mentioned[];
  onPerson?: (id: string) => void;
}) {
  return (
    <>
      {storyTextParts(text).map((part, index) => {
        if (part.kind === "text") return part.value;
        if (!links)
          return (
            <span key={index} className="story-text-mark">
              {part.value}
            </span>
          );
        if (part.kind === "#")
          return (
            <NavigationLink
              key={index}
              className="story-text-mark"
              href={hashtagHref(part.name)}
              onClick={(event) => {
                if (announceHashtag(part.name)) {
                  event.preventDefault();
                  event.stopPropagation();
                }
              }}
            >
              {part.value}
            </NavigationLink>
          );
        const known = people.find(
          (person) => person.username.toLowerCase() === part.name,
        );
        return (
          <NavigationLink
            key={index}
            className="story-text-mark"
            href={`/social?q=${encodeURIComponent(part.value)}`}
            onClick={(event) => {
              if (!known || !onPerson) return;
              event.preventDefault();
              event.stopPropagation();
              onPerson(known.id);
            }}
          >
            {part.value}
          </NavigationLink>
        );
      })}
    </>
  );
}

/**
 * The texts over a Story. With `ratio` the layer takes exactly the area the media takes
 * inside its stage, so a text sits where its author placed it on every screen.
 */
export function StoryDecorations({
  items,
  ratio,
  links = false,
  people,
  onPerson,
}: {
  items: StoryOverlay[];
  ratio?: number;
  links?: boolean;
  people?: readonly Mentioned[];
  onPerson?: (id: string) => void;
}) {
  const layer = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ width: number; height: number }>();
  useLayoutEffect(() => {
    const stage = layer.current?.parentElement;
    if (!ratio || !stage) return;
    const fit = () => {
      const width = stage.clientWidth,
        height = stage.clientHeight;
      if (!width || !height) return;
      const fitted =
        width / height > ratio
          ? { width: Math.round(height * ratio), height }
          : { width, height: Math.round(width / ratio) };
      setBox((previous) =>
        previous?.width === fitted.width && previous.height === fitted.height
          ? previous
          : fitted,
      );
    };
    fit();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [ratio]);
  if (!items.length) return null;
  return (
    <div
      ref={layer}
      className="social-story-decorations"
      data-fitted={ratio && box ? "true" : undefined}
      style={
        ratio && box
          ? { width: `${box.width}px`, height: `${box.height}px` }
          : undefined
      }
    >
      {items.map((item, index) => (
        <span key={index} className="story-text" {...storyTextStyle(item)}>
          <StoryTextContent
            text={item.text}
            links={links}
            people={people}
            onPerson={onPerson}
          />
        </span>
      ))}
    </div>
  );
}
