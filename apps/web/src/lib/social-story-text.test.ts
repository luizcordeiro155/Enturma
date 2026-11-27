import { describe, expect, it } from "vitest";
import {
  STORY_LIMITS,
  cleanStoryTexts,
  dragStoryText,
  freeStorySpot,
  inkOn,
  insertToken,
  newStoryText,
  nudgeStoryText,
  replaceToken,
  storyTextParts,
  tokenAt,
  transformStoryText,
} from "./social-story-text";

describe("textos do Story", () => {
  it("um texto novo nasce no meio, branco e sem destaque", () => {
    expect(newStoryText("Oi")).toEqual({
      text: "Oi",
      x: 0.5,
      y: 0.42,
      size: 0.075,
      font: "CLASSIC",
      color: "#ffffff",
      style: "PLAIN",
      align: "CENTER",
      rotation: 0,
    });
  });

  it("um texto novo não nasce em cima de outro", () => {
    expect(freeStorySpot([])).toBe(0.42);
    const first = newStoryText("a");
    expect(freeStorySpot([first])).toBe(0.56);
    expect(freeStorySpot([first, newStoryText("b", { y: 0.56 })])).toBe(0.28);
    // um texto levado para o canto não ocupa o meio
    expect(freeStorySpot([newStoryText("c", { x: 0.1, y: 0.42 })])).toBe(0.42);
  });

  it("arrastar move na proporção da tela e não deixa sair dela", () => {
    const start = newStoryText("Oi");
    const moved = dragStoryText(start, 39, -84.4, { width: 390, height: 844 });
    expect(moved.item.x).toBeCloseTo(0.6);
    expect(moved.item.y).toBeCloseTo(0.32);
    const out = dragStoryText(start, 5000, 5000, { width: 390, height: 844 });
    expect(out.item.x).toBe(STORY_LIMITS.max);
    expect(out.item.y).toBe(STORY_LIMITS.max);
  });

  it("perto do meio o texto encaixa no centro e avisa a guia", () => {
    const start = { ...newStoryText("Oi"), x: 0.3, y: 0.2 };
    const snapped = dragStoryText(start, 0.205 * 390, 0, {
      width: 390,
      height: 844,
    });
    expect(snapped.item.x).toBe(0.5);
    expect(snapped.centerX).toBe(true);
    expect(snapped.centerY).toBe(false);
  });

  it("as setas movem um passo exato, sem o encaixe do centro", () => {
    const moved = nudgeStoryText(newStoryText("Oi"), 0.01, -0.05);
    expect(moved.x).toBe(0.51);
    expect(moved.y).toBe(0.37);
    expect(nudgeStoryText(newStoryText("Oi"), 9, 9)).toMatchObject({
      x: STORY_LIMITS.max,
      y: STORY_LIMITS.max,
    });
  });

  it("pinçar muda o tamanho e gira, dentro dos limites", () => {
    const start = newStoryText("Oi");
    const bigger = transformStoryText(start, 2, 30);
    expect(bigger.size).toBeCloseTo(0.15);
    expect(bigger.rotation).toBe(30);
    expect(transformStoryText(start, 100, 0).size).toBe(STORY_LIMITS.maxSize);
    expect(transformStoryText(start, 0.001, 0).size).toBe(STORY_LIMITS.minSize);
    expect(
      transformStoryText({ ...start, rotation: 170 }, 1, 30).rotation,
    ).toBe(-160);
    // quase reto encaixa em 0°
    expect(transformStoryText({ ...start, rotation: 0 }, 1, 2).rotation).toBe(
      0,
    );
  });

  it("limpa o que vai ser salvo: sem vazios, sem excesso e com valores válidos", () => {
    const cleaned = cleanStoryTexts([
      { text: "   ", x: 0.5, y: 0.5 },
      {
        text: "  Ideia  ",
        x: 2,
        y: -1,
        size: 9,
        rotation: 400,
        color: "red",
        font: "X" as never,
      },
      ...Array.from({ length: 20 }, (_, i) => newStoryText(`t${i}`)),
    ]);
    expect(cleaned).toHaveLength(STORY_LIMITS.items);
    expect(cleaned[0]).toMatchObject({
      text: "Ideia",
      x: STORY_LIMITS.max,
      y: STORY_LIMITS.min,
      size: STORY_LIMITS.maxSize,
      rotation: 40,
      color: "#ffffff",
      font: "CLASSIC",
    });
    expect(
      cleanStoryTexts([{ text: "a".repeat(400), x: 0.5, y: 0.5 }])[0].text,
    ).toHaveLength(STORY_LIMITS.text);
  });

  it("um texto antigo, sem estilo, mantém o destaque suave que já tinha", () => {
    expect(cleanStoryTexts([{ text: "📚", x: 0.5, y: 0.3 }])[0]).toMatchObject({
      style: "SOFT",
      color: "#ffffff",
      font: "CLASSIC",
      align: "CENTER",
      rotation: 0,
    });
  });

  it("escolhe a tinta que dá leitura sobre a cor do destaque", () => {
    expect(inkOn("#ffffff")).toBe("#111111");
    expect(inkOn("#d8ef79")).toBe("#111111");
    expect(inkOn("#111111")).toBe("#ffffff");
    expect(inkOn("#3a86ff")).toBe("#ffffff");
  });
});

describe("marcações no texto do Story", () => {
  it("acha a @menção ou a #hashtag que está sendo digitada", () => {
    expect(tokenAt("oi @an", 6)).toEqual({
      kind: "@",
      query: "an",
      start: 3,
      end: 6,
    });
    expect(tokenAt("#estu dos", 5)).toEqual({
      kind: "#",
      query: "estu",
      start: 0,
      end: 5,
    });
    expect(tokenAt("@", 1)).toEqual({ kind: "@", query: "", start: 0, end: 1 });
    expect(tokenAt("ana@exemplo", 11)).toBeNull();
    expect(tokenAt("sem marca", 4)).toBeNull();
  });

  it("insere o sinal no cursor, com espaço só quando precisa", () => {
    expect(insertToken("", 0, "@")).toEqual({ value: "@", caret: 1 });
    expect(insertToken("Bora", 4, "#")).toEqual({ value: "Bora #", caret: 6 });
    expect(insertToken("Bora ", 5, "@")).toEqual({ value: "Bora @", caret: 6 });
    expect(insertToken("ab", 1, "#")).toEqual({ value: "a #b", caret: 3 });
  });

  it("troca só a marcação em digitação pela escolhida", () => {
    const token = tokenAt("oi @an tudo", 6)!;
    expect(replaceToken("oi @an tudo", token, "@ana_lima")).toEqual({
      value: "oi @ana_lima tudo",
      caret: 13,
    });
    const end = tokenAt("#est", 4)!;
    expect(replaceToken("#est", end, "#estudos")).toEqual({
      value: "#estudos ",
      caret: 9,
    });
  });

  it("separa o texto em trechos, menções e hashtags", () => {
    expect(storyTextParts("Bora @ana_lima pro #TCC! a@b.com")).toEqual([
      { kind: "text", value: "Bora " },
      { kind: "@", value: "@ana_lima", name: "ana_lima" },
      { kind: "text", value: " pro " },
      { kind: "#", value: "#TCC", name: "tcc" },
      { kind: "text", value: "! a@b.com" },
    ]);
  });
});
