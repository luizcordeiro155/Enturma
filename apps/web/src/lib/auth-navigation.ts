/** Only local application paths may be used as a post-login destination. */
export function authDestination(value: string | null | undefined) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\r\n]/.test(value) ||
    /^\/(?:login|register|session\/restore|session\/unavailable)(?:[/?#]|$)/.test(value)
  )
    return "/home";
  return value;
}
