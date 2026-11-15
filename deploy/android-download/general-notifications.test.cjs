const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const shell = fs.readFileSync(path.resolve(__dirname, "install-web-shell.cjs"), "utf8");
const has = (fragment) =>
  assert.ok(shell.includes(fragment), "Fluxo Android esperado não encontrado: " + fragment);

test("curtidas, comentários e avisos empilham por lugar em vez de inundar", () => {
  has("private object EnturmaGeneralNotifications");
  has("EnturmaGeneralNotifications.show(this, href, title, body, pending)");
  // One notice per place: the id comes from the place, not from each event.
  has('fun notificationId(key: String): Int = ("general:" + key).hashCode()');
  has("Notification.InboxStyle()");
  has('" anteriores"');
  has('" novas"');
});

test("alerta uma vez por rajada e de novo só depois de uma pausa", () => {
  has("private const val GENERAL_REALERT_MS = 30_000L");
  has(".setOnlyAlertOnce(!alert)");
  has("private const val GENERAL_STALE_MS = 900_000L");
});

test("sair da conta apaga o histórico dos avisos empilhados", () => {
  assert.match(
    shell,
    /private fun clearNativePushToken\(\) \{[\s\S]{0,200}EnturmaGeneralNotifications\.clear\(this\)/,
  );
});
