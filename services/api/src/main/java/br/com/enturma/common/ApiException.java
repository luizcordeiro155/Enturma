package br.com.enturma.common;

public class ApiException extends RuntimeException {
  public final int status;
  public final String code;

  public ApiException(int status, String code, String message) {
    super(message);
    this.status = status;
    this.code = code;
  }

  public static ApiException forbidden() {
    return new ApiException(403, "FORBIDDEN", "Você não tem permissão para esta ação.");
  }

  public static ApiException missing() {
    return new ApiException(404, "NOT_FOUND", "Registro não encontrado.");
  }

  public static ApiException invalid(String message) {
    return new ApiException(400, "INVALID_INPUT", message);
  }
}
