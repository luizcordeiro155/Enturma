/** Accept only a room code or an invitation from this Enturma installation. */
export function roomInviteCode(raw: string, origin: string): string | null {
  const value = raw.trim();
  if (/^[A-Z2-9]{8}$/i.test(value)) return value.toUpperCase();
  try {
    const url = new URL(value, origin);
    if (url.origin !== new URL(origin).origin || url.username || url.password)
      return null;
    return (
      url.pathname.match(/^\/join\/([A-Z2-9]{8})\/?$/i)?.[1].toUpperCase() ??
      null
    );
  } catch {
    return null;
  }
}
