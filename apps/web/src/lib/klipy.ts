export type KlipyGif = { id: string; title: string; slug: string; url: string; preview: string };
export type KlipyItem =
  | { kind: "gif"; gif: KlipyGif }
  | { kind: "ad"; id: string; title: string; href?: string; preview?: string };

type JsonObject = Record<string, unknown>;
function object(value: unknown): JsonObject | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonObject : undefined;
}
function text(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

/** Do not rewrite media URLs: KLIPY delivery parameters must be preserved. */
export function providerMediaUrl(value: unknown): string | undefined {
  const raw = text(value);
  if (!raw || raw !== raw.trim() || raw.length > 3500 || /\s/.test(raw)) return;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password) return;
    if (!["static.klipy.com", "static1.klipy.com", "static2.klipy.com"].includes(url.hostname)) return;
    if (!/\.(gif|webp)$/i.test(url.pathname)) return;
    return raw;
  } catch { return; }
}
export function providerMessageUrl(value: string) {
  return providerMediaUrl(value);
}
function rendition(file: JsonObject | undefined, sizes: string[], formats: string[]) {
  for (const size of sizes) {
    const variants = object(file?.[size]);
    for (const format of formats) {
      const url = providerMediaUrl(object(variants?.[format])?.url);
      if (url) return url;
    }
  }
}
export function parseKlipyItems(payload: unknown): KlipyItem[] {
  const data = object(payload)?.data;
  const nested = object(data);
  const items = Array.isArray(data) ? data
    : Array.isArray(nested?.data) ? nested.data
    : Array.isArray(nested?.items) ? nested.items : [];
  const results: KlipyItem[] = [];
  for (const [index, entry] of items.entries()) {
    const item = object(entry);
    const id = String(item?.id ?? index);
    const title = text(item?.title) ?? "GIF da KLIPY";
    if (item?.type === "ad") {
      results.push({kind: "ad", id, title,
        href: text(item?.click_url) || undefined,
        preview: providerMediaUrl(item?.preview_url)});
      continue;
    }
    const file = object(item?.file);
    const url = rendition(file, ["md", "hd", "sm", "xs"], ["gif", "webp"]);
    const preview = rendition(file, ["sm", "xs", "md", "hd"], ["webp", "gif"]);
    if (url) results.push({kind: "gif", gif: {id, title, slug: text(item?.slug) ?? "",
      url, preview: preview ?? url}});
  }
  return results;
}
