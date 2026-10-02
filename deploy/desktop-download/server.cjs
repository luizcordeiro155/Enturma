const http = require("node:http"),
  fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const port = Number(process.env.PORT || 3000),
  dir = path.join(__dirname, "downloads");
function version(file) {
  return (
    file.match(/(?:Enturma-|Enturma-Setup-)(\d+\.\d+\.\d+)/)?.[1] || "0.0.0"
  );
}
function newest(a, b) {
  const aa = version(a).split(".").map(Number),
    bb = version(b).split(".").map(Number);
  for (let i = 0; i < 3; i++) if (aa[i] !== bb[i]) return bb[i] - aa[i];
  return a.localeCompare(b);
}
function files() {
  try {
    return fs
      .readdirSync(dir)
      .filter((n) => /^Enturma-[\w.-]+\.(zip|exe|apk|aab)$/.test(n))
      .sort(newest);
  } catch {
    return [];
  }
}
const checksums = new Map();
function checksum(name) {
  const file = path.join(dir, name),
    stat = fs.statSync(file),
    key = name + stat.mtimeMs;
  if (!checksums.has(key))
    checksums.set(
      key,
      crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex"),
    );
  return checksums.get(key);
}
function origin(req) {
  const host = process.env.RAILWAY_PUBLIC_DOMAIN || req.headers.host;
  if (!host || !/^[a-z0-9.:-]+$/i.test(host)) throw Error("Host inválido");
  return `https://${host}`;
}
function send(req, res, name) {
  const file = path.join(dir, name),
    stat = fs.statSync(file);
  res.writeHead(200, {
    "Content-Type": name.endsWith(".zip")
      ? "application/zip"
      : name.endsWith(".apk")
        ? "application/vnd.android.package-archive"
        : "application/octet-stream",
    "Content-Length": stat.size,
    "Content-Disposition": `attachment; filename="${name}"`,
    "Cache-Control": "public,max-age=3600",
    "X-Content-Type-Options": "nosniff",
  });
  if (req.method === "HEAD") res.end();
  else
    fs.createReadStream(file)
      .on("error", () => res.destroy())
      .pipe(res);
}
const server = http.createServer((req, res) => {
  try {
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405);
      res.end();
      return;
    }
    const names = files(),
      zip = names.find((n) => n.endsWith("-win-x64.zip")),
      exe = names.find((n) => n === `Enturma-Setup-${version(zip || "")}.exe`);
    const pathname = new URL(req.url, "http://localhost").pathname;
    if (pathname === "/latest.json") {
      if (!zip) {
        res.writeHead(503);
        res.end("{}");
        return;
      }
      const base = origin(req),
        stat = fs.statSync(path.join(dir, zip));
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store,max-age=0",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(
        JSON.stringify({
          version: version(zip),
          platform: "win32",
          arch: "x64",
          file: zip,
          size: stat.size,
          sha256: checksum(zip),
          downloadUrl: `${base}/Enturma-Windows.zip`,
          installerUrl: exe ? `${base}/${exe}` : null,
          installerSha256: exe ? checksum(exe) : null,
          publishedAt: stat.mtime.toISOString(),
        }),
      );
      return;
    }
    if (pathname === "/health") {
      res.writeHead(zip && exe ? 200 : 503, {
        "Content-Type": "application/json",
      });
      res.end(
        JSON.stringify({
          ok: !!(zip && exe),
          version: version(zip || ""),
          zip,
          installer: exe,
        }),
      );
      return;
    }
    const requested = decodeURIComponent(pathname.slice(1));
    const chosen =
      pathname === "/Enturma-Windows.zip"
        ? zip
        : ["/", "/download", "/Enturma-Windows.exe"].includes(pathname)
          ? exe
          : names.includes(requested)
            ? requested
            : null;
    if (chosen) {
      send(req, res, chosen);
      return;
    }
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Arquivo não disponível.");
  } catch {
    res.writeHead(400);
    res.end("Solicitação inválida.");
  }
});
server.listen(port, "0.0.0.0", () =>
  console.log(`Enturma downloads: ${server.address().port}`),
);
