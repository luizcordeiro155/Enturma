// Safe for the browser: only words.
const MESSAGES: Record<string, string> = {
  cancelled:
    "O acesso foi cancelado antes de terminar. Nada mudou na sua conta.",
  state:
    "Esse acesso demorou demais ou começou em outra aba. Tente de novo por aqui.",
  session: "Sua sessão expirou. Entre de novo para conectar a conta.",
  unavailable: "Essa forma de entrar não está disponível agora.",
  PROVIDER_UNAVAILABLE: "Essa forma de entrar não está disponível agora.",
  OAUTH_CODE_INVALID: "Esse acesso expirou. Tente de novo.",
  GOOGLE_EMAIL_UNVERIFIED:
    "Confirme o e-mail da sua conta Google antes de entrar com ela.",
  GOOGLE_ACCOUNT_MISMATCH:
    "Esta conta do Enturma usa outra conta Google. Entre com ela ou com sua senha.",
  ACCOUNT_UNAVAILABLE: "Esta conta não está disponível para login.",
  IDENTITY_IN_USE: "Essa conta já está conectada a outro perfil do Enturma.",
  EMAIL_UNVERIFIED:
    "Confirme seu e-mail no Enturma antes de conectar uma conta Google diferente.",
  RATE_LIMITED: "Foram muitas tentativas. Aguarde um minuto e tente de novo.",
};

/** What happened, for the page that receives `?oauth=`, `?conta=` or `?github=`. */
export function oauthMessage(code: string | null | undefined) {
  if (!code) return "";
  return (
    MESSAGES[code] ??
    "Não foi possível concluir o acesso agora. Tente de novo em instantes."
  );
}
