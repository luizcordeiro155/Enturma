"use client";
import { useEffect, type RefObject } from "react";
import { chosenCosmetics, type CosmeticDetails } from "@/cosmetics/catalog";
import { mountCosmetics } from "@/cosmetics/stage";

/** Puts the profile's frame, avatar decoration and effect on its card. Renders nothing itself. */
export function ProfileCosmetics({
  card,
  details,
}: {
  card: RefObject<HTMLElement | null>;
  details?: CosmeticDetails;
}) {
  const { frame, avatar, effect, theme } = chosenCosmetics(details);
  useEffect(() => {
    if (!card.current) return;
    // Mounting again is what replays the entrance each time a profile opens.
    const stage = mountCosmetics(card.current, {
      frame,
      avatar,
      effect,
      theme,
    });
    return () => stage.destroy();
  }, [card, frame, avatar, effect, theme]);
  return null;
}
