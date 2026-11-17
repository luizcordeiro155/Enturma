export type SessionPlatform = "web" | "desktop" | "android";

/** Where a request comes from, in words the sessions list can show. */
export function describeClient(userAgent: string | null): {
  platform: SessionPlatform;
  name: string;
} {
  const ua = userAgent ?? "";
  const os = /Android/.test(ua)
    ? "Android"
    : /iPhone/.test(ua)
      ? "iPhone"
      : /iPad/.test(ua)
        ? "iPad"
        : /Windows/.test(ua)
          ? "Windows"
          : /CrOS/.test(ua)
            ? "ChromeOS"
            : /Mac OS X|Macintosh/.test(ua)
              ? "macOS"
              : /Linux/.test(ua)
                ? "Linux"
                : "";
  if (/EnturmaMobile\//.test(ua)) return { platform: "android", name: "Android" };
  if (/EnturmaDesktop\//.test(ua)) return { platform: "desktop", name: os || "Computador" };
  const browser = /Edg(?:A|iOS)?\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /SamsungBrowser\//.test(ua)
        ? "Samsung Internet"
        : /Firefox\/|FxiOS\//.test(ua)
          ? "Firefox"
          : /Chrome\/|CriOS\//.test(ua)
            ? "Chrome"
            : /Safari\//.test(ua)
              ? "Safari"
              : "Navegador";
  return { platform: "web", name: os ? `${browser} no ${os}` : browser };
}
