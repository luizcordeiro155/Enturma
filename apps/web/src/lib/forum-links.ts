export function splitLinks(text: string): { text: string; href?: string }[] {
  const parts: { text: string; href?: string }[] = [];
  let end = 0;
  for (const match of text.matchAll(/(?:https?:\/\/|www\.)[^\s<>"'`]+/gi)) {
    const start = match.index!;
    let label = match[0].replace(/[.,;:!?]+$/g, "");
    while (
      label.endsWith(")") &&
      (label.match(/\)/g)?.length ?? 0) > (label.match(/\(/g)?.length ?? 0)
    )
      label = label.slice(0, -1);
    if (start > end) parts.push({ text: text.slice(end, start) });
    let href: string | undefined;
    try {
      const url = new URL(
        label.toLowerCase().startsWith("www.") ? `https://${label}` : label,
      );
      if (
        ["https:", "http:"].includes(url.protocol) &&
        url.hostname &&
        !url.username &&
        !url.password
      )
        href = url.href;
    } catch {}
    parts.push({ text: label, href });
    end = start + label.length;
  }
  if (end < text.length) parts.push({ text: text.slice(end) });
  return parts;
}
