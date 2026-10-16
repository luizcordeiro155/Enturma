export type ProfileVisualAppearance = {
  secondaryColor: string;
  theme: string;
  effect: string;
  layout: string;
  muralMode?: "PROFILE" | "DEFAULT" | "CUSTOM";
  muralColor?: string;
  muralSecondaryColor?: string;
  gradientAngle?: number;
  gradientFlow?: "STILL" | "FLOW";
  entrance?: "NONE" | "RISE" | "BOOK" | "ORBIT";
};

export const PROFILE_PALETTES = [
  { name: "Enturma", primary: "#15764d", secondary: "#123339" },
  { name: "Aurora", primary: "#6614a8", secondary: "#143bc3" },
  { name: "Cereja", primary: "#b51038", secondary: "#240758" },
  { name: "Oceano", primary: "#007b86", secondary: "#1721a3" },
  { name: "Solar", primary: "#ffb52e", secondary: "#ef6351" },
] as const;

export function profileColor(value: string | undefined, fallback = "#15764d") {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

/** Keep vivid surfaces and choose readable copy, including gradients with mixed luminance. */
export function profileContrast(first: string, second: string) {
  const luminance = (color: string) => {
    const channels = [1, 3, 5].map((offset) => {
      const s =
        parseInt(profileColor(color).slice(offset, offset + 2), 16) / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const values = [luminance(first), luminance(second)];
  if (Math.min(...values) >= 0.18)
    return { ink: "#080b12", panel: "transparent" };
  if (Math.max(...values) <= 0.18)
    return { ink: "#ffffff", panel: "transparent" };
  return { ink: "#ffffff", panel: "rgba(8,11,18,.78)" };
}
