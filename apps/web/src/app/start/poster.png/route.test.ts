// @vitest-environment node
import { describe, expect, it } from "vitest";
import * as route from "./route";

describe("imagem de apresentação", () => {
  it("não declara configuração de segmento, que quebra o build com cacheComponents", () => {
    expect(Object.keys(route)).toEqual(["GET"]);
  });

  it("é um PNG vertical 9:16", async () => {
    const response = await route.GET();
    expect(response.headers.get("content-type")).toBe("image/png");
    const png = Buffer.from(await response.arrayBuffer());
    expect(png.subarray(1, 4).toString("latin1")).toBe("PNG");
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    expect(width * 16).toBe(height * 9);
    expect(width).toBeGreaterThanOrEqual(900);
  });
});
