/** Only count a conversation as read once its actual bottom is visible. */
export function isChatAtLatest(
  viewport: Pick<HTMLElement, "scrollHeight" | "scrollTop" | "clientHeight">,
) {
  return (
    viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <= 24
  );
}

/** Never scroll the document or the keyboard-sized app shell to reveal a message. */
export function revealChatMessage(
  element: HTMLElement,
  behavior: ScrollBehavior = "auto",
) {
  const viewport = element.closest<HTMLElement>(
    ".persistent-messages, .private-messages, .ride-chat-messages",
  );
  if (!viewport) return false;
  const offset =
    element.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
  viewport.scrollTo({
    top:
      viewport.scrollTop +
      offset -
      Math.max(12, (viewport.clientHeight - element.offsetHeight) / 2),
    behavior,
  });
  return true;
}
