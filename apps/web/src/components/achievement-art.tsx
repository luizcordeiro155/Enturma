"use client";
import { useId } from "react";

// Original Enturma medal illustrations: a different silhouette and centerpiece for every achievement.
const artworks: Record<
  string,
  { colors: [string, string]; path: string; detail: string; shape: string }
> = {
  FIRST_SPARK: {
    colors: ["#ffcd69", "#ff542f"],
    shape: "M32 3 52 17 57 42 32 61 7 42 12 17Z",
    path: "M34 12C39 26 51 29 44 43C36 57 14 47 19 33C22 26 30 24 34 12Z",
    detail: "M31 31C30 39 40 39 35 46C27 51 22 41 31 31Z",
  },
  STREAK_3: {
    colors: ["#83edc6", "#228e6e"],
    shape: "M17 5H47L59 32 47 59H17L5 32Z",
    path: "M14 27 24 17 34 27 24 37ZM30 39 40 29 50 39 40 49Z",
    detail: "M20 27 24 23 28 27 24 31ZM36 39 40 35 44 39 40 43Z",
  },
  STREAK_14: {
    colors: ["#ffdf83", "#d76b1c"],
    shape: "M32 2 54 12 58 43 32 62 6 43 10 12Z",
    path: "M14 37 24 15 32 24 40 15 50 37 39 47H25Z",
    detail: "M25 35 32 26 39 35 32 43ZM21 51H43",
  },
  GAMES_10: {
    colors: ["#b7e3ff", "#7760ce"],
    shape: "M32 3 53 15 60 32 53 49 32 61 11 49 4 32 11 15Z",
    path: "M20 20 32 13 44 20 49 32 42 45H22L15 32Z",
    detail: "M22 24 28 28 24 35 31 42M42 24 36 28 40 35 33 42M32 15V32",
  },
  ADVANCED_5: {
    colors: ["#fff399", "#f29926"],
    shape:
      "M32 1 42 9 56 10 55 27 63 38 49 48 44 61 32 56 20 61 15 48 1 38 9 27 8 10 22 9Z",
    path: "M17 19 24 25 32 14 40 25 47 19 43 39H21ZM25 43H39L44 49H20Z",
    detail: "M32 25 37 31 32 37 27 31Z",
  },
  UP_5: {
    colors: ["#a3f8d4", "#279e8b"],
    shape: "M12 7H52L59 43 32 60 5 43Z",
    path: "M16 20H48V39H32L21 48V39H16Z",
    detail: "M25 30 32 23 39 30M32 24V36",
  },
  UP_25: {
    colors: ["#ffda83", "#ed5e58"],
    shape: "M32 2 47 12 60 29 47 51 32 62 17 51 4 29 17 12Z",
    path: "M32 12 47 29H38V44H26V29H17Z",
    detail: "M16 43 21 49M48 43 43 49M25 52H39",
  },
  DISCUSSION_10: {
    colors: ["#cdd5ff", "#697bc8"],
    shape: "M14 4H50L60 24 53 52 32 61 11 52 4 24Z",
    path: "M12 18H37V34H23L17 40V34H12ZM29 29H52V46H45V52L38 46H29Z",
    detail: "M18 24H31M36 36H46M36 41H43",
  },
  MENTOR_10: {
    colors: ["#a4f3f6", "#307aa3"],
    shape: "M32 3 56 16 56 43 32 61 8 43 8 16Z",
    path: "M9 26 32 14 55 26 32 38ZM19 33V43Q32 53 45 43V33",
    detail: "M32 21 40 26 32 30 24 26ZM52 28V41",
  },
  ROOMS_5: {
    colors: ["#ffc99c", "#ad685b"],
    shape: "M32 3 55 16 59 39 44 57 20 57 5 39 9 16Z",
    path: "M16 40V24L32 14 48 24V40L32 50ZM22 29 32 23 42 29 32 36Z",
    detail: "M22 29V39L32 45 42 39V29M32 36V45",
  },
  HOURS_10: {
    colors: ["#fff08d", "#c38230"],
    shape: "M18 4H46L60 32 46 60H18L4 32Z",
    path: "M21 13H43V21L35 32 43 43V51H21V43L29 32 21 21Z",
    detail: "M24 19H40L32 28ZM24 46 32 37 40 46Z",
  },
  NOTEBOOK_3: {
    colors: ["#c1e8ff", "#447bc1"],
    shape: "M12 5H52L59 17V47L32 61 5 47V17Z",
    path: "M13 22 30 15 50 22V44L32 51 13 44ZM13 22 32 29 50 22M32 29V51",
    detail: "M20 25V39L25 41V27M38 33 45 30M38 39 45 36",
  },
  SUBJECTS_3: {
    colors: ["#b9f0ef", "#3a91a2"],
    shape:
      "M32 2 40 11 53 11 53 24 62 32 53 40 53 53 40 53 32 62 24 53 11 53 11 40 2 32 11 24 11 11 24 11Z",
    path: "M41 17 38 38 23 47 26 26Z",
    detail: "M41 17 26 26 38 38ZM18 16 16 20M48 44 46 48",
  },
  PRESENCE_30: {
    colors: ["#ffe08c", "#cf5fab"],
    shape:
      "M32 2 41 12 55 10 54 25 62 34 51 43 49 57 34 54 23 62 16 48 3 42 12 29 10 14 25 14Z",
    path: "M32 12 37 26 52 32 37 38 32 52 26 38 12 32 26 26Z",
    detail: "M32 25 39 32 32 39 25 32Z",
  },
  VETERAN: {
    colors: ["#d4fff5", "#6b86d9"],
    shape: "M32 1 56 12V37Q53 52 32 63Q11 52 8 37V12Z",
    path: "M17 17 32 10 47 17V35Q45 44 32 53Q19 44 17 35Z",
    detail: "M23 24 27 32 32 20 37 32 41 24 38 40H26Z",
  },
};
export function AchievementArt({
  code,
  size = 48,
}: {
  code: string;
  size?: number;
}) {
  const id = useId().replace(/:/g, "");
  const art = artworks[code] ?? artworks.SUBJECTS_3;
  return (
    <svg
      className="achievement-original-art"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-rim`} x2=".7" y2="1">
          <stop stopColor={art.colors[0]} />
          <stop offset=".48" stopColor={art.colors[1]} />
          <stop offset=".7" stopColor={art.colors[0]} />
          <stop offset="1" stopColor={art.colors[1]} />
        </linearGradient>
        <linearGradient id={`${id}-core`} x2="1" y2="1">
          <stop stopColor={art.colors[1]} />
          <stop offset="1" stopColor="#131d30" />
        </linearGradient>
      </defs>
      <path d={art.shape} fill={`url(#${id}-rim)`} />
      <path
        d={art.shape}
        fill={`url(#${id}-core)`}
        transform="translate(5.1 5.1) scale(.84)"
      />
      <path
        d={art.path}
        fill={`url(#${id}-rim)`}
        stroke={art.colors[0]}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d={art.detail}
        fill="#173043"
        stroke={art.colors[0]}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 14 15 15M48 11 51 13"
        stroke="#fff"
        strokeOpacity=".7"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
