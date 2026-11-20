type Presence = { online?: boolean; lastSeenAt?: string | null };

const part = (
  date: Date,
  zone: string | undefined,
  options: Intl.DateTimeFormatOptions,
) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: zone, ...options }).format(date);

/** The calendar day in the reader's time zone, as a number that counts days. */
function dayNumber(date: Date, zone?: string) {
  const [day, month, year] = part(date, zone, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
    .split("/")
    .map(Number);
  return Math.round(Date.UTC(year, month - 1, day) / 86_400_000);
}

/**
 * The line under a friend's name in a conversation: "online", or when they last had
 * Enturma open. Empty when the friend does not share it.
 */
export function presenceLine(
  friend: Presence,
  now: Date = new Date(),
  zone?: string,
) {
  if (friend.online) return "online";
  if (!friend.lastSeenAt) return "";
  let seen = new Date(friend.lastSeenAt);
  if (Number.isNaN(seen.getTime())) return "";
  // The server's clock and this device's can differ by a little.
  if (seen > now) seen = now;
  const time = part(seen, zone, { hour: "2-digit", minute: "2-digit" });
  const days = dayNumber(now, zone) - dayNumber(seen, zone);
  if (days <= 0) return `visto por último hoje às ${time}`;
  if (days === 1) return `visto por último ontem às ${time}`;
  const sameYear =
    part(seen, zone, { year: "numeric" }) ===
    part(now, zone, { year: "numeric" });
  return sameYear
    ? `visto por último em ${part(seen, zone, { day: "2-digit", month: "2-digit" })} às ${time}`
    : `visto por último em ${part(seen, zone, { day: "2-digit", month: "2-digit", year: "numeric" })}`;
}
