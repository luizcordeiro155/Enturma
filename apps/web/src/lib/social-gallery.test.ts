import { describe, expect, it } from "vitest";
import { normalizeSocialGalleryFile } from "./social-gallery";

const data = new Uint8Array([137, 80, 78, 71]);
describe("gallery file hints", () => {
  it("preserves already supported files without copying", () => {
    const file = new File([data], "foto.png", { type: "image/png" });
    expect(normalizeSocialGalleryFile(file)).toBe(file);
  });
  it.each([
    ["", "foto.PNG", "image/png"],
    ["application/octet-stream", "foto.jpeg", "image/jpeg"],
    ["image/jpg", "foto.jpg", "image/jpeg"],
    ["image/pjpeg", "foto.jpg", "image/jpeg"],
    ["image/x-png", "foto.png", "image/png"],
    ["", "video.MOV", "video/quicktime"],
  ])("normalizes %s / %s without changing file metadata", (type, name, expected) => {
    const file = new File([data], name, { type, lastModified: 1234 });
    const normalized = normalizeSocialGalleryFile(file);
    expect(normalized.type).toBe(expected);
    expect(normalized.name).toBe(name);
    expect(normalized.size).toBe(file.size);
    expect(normalized.lastModified).toBe(1234);
  });
  it("does not reinterpret a declared document as an image by extension", () => {
    expect(() => normalizeSocialGalleryFile(new File([data], "foto.png", { type: "text/html" }))).toThrow(/JPG/);
  });
  it("does not pretend to convert HEIC files", () => {
    expect(() => normalizeSocialGalleryFile(new File([data], "foto.heic", { type: "image/heic" }))).toThrow(/HEIC/);
  });
  it("rejects empty and oversized files before allocating another File", () => {
    expect(() => normalizeSocialGalleryFile(new File([], "foto.png", { type: "image/png" }))).toThrow(/vazio/);
    const file = new File([data], "foto.png", { type: "image/png" });
    Object.defineProperty(file, "size", { value: 128 * 1024 * 1024 + 1 });
    expect(() => normalizeSocialGalleryFile(file)).toThrow(/128 MB/);
  });
});
