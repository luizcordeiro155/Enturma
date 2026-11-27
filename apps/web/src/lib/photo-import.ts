/**
 * Photos as people actually have them: HEIC/HEIF from phone cameras and RAW from phones and
 * cameras, besides what browsers already show. Anything that is not JPG, PNG, WebP or GIF is
 * turned into a JPG here, in the browser, so the rest of Enturma only ever sees the usual four.
 * The decoders are large and load only when such a photo is chosen.
 */

/** web: shown by every browser · heif/raw: decoded here · other: the browser may know it. */
export type PhotoFamily = "web" | "heif" | "raw" | "other";

const RAW_EXTENSIONS = [
  "dng",
  "cr2",
  "cr3",
  "crw",
  "nef",
  "nrw",
  "arw",
  "srf",
  "sr2",
  "raf",
  "orf",
  "rw2",
  "rwl",
  "pef",
  "srw",
  "x3f",
  "3fr",
  "fff",
  "iiq",
  "erf",
  "mef",
  "mos",
  "mrw",
  "kdc",
  "dcr",
  "gpr",
  "raw",
];
const HEIF_BRANDS = [
  "heic",
  "heix",
  "heim",
  "heis",
  "hevc",
  "hevx",
  "hevm",
  "hevs",
  "mif1",
  "msf1",
];

/** For file pickers: every image, plus the extensions galleries do not file under "image". */
export const PHOTO_ACCEPT = [
  "image/*",
  ".heic",
  ".heif",
  ...RAW_EXTENSIONS.map((extension) => "." + extension),
].join(",");

const text = (head: Uint8Array, from: number, length: number) =>
  String.fromCharCode(...head.subarray(from, from + length));

/**
 * What kind of photo this is, or null when it is not one. The first bytes decide; the name and
 * the declared type only speak when the bytes say nothing.
 */
export function photoFamily(
  head: Uint8Array,
  name: string,
  type: string,
): PhotoFamily | null {
  const start = text(head, 0, 16);
  if (
    start.startsWith("\xff\xd8\xff") ||
    start.startsWith("\x89PNG") ||
    start.startsWith("GIF8") ||
    (start.startsWith("RIFF") && text(head, 8, 4) === "WEBP")
  )
    return "web";
  if (text(head, 4, 4) === "ftyp") {
    const brand = text(head, 8, 4);
    if (HEIF_BRANDS.includes(brand)) return "heif";
    if (brand === "crx ") return "raw";
    return brand === "avif" || brand === "avis" ? "other" : null;
  }
  if (
    start.startsWith("II*\0") ||
    start.startsWith("MM\0*") ||
    start.startsWith("FUJIFILMCCD-RAW") ||
    start.startsWith("IIU\0") ||
    /^(IIR[OS]|MMOR)/.test(start)
  )
    return "raw";

  const kind = type.toLowerCase().split(";")[0].trim();
  const extension = name.includes(".")
    ? name.split(".").pop()!.toLowerCase()
    : "";
  if (
    RAW_EXTENSIONS.includes(extension) ||
    /^image\/(x-adobe-dng|dng|x-(canon|nikon|sony|fuji|olympus|panasonic|pentax|samsung)-|x-raw|x-dcraw)/.test(
      kind,
    )
  )
    return "raw";
  if (
    /^image\/hei[cf]/.test(kind) ||
    (!head.length && /^hei[cf]$/.test(extension))
  )
    return "heif";
  // Declared as one of the usual four but the bytes are something else: not a photo.
  if (/^image\/(jpeg|jpg|pjpeg|png|x-png|webp|gif|svg)/.test(kind)) return null;
  return kind.startsWith("image/") ? "other" : null;
}

/** The longest side a converted photo keeps. Plenty for a post; kind to a phone's memory. */
const MAX_SIDE = 4096;
/** Past this a phone runs out of memory developing the photo. No camera file comes close. */
const MAX_SOURCE_BYTES = 200 * 1024 * 1024;

function fit(width: number, height: number, side: number) {
  const scale = Math.min(1, side / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function encode(
  source: CanvasImageSource,
  width: number,
  height: number,
  side: number,
): Promise<Blob> {
  const size = fit(width, height, side);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas");
  // JPG has no transparency: what was see-through becomes white, not black.
  context.fillStyle = "#fff";
  context.fillRect(0, 0, size.width, size.height);
  context.drawImage(source, 0, 0, size.width, size.height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92),
  );
  canvas.width = canvas.height = 0;
  if (!blob) throw new Error("encode");
  return blob;
}

/** What the browser can open by itself (HEIC on Apple devices, AVIF, BMP…). */
async function decodeNatively(file: Blob, side: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    return await encode(bitmap, bitmap.width, bitmap.height, side);
  } finally {
    bitmap.close();
  }
}

async function decodeHeif(file: Blob, side: number): Promise<Blob> {
  try {
    return await decodeNatively(file, side);
  } catch {
    const { heicTo } = await import("heic-to/next");
    const bitmap = await heicTo({ blob: file, type: "bitmap" });
    try {
      return await encode(bitmap, bitmap.width, bitmap.height, side);
    } finally {
      bitmap.close();
    }
  }
}

type RawImage = {
  width: number;
  height: number;
  colors?: number;
  data: Uint8Array;
};

/**
 * LibRaw compiled to WebAssembly, in its own Web Worker. The files are served from
 * /vendor/libraw as they are (see the note there): one request at a time, answered by id.
 */
class RawDeveloper {
  private worker = new Worker("/vendor/libraw/worker.js", { type: "module" });
  private waiting = new Map<
    number,
    { resolve: (value: unknown) => void; reject: (cause: Error) => void }
  >();
  private next = 0;
  constructor() {
    this.worker.onmessage = ({ data }) => {
      const request = this.waiting.get(data?.id);
      if (!request) return;
      this.waiting.delete(data.id);
      if (data.error) request.reject(new Error(String(data.error)));
      else request.resolve(data.out);
    };
    this.worker.onerror = () => this.dispose();
  }
  private call<T>(fn: string, args: unknown[], transfer: Transferable[] = []) {
    return new Promise<T>((resolve, reject) => {
      const id = this.next++;
      this.waiting.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      this.worker.postMessage({ id, fn, args }, transfer);
    });
  }
  open(bytes: Uint8Array, settings: Record<string, unknown>) {
    return this.call<void>("open", [bytes, settings], [bytes.buffer]);
  }
  imageData() {
    return this.call<RawImage | undefined>("imageData", []);
  }
  dispose() {
    this.worker.terminate();
    for (const request of this.waiting.values())
      request.reject(new Error("raw"));
    this.waiting.clear();
  }
}

async function decodeRaw(file: Blob, side: number): Promise<Blob> {
  const raw = new RawDeveloper();
  try {
    // Half size is what the sensor really measured per colour, four times lighter to develop.
    await raw.open(new Uint8Array(await file.arrayBuffer()), {
      halfSize: true,
      useCameraWb: true,
      outputColor: 1,
      outputBps: 8,
    });
    const image = await raw.imageData();
    if (!image || !image.width || !image.height) throw new Error("raw");
    const { width, height } = image;
    const colors = image.colors || 3;
    const source = image.data;
    const pixels = new Uint8ClampedArray(width * height * 4);
    for (let from = 0, to = 0; to < pixels.length; from += colors, to += 4) {
      pixels[to] = source[from];
      pixels[to + 1] = source[colors >= 3 ? from + 1 : from];
      pixels[to + 2] = source[colors >= 3 ? from + 2 : from];
      pixels[to + 3] = 255;
    }
    const bitmap = await createImageBitmap(
      new ImageData(pixels, width, height),
    );
    try {
      return await encode(bitmap, width, height, side);
    } finally {
      bitmap.close();
    }
  } finally {
    raw.dispose();
  }
}

const PHOTO_ERROR =
  "Não foi possível abrir esta foto. Tente outra, ou exporte como JPG na galeria.";

/**
 * Returns the photo ready for Enturma: the same file when it is JPG, PNG, WebP or GIF; a JPG made
 * from it when it is HEIC/HEIF, RAW or another image format. Files that are not photos (videos,
 * documents) come back untouched, for the caller's own checks.
 */
export async function importPhoto(
  file: File,
  options: {
    /** The longest side the converted photo keeps, for places with small upload limits. */
    maxSide?: number;
  } = {},
): Promise<File> {
  if (file.type.startsWith("video/")) return file;
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const family = photoFamily(head, file.name, file.type);
  if (family === null || family === "web") return file;
  if (file.size > MAX_SOURCE_BYTES)
    throw new Error(
      "Esta foto é grande demais para abrir aqui. Exporte uma cópia menor na galeria.",
    );
  const side = Math.min(MAX_SIDE, options.maxSide ?? MAX_SIDE);
  let converted: Blob;
  try {
    converted =
      family === "heif"
        ? await decodeHeif(file, side)
        : family === "raw"
          ? await decodeRaw(file, side)
          : await decodeNatively(file, side);
  } catch {
    throw new Error(PHOTO_ERROR);
  }
  return new File([converted], file.name.replace(/\.[^.]*$/, "") + ".jpg", {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
}
