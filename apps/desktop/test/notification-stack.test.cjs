const test = require("node:test");
const assert = require("node:assert/strict");
const { createNotificationStack } = require("../src/notification-stack.cjs");

function clock(start = 1_000_000) {
  let now = start;
  return { now: () => now, advance: (ms) => (now += ms) };
}

test("messages from the same conversation stack into one notice, like the phone", () => {
  const time = clock();
  const stack = createNotificationStack({ now: time.now });
  const first = stack.add({
    id: "a",
    title: "Ana enviou uma mensagem privada",
    body: "Oi!",
    href: "/friends?chat=1",
  });
  assert.equal(first.key, "/friends?chat=1");
  assert.equal(first.count, 1);
  assert.equal(first.alert, true);
  assert.equal(first.body, "Oi!");

  time.advance(2000);
  const second = stack.add({
    id: "b",
    title: "Ana enviou uma mensagem privada",
    body: "Tudo bem?",
    href: "/friends?chat=1",
  });
  assert.equal(second.key, first.key);
  assert.equal(second.count, 2);
  assert.equal(second.title, "Ana enviou uma mensagem privada · 2 novas");
  assert.equal(second.body, "Oi!\nTudo bem?");
  // It replaces the first notice quietly instead of alerting again.
  assert.equal(second.alert, false);
});

test("nothing is dropped: older lines are counted when the notice is full", () => {
  const time = clock();
  const stack = createNotificationStack({ now: time.now });
  let last;
  for (let i = 1; i <= 7; i++) {
    time.advance(1000);
    last = stack.add({ id: `m${i}`, title: "Grupo", body: `Mensagem ${i}`, href: "/rooms/1" });
  }
  assert.equal(last.count, 7);
  assert.equal(
    last.body,
    "+3 anteriores\nMensagem 4\nMensagem 5\nMensagem 6\nMensagem 7",
  );
});

test("a quiet conversation alerts again after a pause", () => {
  const time = clock();
  const stack = createNotificationStack({ now: time.now });
  stack.add({ id: "1", title: "Ana", body: "Oi", href: "/friends?chat=1" });
  time.advance(10_000);
  assert.equal(stack.add({ id: "2", title: "Ana", body: "?", href: "/friends?chat=1" }).alert, false);
  time.advance(31_000);
  const later = stack.add({ id: "3", title: "Ana", body: "Oi de novo", href: "/friends?chat=1" });
  assert.equal(later.alert, true);
  assert.equal(later.count, 3);
});

test("a stack left alone for long starts fresh", () => {
  const time = clock();
  const stack = createNotificationStack({ now: time.now });
  stack.add({ id: "1", title: "Ana", body: "Oi", href: "/friends?chat=1" });
  time.advance(16 * 60_000);
  const fresh = stack.add({ id: "2", title: "Ana", body: "Bom dia", href: "/friends?chat=1" });
  assert.equal(fresh.count, 1);
  assert.equal(fresh.body, "Bom dia");
});

test("a burst from many places folds into one summary instead of flooding", () => {
  const time = clock();
  const stack = createNotificationStack({ now: time.now, maxStacks: 3 });
  const shown = [];
  for (let i = 1; i <= 6; i++) {
    time.advance(500);
    shown.push(
      stack.add({ id: `p${i}`, title: `Pessoa ${i} curtiu sua publicação`, body: "Post", href: `/social?post=${i}` }),
    );
  }
  assert.deepEqual(
    shown.map((s) => s.key),
    ["/social?post=1", "/social?post=2", "/social?post=3", "summary", "summary", "summary"],
  );
  const summary = shown.at(-1);
  assert.equal(summary.title, "Enturma · 3 novas notificações");
  assert.equal(
    summary.body,
    "Pessoa 4 curtiu sua publicação\nPessoa 5 curtiu sua publicação\nPessoa 6 curtiu sua publicação",
  );
  assert.equal(summary.href, "/notifications");
  // Only the first summary alerts; later ones update it quietly.
  assert.deepEqual(shown.slice(3).map((s) => s.alert), [true, false, false]);
  // A place that already has a notice keeps stacking there.
  time.advance(500);
  assert.equal(stack.add({ id: "p7", title: "Pessoa 7", body: "Post", href: "/social?post=1" }).key, "/social?post=1");
});

test("the same notice delivered twice is ignored", () => {
  const stack = createNotificationStack({ now: () => 1 });
  assert.ok(stack.add({ id: "x", title: "A", body: "B", href: "/a" }));
  assert.equal(stack.add({ id: "x", title: "A", body: "B", href: "/a" }), null);
});

test("opening a notice or reading everything clears its stack", () => {
  const time = clock();
  const stack = createNotificationStack({ now: time.now });
  stack.add({ id: "1", title: "Ana", body: "Oi", href: "/friends?chat=1" });
  stack.add({ id: "2", title: "Ana", body: "Oi?", href: "/friends?chat=1" });
  stack.forget("/friends?chat=1");
  assert.equal(stack.add({ id: "3", title: "Ana", body: "Olá", href: "/friends?chat=1" }).count, 1);
  stack.clear();
  assert.equal(stack.add({ id: "4", title: "Ana", body: "E aí", href: "/friends?chat=1" }).count, 1);
});
