"use client";
import { useEffect, useState } from "react";
import { Aperture } from "lucide-react";
import { api } from "@/lib/api";
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
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let active = true;
    api<{ enabled: boolean }>("/social/capabilities")
      .then((r) => {
        if (active) setEnabled(r.enabled);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  if (!enabled) return null;
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
