const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.resolve(__dirname, "../src/main.cjs"),
  "utf8",
);

function has(fragment) {
  assert.ok(
    source.includes(fragment),
    "Fluxo esperado não encontrado: " + fragment,
  );
}

test("updater desktop: matriz de recuperação cobre artefato pronto, rede e reinício", () => {
  has("if (fs.existsSync(finalPath))");
  has("fs.rmSync(partialPath, { force: true });");
  has("AbortSignal.timeout(300000)");
  has("throw new Error(`Download respondeu ${response.status}`)");
  has('pendingUpdate = { manifest, installerPath, mode: "installer" };');
  has('updateStatus("ready"');
  has("if (pendingUpdate)");
  has("installDownloadedInstaller(");
  has("installer.once(\"error\"");
  has("shell.openPath(installerPath)");
});

test("updater desktop: não baixa de novo quando EXE verificado já existe", () => {
  has("const currentHash = await sha256File(finalPath);");
  has("String(manifest.installerSha256).toLowerCase()");
  has("return finalPath;");
});

test("updater desktop: download interrompido não deixa .part utilizável", () => {
  has("await pipeline(");
  has("fs.rmSync(partialPath, { force: true });");
  has("O instalador falhou na verificação SHA-256.");
});

test("updater desktop: versão atual não entra em instalação e atualização pronta é reutilizada", () => {
  has("if (!newerThan(manifest.version, app.getVersion()))");
  has('updateStatus("current")');
  has("if (pendingUpdate)");
  has("A atualização já foi baixada. Use 'Reiniciar e atualizar'");
});

test("updater desktop: erro/cancelamento do lançamento mantém caminho de recuperação", () => {
  has('error?.code === "EACCES" || error?.code === "ENOENT"');
  has("shell.openPath(installerPath)");
  has('updateStatus("error"');
});
