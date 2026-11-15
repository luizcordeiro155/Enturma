"use strict";

/**
 * Groups desktop notices the way the Android app does: one notice per
 * conversation or post that keeps the latest lines and a count, alerting once
 * instead of once per message. When many places send at once, the extra ones
 * fold into a single summary notice. Nothing is dropped: every notice stays in
 * the inbox, and the count and lines say how many arrived.
 */

const VISIBLE_LINES = 4;
// A conversation that keeps talking alerts again after this pause.
const REALERT_MS = 30_000;
// A stack left alone this long starts fresh.
const STALE_MS = 15 * 60_000;
// New places within this window count as one burst.
const BURST_MS = 60_000;
const SUMMARY = "summary";

function createNotificationStack({ now = Date.now, maxStacks = 4 } = {}) {
  const stacks = new Map();
  const seen = new Set();

  function remember(id) {
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    if (seen.size > 300) seen.delete(seen.values().next().value);
    return true;
  }

  function prune(time) {
    for (const [key, stack] of stacks)
      if (time - stack.updatedAt > STALE_MS) stacks.delete(key);
  }

  function render(stack) {
    const lines = stack.lines.slice(-VISIBLE_LINES);
    // The count, not the kept lines, says how many came before.
    const hidden = stack.count - lines.length;
    if (hidden > 0) lines.unshift(`+${hidden} anteriores`);
    const title =
      stack.key === SUMMARY
        ? `Enturma · ${stack.count} ${stack.count === 1 ? "nova notificação" : "novas notificações"}`
        : stack.count > 1
          ? `${stack.title} · ${stack.count} novas`
          : stack.title;
    return { title, body: lines.join("\n") };
  }

  function add(payload) {
    if (!payload || !remember(payload.id)) return null;
    const time = now();
    prune(time);
    const title = String(payload.title || "Enturma");
    const body = String(payload.body || "Você tem uma nova notificação.");
    const place = String(payload.group || payload.href || title);

    let key = place;
    if (!stacks.has(place)) {
      const recent = [...stacks.values()].filter(
        (stack) => stack.key !== SUMMARY && time - stack.createdAt < BURST_MS,
      ).length;
      if (recent >= maxStacks) key = SUMMARY;
    }

    let stack = stacks.get(key);
    const fresh = !stack;
    if (fresh) {
      stack = {
        key,
        title,
        href: key === SUMMARY ? "/notifications" : payload.href,
        lines: [],
        count: 0,
        createdAt: time,
        alertedAt: 0,
      };
      stacks.set(key, stack);
    }
    // The summary lists who sent what; a conversation lists the messages.
    stack.lines.push(key === SUMMARY ? title : body);
    if (stack.lines.length > 50) stack.lines.splice(0, stack.lines.length - 50);
    stack.count += 1;
    stack.updatedAt = time;
    if (key !== SUMMARY) stack.title = title;

    const alert = fresh || time - stack.alertedAt >= REALERT_MS;
    if (alert) stack.alertedAt = time;
    return { key, count: stack.count, href: stack.href, alert, ...render(stack) };
  }

  return {
    add,
    /** The person opened this place: its next notice starts a new stack. */
    forget(key) {
      stacks.delete(key);
    },
    /** Everything was read. */
    clear() {
      stacks.clear();
    },
  };
}

module.exports = { createNotificationStack };
