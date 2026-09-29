export function mentionsUser(text: string, username: string) {
  const normalized = username.normalize("NFC").toLowerCase();
  return [...text.normalize("NFC").matchAll(/(?:^|[^\p{L}\p{M}\p{N}_@])@([\p{L}\p{M}\p{N}_]+)/gu)]
    .some((match) => match[1].toLowerCase() === normalized);
}
