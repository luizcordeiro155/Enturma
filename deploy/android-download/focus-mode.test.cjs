const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const shell = fs.readFileSync(path.resolve(__dirname, "install-web-shell.cjs"), "utf8");

test("modo foco: ponte para o Não perturbe com permissão explícita", () => {
  for (const method of ["fun getFocusSupport(): String", "fun requestFocusPermission()", "fun setStudyFocus(active: Boolean, untilMillis: Double)"])
    assert.ok(shell.includes(method), method);
  assert.ok(shell.includes("Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS"));
  assert.ok(shell.includes("android.permission.ACCESS_NOTIFICATION_POLICY"));
});

test("modo foco: ligações e conversas (WhatsApp) continuam chegando", () => {
  assert.match(shell, /PRIORITY_CATEGORY_CALLS[\s\S]{0,400}PRIORITY_CATEGORY_REPEAT_CALLERS[\s\S]{0,400}PRIORITY_CATEGORY_MESSAGES/);
  assert.match(shell, /PRIORITY_CATEGORY_CONVERSATIONS[\s\S]{0,600}CONVERSATION_SENDERS_ANYONE/);
  assert.ok(shell.includes("INTERRUPTION_FILTER_PRIORITY"));
});

test("modo foco: restaura o estado anterior e termina sozinho no fim do período", () => {
  assert.ok(shell.includes("EnturmaFocusEndReceiver"));
  assert.match(shell, /previousFilter[\s\S]{0,2000}setInterruptionFilter\(previous/);
  assert.match(shell, /setAndAllowWhileIdle\(\s*AlarmManager\.RTC_WAKEUP/);
  // Never turns on DND the person did not allow, and never past the end time.
  assert.match(shell, /isNotificationPolicyAccessGranted/);
  assert.match(shell, /override fun onResume\(\)[\s\S]{0,600}EnturmaFocus\.expire/);
});
