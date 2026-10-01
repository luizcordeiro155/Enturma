const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const port = Number(process.env.PORT || 3000);
const dir = path.join(__dirname, "downloads");

function files() {
  try {
    return fs
      .readdirSync(dir)
      .filter((name) => name.toLowerCase().endsWith(".zip"))
      .sort();
  } catch {
    return [];
  }
}

function sendFile(req, res, file) {
  const full = path.join(dir, file);
  if (!fs.existsSync(full)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Arquivo não encontrado.");
    return;
  }
  const stat = fs.statSync(full);
  res.writeHead(200, {
    "Content-Type": "application/zip",
    "Content-Length": stat.size,
    "Content-Disposition": `attachment; filename="${file}"`,
    "Cache-Control": "public, max-age=3600",
  });
  fs.createReadStream(full).pipe(res);
}

const server = http.createServer((req, res) => {
  const list = files();
  const installer = list[0];

  if (req.url === "/health") {
    res.writeHead(installer ? 200 : 503, {
      "Content-Type": "application/json; charset=utf-8",
    });
    res.end(JSON.stringify({ ok: Boolean(installer), installer }));
    return;
  }

  if (req.url === "/" || req.url === "/download" || req.url === "/Enturma-Windows.zip") {
    if (!installer) {
      res.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("O aplicativo ainda não foi gerado.");
      return;
    }
    sendFile(req, res, installer);
    return;
  }

  const requested = decodeURIComponent(req.url.slice(1));
  if (list.includes(requested)) {
    sendFile(req, res, requested);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Não encontrado.");
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Enturma Desktop download disponível na porta ${port}`);
  console.log("Arquivos:", files());
});
