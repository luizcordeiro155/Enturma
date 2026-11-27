import { describe, expect, it } from "vitest";
import { photoFamily, PHOTO_ACCEPT } from "./photo-import";

const bytes = (...parts: (string | number[])[]) =>
  new Uint8Array(
    parts.flatMap((part) =>
      typeof part === "string" ? [...part].map((c) => c.charCodeAt(0)) : part,
    ),
  );
const box = (brand: string) =>
  bytes([0, 0, 0, 24], "ftyp", brand, [0, 0, 0, 0]);

describe("que tipo de foto é este arquivo", () => {
  it("reconhece pelo conteúdo o que o navegador já mostra", () => {
    expect(photoFamily(bytes([0xff, 0xd8, 0xff, 0xe0]), "x", "")).toBe("web");
    expect(photoFamily(bytes([0x89], "PNG\r\n"), "x", "")).toBe("web");
    expect(photoFamily(bytes("GIF89a"), "x", "")).toBe("web");
    expect(photoFamily(bytes("RIFF", [1, 2, 3, 4], "WEBPVP8 "), "x", "")).toBe(
      "web",
    );
  });

  it("reconhece as fotos de celular em HEIC/HEIF, com qualquer nome", () => {
    for (const brand of ["heic", "heix", "mif1", "msf1", "hevc", "heim"])
      expect(photoFamily(box(brand), "IMG_0001.jpg", "image/jpeg")).toBe(
        "heif",
      );
    // the gallery may hand over a file with no readable start
    expect(photoFamily(new Uint8Array(), "20261127_105400.HEIC", "")).toBe(
      "heif",
    );
    expect(photoFamily(new Uint8Array(), "foto", "image/heif")).toBe("heif");
  });

  it("reconhece RAW de câmeras e de celulares", () => {
    // TIFF by its header: DNG, NEF, ARW, CR2, PEF…
    expect(photoFamily(bytes("II*", [0], [8, 0, 0, 0]), "foto.dng", "")).toBe(
      "raw",
    );
    expect(
      photoFamily(bytes("MM", [0], "*", [0, 0, 0, 8]), "foto.nef", ""),
    ).toBe("raw");
    expect(photoFamily(box("crx "), "foto.cr3", "")).toBe("raw");
    expect(photoFamily(bytes("FUJIFILMCCD-RAW "), "foto", "")).toBe("raw");
    expect(photoFamily(bytes("IIU", [0]), "foto.rw2", "")).toBe("raw");
    expect(photoFamily(bytes("IIRO"), "foto.orf", "")).toBe("raw");
    // by name when the start says nothing
    for (const name of ["a.DNG", "a.cr2", "a.arw", "a.raf", "a.srw", "a.x3f"])
      expect(
        photoFamily(new Uint8Array(8), name, "application/octet-stream"),
      ).toBe("raw");
    expect(photoFamily(new Uint8Array(8), "a", "image/x-adobe-dng")).toBe(
      "raw",
    );
  });

  it("deixa o navegador tentar os outros formatos de imagem", () => {
    expect(photoFamily(box("avif"), "foto.avif", "image/avif")).toBe("other");
    expect(
      photoFamily(bytes("BM", [0, 0, 0, 0]), "foto.bmp", "image/bmp"),
    ).toBe("other");
  });

  it("não trata como foto o que não é imagem", () => {
    expect(photoFamily(bytes("%PDF-1.7"), "foto.jpg", "image/jpeg")).toBeNull();
    expect(photoFamily(bytes("<html>"), "foto.png", "text/html")).toBeNull();
    expect(photoFamily(box("isom"), "video.mp4", "video/mp4")).toBeNull();
    expect(
      photoFamily(bytes("<svg xmlns="), "a.svg", "image/svg+xml"),
    ).toBeNull();
  });

  it("o seletor de arquivos mostra também HEIC e RAW", () => {
    expect(PHOTO_ACCEPT).toContain("image/*");
    for (const ext of [
      ".heic",
      ".heif",
      ".dng",
      ".cr2",
      ".cr3",
      ".nef",
      ".arw",
      ".raf",
    ])
      expect(PHOTO_ACCEPT.split(",")).toContain(ext);
  });
});
