const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const shell = fs.readFileSync(path.resolve(__dirname, "install-web-shell.cjs"), "utf8");
const has = (fragment) =>
  assert.ok(shell.includes(fragment), "Fluxo Android esperado não encontrado: " + fragment);

test("galeria: fotos e vídeos escolhidos em seleção múltipla chegam ao site", () => {
  // The Android photo picker (Google Photos included) returns several items in
  // ClipData; parseResult only reads a single getData() and would drop them.
  has("private fun pickedUris(resultCode: Int, data: Intent?): Array<Uri>?");
  has("val clip = data?.clipData");
  has("for (i in 0 until clip.itemCount) clip.getItemAt(i)?.uri?.let { uris.add(it) }");
  has("callback?.onReceiveValue(pickedUris(resultCode, data))");
  assert.doesNotMatch(
    shell,
    /callback\?\.onReceiveValue\(\s*WebChromeClient\.FileChooserParams\.parseResult\(resultCode, data\),?\s*\)/,
  );
});

test("galeria: o seletor nativo continua oferecendo fotos e vídeos juntos", () => {
  has("ActivityResultContracts.PickVisualMedia.ImageAndVideo");
  has("ActivityResultContracts.PickMultipleVisualMedia(10).createIntent(this, request)");
});
