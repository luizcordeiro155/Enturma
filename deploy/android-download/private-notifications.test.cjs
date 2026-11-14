const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const shell = fs.readFileSync(path.resolve(__dirname, "install-web-shell.cjs"), "utf8");
const web = fs.readFileSync(
  path.resolve(__dirname, "../../apps/web/src/lib/private-chat-crypto.ts"),
  "utf8",
);
const has = (fragment) =>
  assert.ok(shell.includes(fragment), "Fluxo Android esperado não encontrado: " + fragment);

test("notificação de mensagem: decifra no celular com o mesmo esquema da web", () => {
  // Web: AES-GCM with additional data `${thread}:${sender}:${clientId}`.
  assert.ok(web.includes("additionalData: enc.encode(`${thread}:${sender}:${clientId}`)"));
  has('Cipher.getInstance("AES/GCM/NoPadding")');
  has('cipher.updateAAD((conversation + ":" + sender + ":" + client).toByteArray(Charsets.UTF_8))');
  has("GCMParameterSpec(128, Base64.decode(iv, Base64.DEFAULT))");
});

test("notificação de mensagem: chaves só sob o Android Keystore e só da origem do Enturma", () => {
  has('KeyStore.getInstance("AndroidKeyStore")');
  has("KeyGenParameterSpec.Builder(");
  has("fun storeConversationKeys(json: String)");
  has("if (raw.size != 32) continue");
  assert.match(
    shell,
    /fun storeConversationKeys[\s\S]{0,200}webView\.url\?\.startsWith\(/,
  );
});

test("notificação de mensagem: empilha por pessoa como o WhatsApp", () => {
  has("Notification.MessagingStyle(");
  has("style.addMessage(");
  has("setGroup(MESSAGE_GROUP)");
  has("setGroupSummary(true)");
  has("private const val MESSAGE_HISTORY_LIMIT = 8");
  has("EnturmaPrivateNotifications.show(this, data, pending)");
});

test("notificação de mensagem: privacidade na tela bloqueada, ao abrir e ao sair da conta", () => {
  has("setVisibility(Notification.VISIBILITY_PRIVATE)");
  has("setPublicVersion(hidden)");
  has("EnturmaPrivateNotifications.forget(this, it)");
  has("fun clearConversationNotifications(conversation: String)");
  assert.match(shell, /private fun clearNativePushToken\(\) \{\s*EnturmaPrivateNotifications\.clear\(this\)/);
});

test("notificação de mensagem: sem a chave, nunca mostra texto cifrado", () => {
  has('else -> "Nova mensagem"');
  has(".getOrNull()?.trim()?.takeIf { it.isNotEmpty() }");
});
