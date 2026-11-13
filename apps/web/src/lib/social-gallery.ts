/** Gallery providers may omit the MIME type. This is only a UI hint:
 * the API and FFmpeg still inspect the actual bytes before publication. */
const extensions: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", jpe: "image/jpeg",
  png: "image/png", webp: "image/webp", gif: "image/gif",
  mp4: "video/mp4", m4v: "video/mp4", mov: "video/quicktime",
  webm: "video/webm", mkv: "video/x-matroska", avi: "video/x-msvideo",
  "3gp": "video/3gpp", "3g2": "video/3gpp2",
};
export function normalizeSocialGalleryFile(file: File): File {
  if (!file.size || file.size > 128 * 1024 * 1024)
    throw new Error("Escolha uma foto ou vídeo de até 128 MB, que não esteja vazio.");
  let type = file.type.toLowerCase().split(";")[0].trim();
  if (type === "image/jpg" || type === "image/pjpeg") type = "image/jpeg";
  if (type === "image/x-png") type = "image/png";
  if (!type || type === "application/octet-stream")
    type = extensions[file.name.split(".").pop()?.toLowerCase() ?? ""] ?? "";
  if (!/^(image\/(jpeg|png|webp|gif)$|video\/)/.test(type))
    throw new Error("Escolha uma foto JPG, PNG, WebP ou GIF, ou um vídeo compatível. Para HEIC/HEIF, exporte a foto como JPG na galeria.");
  return type === file.type ? file : new File([file], file.name, {
    type, lastModified: file.lastModified,
  });
}
