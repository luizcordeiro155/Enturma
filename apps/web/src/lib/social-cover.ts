/** Decode locally and re-encode a bounded JPEG; no external URL or EXIF is forwarded. */
export async function prepareCover(file: File): Promise<Blob> {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 16 * 1024 * 1024
  )
    throw new Error("Escolha uma capa JPG, PNG ou WebP de at\u00e9 16 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (image.naturalWidth * image.naturalHeight > 33000000)
      throw new Error(
        "A imagem da capa \u00e9 muito grande. Use at\u00e9 33 megapixels.",
      );
    const scale = Math.min(
      1,
      1080 / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("N\u00e3o foi poss\u00edvel preparar a capa.");
    context.fillStyle = "#000000";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const result = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9),
    );
    if (!result) throw new Error("N\u00e3o foi poss\u00edvel preparar a capa.");
    return result;
  } finally {
    URL.revokeObjectURL(url);
  }
}
