export const MAX_PROFILE_LINKS = 6;

export type LinkKind =
  | "github"
  | "gitlab"
  | "instagram"
  | "facebook"
  | "linkedin"
  | "whatsapp"
  | "youtube"
  | "x"
  | "tiktok"
  | "twitch"
  | "discord"
  | "telegram"
  | "email"
  | "site";
export type LinkInfo = { kind: LinkKind; name: string; detail: string };

const at = (handle: string) => (handle ? `@${handle.replace(/^@/, "")}` : "");
const SERVICES: {
  kind: LinkKind;
  name: string;
  hosts: string[];
  detail: (segments: string[]) => string;
}[] = [
  {
    kind: "github",
    name: "GitHub",
    hosts: ["github.com"],
    detail: (s) => s[0] ?? "",
  },
  {
    kind: "gitlab",
    name: "GitLab",
    hosts: ["gitlab.com"],
    detail: (s) => s[0] ?? "",
  },
  {
    kind: "instagram",
    name: "Instagram",
    hosts: ["instagram.com"],
    detail: (s) => at(s[0] ?? ""),
  },
  {
    kind: "facebook",
    name: "Facebook",
    hosts: ["facebook.com", "fb.com", "fb.me"],
    detail: (s) => (s[0] && !s[0].includes(".php") ? s[0] : ""),
  },
  {
    kind: "linkedin",
    name: "LinkedIn",
    hosts: ["linkedin.com"],
    detail: (s) =>
      ["in", "company", "school"].includes(s[0]) ? (s[1] ?? "") : "",
  },
  // A phone number is personal data: the label never repeats it.
  {
    kind: "whatsapp",
    name: "WhatsApp",
    hosts: ["wa.me", "whatsapp.com"],
    detail: () => "",
  },
  {
    kind: "youtube",
    name: "YouTube",
    hosts: ["youtube.com", "youtu.be"],
    detail: (s) => (s[0]?.startsWith("@") ? s[0] : ""),
  },
  {
    kind: "x",
    name: "X",
    hosts: ["x.com", "twitter.com"],
    detail: (s) => at(s[0] ?? ""),
  },
  {
    kind: "tiktok",
    name: "TikTok",
    hosts: ["tiktok.com"],
    detail: (s) => at(s[0] ?? ""),
  },
  {
    kind: "twitch",
    name: "Twitch",
    hosts: ["twitch.tv"],
    detail: (s) => s[0] ?? "",
  },
  {
    kind: "discord",
    name: "Discord",
    hosts: ["discord.gg", "discord.com"],
    detail: () => "",
  },
  {
    kind: "telegram",
    name: "Telegram",
    hosts: ["t.me", "telegram.me"],
    detail: (s) => at(s[0] ?? ""),
  },
];

function parse(href: string) {
  try {
    return new URL(href);
  } catch {
    return null;
  }
}

/** Says which service a saved link points to, judging only by its real host. */
export function describeLink(href: string): LinkInfo {
  const url = parse(href);
  if (url?.protocol === "mailto:")
    return {
      kind: "email",
      name: "E-mail",
      detail: decodeURIComponent(url.pathname),
    };
  const host = (url?.hostname ?? "").toLowerCase().replace(/^www\./, "");
  const service = SERVICES.find((item) =>
    item.hosts.some((known) => host === known || host.endsWith(`.${known}`)),
  );
  if (!service) return { kind: "site", name: "Site", detail: host };
  const segments = (url?.pathname ?? "")
    .split("/")
    .filter(Boolean)
    .map((part) => decodeURIComponent(part));
  return {
    kind: service.kind,
    name: service.name,
    detail: service.detail(segments),
  };
}

/** Turns what was typed into a link the profile accepts, or "" when it is not one. */
export function normalizeLink(text: string): string {
  const value = text.trim();
  if (!value || /\s/.test(value)) return "";
  if (/^[^@/:]+@[^@/:]+\.[^@/:]+$/.test(value)) return `mailto:${value}`;
  const url = parse(
    /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`,
  );
  if (!url) return "";
  if (url.protocol === "mailto:")
    return /^[^@/:]+@[^@/:]+\.[^@/:]+$/.test(url.pathname) ? value : "";
  if (!["https:", "http:"].includes(url.protocol)) return "";
  if (url.username || url.password || !url.hostname.includes(".")) return "";
  return /^https?:/i.test(value) ? value : `https://${value}`;
}

/** The links a profile shows: the old single site first, then the list. */
export function profileLinks(
  details?: { website?: string; links?: string[] } | null,
): string[] {
  const seen = new Set<string>();
  for (const item of [details?.website ?? "", ...(details?.links ?? [])]) {
    const href = normalizeLink(item);
    if (href) seen.add(href);
  }
  return [...seen].slice(0, MAX_PROFILE_LINKS);
}
