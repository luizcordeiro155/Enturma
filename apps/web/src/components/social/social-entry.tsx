"use client";
import { Aperture } from "lucide-react";
import { useAppShellState } from "../app-shell-state";
import { NavigationLink } from "../navigation-link";
export function SocialEntry({
  person,
  onNavigate,
  close,
}: {
  person?: string;
  onNavigate?: (href: string) => void;
  close?: () => void;
}) {
  const { socialEnabled } = useAppShellState();
  if (!socialEnabled) return null;
  const href = person ? `/social?person=${person}` : "/social";
  if (onNavigate)
    return (
      <button className="text-button" onClick={() => onNavigate(href)}>
        <Aperture size={18} /> Posts, Clips e seguidores
      </button>
    );
  return (
    <NavigationLink href={href} onClick={close}>
      <Aperture size={21} />{" "}
      {person ? "Posts, Clips e seguidores" : "Enturma Social"}
    </NavigationLink>
  );
}
