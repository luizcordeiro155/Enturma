// Vercel's request limit includes multipart overhead; prepare large images locally.
export async function prepareChatImage(file: File): Promise<File> {
  if (file.size <= 3 * 1024 * 1024) return file;
  if (file.type === "image/gif")
    throw Error("Para preservar a animação, envie um GIF de até 3 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    const ratio = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    const context = canvas.getContext("2d");
    if (!context) throw Error("Não foi possível preparar a imagem.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.7, 0.5]) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", quality),
      );
      if (blob && blob.size <= 3 * 1024 * 1024)
        return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", {
          type: blob.type,
        });
    }
    throw Error("Não foi possível reduzir a imagem. Escolha uma imagem menor.");
  } finally {
    bitmap.close();
  }
}


export async function preparePrivateChatImage(file: File): Promise<File> {
  const limit = 1400 * 1024;
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type))
    throw Error("Use JPG, PNG, WEBP ou GIF.");
  if (file.size <= limit) return file;
  if (file.type === "image/gif")
    throw Error("Para preservar a animação, envie um GIF de até 1,4 MB.");

  const bitmap = await createImageBitmap(file);
  try {
    const ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    const context = canvas.getContext("2d");
    if (!context) throw Error("Não foi possível preparar a imagem.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.82, 0.68, 0.54, 0.42]) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", quality),
      );
      if (blob && blob.size <= limit)
        return new File(
          [blob],
          file.name.replace(/\.[^.]+$/, "") + ".webp",
          { type: blob.type },
        );
    }
    throw Error("Não foi possível reduzir a imagem. Escolha uma imagem menor.");
  } finally {
    bitmap.close();
  }
}
