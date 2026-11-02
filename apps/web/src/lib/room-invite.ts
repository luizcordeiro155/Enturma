/** Accept only a room code or an invitation from this Enturma installation. */
export function roomInviteCode(raw: string, origin: string): string | null {
  const value = raw.trim();
  if (/^[A-Z2-9]{8}$/i.test(value)) return value.toUpperCase();
  try {
    const url = new URL(value, origin);
    const trusted = new Set([
      new URL(origin).origin,
      "https://enturma-flax.vercel.app",
    ]);
    if (!trusted.has(url.origin) || url.username || url.password) return null;
    return (
      url.pathname.match(/^\/join\/([A-Z2-9]{8})\/?$/i)?.[1].toUpperCase() ??
      null
    );
  } catch {
    return null;
  }
}

/** Preview only actual Enturma links; a random eight-letter word is not an invite. */
export function roomInvitationCodes(text: string, origin: string): string[] {
  const prose = text.replace(/```[\s\S]*?```|`[^`\n]*`/g, "");
  const links =
    prose.match(
      /https?:\/\/[^\s<>"'`]+|(?:^|\s)\/join\/[A-Z2-9]{8}\/?(?=$|[\s),.!?])/gi,
    ) ?? [];
  const codes = new Set<string>();
  for (const link of links) {
    const code = roomInviteCode(link.trim().replace(/[),.!?;]+$/, ""), origin);
    if (code) codes.add(code);
    // Bound metadata requests and keep long conversations compact.
    if (codes.size === 3) break;
  }
  return [...codes];
}

export type RoomInvitation = {
  id: string;
  title: string;
  subjectName: string;
  status: string;
  endsAt: string;
  available: boolean;
  hasAvatar: boolean;
  hasBanner: boolean;
  mediaVersion: number;
  participantCount: number;
};
