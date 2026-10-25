import { describe, expect, it } from "vitest";
import { parseKlipyItems, providerMediaUrl, providerMessageUrl } from "./klipy";

describe("KLIPY provider safety", () => {
  const url = "https://static.klipy.com/reactions/one.gif?tracking=abc";
  it("preserves official media URLs including tracking", () => {
    expect(providerMessageUrl(url)).toBe(url);
    expect(providerMediaUrl(url)).toBe(url);
  });
  it("blocks fake hosts, unsafe schemes and HTML payloads", () => {
    for (const input of [
      "http://static.klipy.com/a.gif",
      "https://static.klipy.com.fake.example/a.gif",
      "https://static.klipy.com/a.svg",
      "javascript:alert(1)",
      "https://static.klipy.com/a.gif hello",
    ]) expect(providerMediaUrl(input)).toBeUndefined();
  });
  it("preserves ad placement without mixing it with normal GIFs", () => {
    const response = { data: { data: [
      { type: "gif", id: "1", title: "Teste", slug: "teste",
        file: { md: { gif: { url } } } },
      { type: "ad", id: "ad-1", title: "Patrocinado",
        click_url: "https://example.com/ad" },
    ] } };
    const items = parseKlipyItems(response);
    expect(items.map(i => i.kind)).toEqual(["gif", "ad"]);
    expect(items[0].kind === "gif" && items[0].gif.url).toBe(url);
  });
});
