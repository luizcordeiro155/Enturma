const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const port = Number(process.env.PORT || 3000);
const dir = path.join(__dirname, "downloads");

function files() {
  try {
    return fs
      .readdirSync(dir)
      .filter((name) => /^Enturma-Android-\d+\.\d+\.\d+\.apk$/.test(name))
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  } catch {
    return [];
  }
}

function version(file) {
  return file?.match(/Enturma-Android-(\d+\.\d+\.\d+)\.apk$/)?.[1] || "0.0.0";
}

const checksums = new Map();
function checksum(file, stat) {
  const key = `${file}:${stat.size}:${stat.mtimeMs}`;
  if (!checksums.has(key)) {
    checksums.clear();
    checksums.set(key, new Promise((resolve, reject) => {
      const hash = crypto.createHash("sha256");
      fs.createReadStream(path.join(dir, file)).on("error", reject)
        .on("data", chunk => hash.update(chunk))
        .on("end", () => resolve(hash.digest("hex")));
    }).catch(error => { checksums.delete(key); throw error; }));
  }
  return checksums.get(key);
}

function origin(req) {
  const host = process.env.RAILWAY_PUBLIC_DOMAIN || req.headers.host;
  if (!host || !/^[a-z0-9.:-]+$/i.test(host)) throw new Error("Host inválido");
  return `https://${host}`;
}

function send(req, res, file) {
  const full = path.join(dir, file);
  const stat = fs.statSync(full);
  res.writeHead(200, {
    "Content-Type": "application/vnd.android.package-archive",
    "Content-Length": stat.size,
    "Content-Disposition": `attachment; filename="${file}"`,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  });
  if (req.method === "HEAD") res.end();
  else fs.createReadStream(full).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405);
      res.end();
      return;
    }

    const apk = files()[0];
    const pathname = new URL(req.url, "http://localhost").pathname;

    if (pathname === "/health") {
      res.writeHead(apk ? 200 : 503, {
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end(JSON.stringify({ ok: Boolean(apk), version: version(apk), apk }));
      return;
    }

    if (pathname === "/latest-android.json") {
      if (!apk) {
        res.writeHead(503, {
          "Content-Type": "application/json; charset=utf-8",
        });
        res.end("{}");
        return;
      }
      const stat = fs.statSync(path.join(dir, apk));
      const base = origin(req);
      const digest = await checksum(apk, stat);
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store,max-age=0",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(req.method === "HEAD" ? undefined :
        JSON.stringify({
          version: version(apk),
          sourceCommit: fs.existsSync(path.join(__dirname, "release.json"))
            ? JSON.parse(
                fs.readFileSync(path.join(__dirname, "release.json"), "utf8"),
              ).sourceCommit
            : null,
          platform: "android",
          packageName: "br.com.enturma.app",
          file: apk,
          size: stat.size,
          sha256: digest,
          downloadUrl: `${base}/${encodeURIComponent(apk)}`,
          publishedAt: stat.mtime.toISOString(),
        }),
      );
      return;
    }

    if (
      pathname === "/" ||
      pathname === "/download" ||
      pathname === "/Enturma-Android.apk"
    ) {
      if (!apk) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("APK não disponível.");
        return;
      }
      res.writeHead(302, {
        Location: `/${encodeURIComponent(apk)}`,
        "Cache-Control": "no-store, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      });
      res.end();
      return;
    }

    const requested = decodeURIComponent(pathname.slice(1));
    const chosen = files().includes(requested) ? requested : null;

    if (!chosen) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("APK não disponível.");
      return;
    }

    send(req, res, chosen);
  } catch {
    res.writeHead(400);
    res.end("Solicitação inválida.");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Enturma Android downloads: ${server.address().port}`);
  console.log("Arquivos:", files());
});
