const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const shell = fs.readFileSync(path.resolve(__dirname, "install-web-shell.cjs"), "utf8");

test("botão de volume do celular: avisa a página e mantém o volume do sistema", () => {
  assert.ok(shell.includes("import android.view.KeyEvent"));
  assert.match(
    shell,
    /override fun onKeyDown\(keyCode: Int, event: KeyEvent\?\): Boolean \{[\s\S]{0,700}KeyEvent\.KEYCODE_VOLUME_UP[\s\S]{0,700}enturma-native-volume-key[\s\S]{0,400}return super\.onKeyDown\(keyCode, event\)/,
  );
});
