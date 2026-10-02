package br.com.enturma.moderation;

public class PenaltyException extends br.com.enturma.common.ApiException {
  public PenaltyException() {
    super(
        403,
        "MODERATION_ACTION",
        "Sua participação foi limitada. Consulte o motivo e solicite revisão em suas penalidades.");
  }
}
