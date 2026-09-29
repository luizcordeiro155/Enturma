package br.com.enturma.common;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class Errors {
  @ExceptionHandler(Exception.class)
  ResponseEntity<?> unexpected(Exception e, HttpServletRequest r) {
    org.slf4j.LoggerFactory.getLogger(Errors.class)
        .error("Request {} failed: {}", r.getAttribute("requestId"), e.getClass().getSimpleName());
    return ResponseEntity.status(500)
        .body(
            body(
                500,
                "INTERNAL_ERROR",
                "Não foi possível concluir a operação. Tente novamente.",
                r));
  }

  public static Map<String, Object> body(
      int status, String code, String message, HttpServletRequest r) {
    return Map.of(
        "timestamp",
        Instant.now().toString(),
        "status",
        status,
        "code",
        code,
        "message",
        message,
        "path",
        r.getRequestURI(),
        "requestId",
        String.valueOf(r.getAttribute("requestId")));
  }

  @ExceptionHandler(ApiException.class)
  ResponseEntity<?> domain(ApiException e, HttpServletRequest r) {
    return ResponseEntity.status(e.status).body(body(e.status, e.code, e.getMessage(), r));
  }

  @ExceptionHandler({
    MethodArgumentNotValidException.class,
    HttpMessageNotReadableException.class,
    org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class
  })
  ResponseEntity<?> invalid(Exception e, HttpServletRequest r) {
    return ResponseEntity.badRequest()
        .body(body(400, "INVALID_INPUT", "Confira os campos informados.", r));
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  ResponseEntity<?> conflict(Exception e, HttpServletRequest r) {
    return ResponseEntity.status(409)
        .body(body(409, "CONFLICT", "Os dados entram em conflito com um registro existente.", r));
  }

  @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
  ResponseEntity<?> denied(Exception e, HttpServletRequest r) {
    return ResponseEntity.status(403).body(body(403, "FORBIDDEN", "Acesso não permitido.", r));
  }
}
