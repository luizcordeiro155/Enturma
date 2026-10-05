package br.com.enturma.auth;

import br.com.enturma.common.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

public class RequestSecurity extends OncePerRequestFilter {
  private final AuthService auth;
  private final Db db;
  private final ObjectMapper json;
  private final ClientIdentity clients;
  private final int registerLimit;

  public RequestSecurity(
      AuthService auth, Db db, ObjectMapper json, ClientIdentity clients, int registerLimit) {
    this.auth = auth;
    this.db = db;
    this.json = json;
    this.clients = clients;
    this.registerLimit = registerLimit;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    String requestId = UUID.randomUUID().toString();
    req.setAttribute("requestId", requestId);
    res.setHeader("X-Request-ID", requestId);
    String authorization = req.getHeader("Authorization");
    if (authorization != null
        && authorization.startsWith("Bearer ")
        && authorization.length() < 200)
      auth.authenticate(authorization.substring(7))
          .ifPresent(
              actor ->
                  SecurityContextHolder.getContext()
                      .setAuthentication(
                          new UsernamePasswordAuthenticationToken(
                              actor,
                              null,
                              List.of(new SimpleGrantedAuthority("ROLE_" + actor.role())))));
    var current = SecurityContextHolder.getContext().getAuthentication();
    String route = req.getRequestURI();
    if (current != null
        && !route.startsWith("/api/v1/auth/")
        && !route.startsWith("/api/v1/moderation/")
        && !route.equals("/api/v1/users/me")
        && !route.startsWith("/api/v1/notifications")) {
      Actor actor = (Actor) current.getPrincipal();
      if (db.exists(
          "SELECT EXISTS(SELECT 1 FROM moderation_case c JOIN moderation_action a ON a.case_id=c.id"
              + " WHERE c.user_id=? AND c.room_id IS NULL AND a.kind IN"
              + " ('BAN','SUSPENSION','RESTRICTION') AND a.revoked_at IS NULL AND (a.ends_at IS"
              + " NULL OR a.ends_at>now()))",
          actor.id())) {
        res.setStatus(403);
        res.setContentType("application/json");
        json.writeValue(
            res.getOutputStream(),
            Errors.body(
                403,
                "MODERATION_ACTION",
                "Sua conta possui uma medida de moderação. Consulte o motivo e solicite revisão.",
                req));
        return;
      }
    }
    if (!Set.of("GET", "HEAD", "OPTIONS").contains(req.getMethod())
        && req.getRequestURI().startsWith("/api/")) {
      var authentication = SecurityContextHolder.getContext().getAuthentication();
      String subject =
          authentication == null
              ? clients.subject(req)
              : ((Actor) authentication.getPrincipal()).id().toString();
      String uri = req.getRequestURI();
      boolean importRoute = uri.startsWith("/api/v1/admin/catalog/");
      String prefix = "write:";
      int limit = 90;
      int windowSeconds = 60;

      if (uri.equals("/api/v1/auth/login")) {
        prefix = "auth-login:";
        limit = 8;
        windowSeconds = 60;
      } else if (uri.equals("/api/v1/auth/register")) {
        prefix = "auth-register:";
        limit = registerLimit;
        windowSeconds = 900;
      } else if (uri.equals("/api/v1/auth/forgot-password")
          || uri.equals("/api/v1/auth/resend-verification")) {
        prefix = "auth-email:";
        limit = 5;
        windowSeconds = 900;
      } else if (uri.equals("/api/v1/auth/reset-password")
          || uri.equals("/api/v1/auth/verify-email")) {
        prefix = "auth-token:";
        limit = 10;
        windowSeconds = 300;
      } else if (uri.startsWith("/api/v1/auth/")) {
        prefix = "auth:";
        limit = 20;
        windowSeconds = 60;
      } else if (uri.equals("/api/v1/rides/driver/availability/location")
          || uri.matches("/api/v1/matches/[^/]+/location")) {
        prefix = "ride-location:";
        limit = 90;
        windowSeconds = 60;
      } else if (uri.startsWith("/api/v1/rides/dispatch/")
          || uri.contains("/driver/requests/")
          || uri.matches("/api/v1/matches/[^/]+/(accept|cancel|cancel-reason|board|review)")) {
        prefix = "ride-action:";
        limit = 30;
        windowSeconds = 60;
      } else if (importRoute) {
        prefix = "catalog:";
        limit = 20;
        windowSeconds = 60;
      }

      String bucket = prefix + Tokens.hash(subject);
      Integer hits =
          db.jdbc.queryForObject(
              "INSERT INTO rate_limit(bucket,hits,resets_at) VALUES (?,1,now()+(? * interval '1"
                  + " second')) ON CONFLICT(bucket) DO UPDATE SET hits=CASE WHEN"
                  + " rate_limit.resets_at<now() THEN 1 ELSE rate_limit.hits+1 END,resets_at=CASE"
                  + " WHEN rate_limit.resets_at<now() THEN now()+(? * interval '1 second') ELSE"
                  + " rate_limit.resets_at END RETURNING hits",
              Integer.class,
              bucket,
              windowSeconds,
              windowSeconds);
      if (hits != null && hits > limit) {
        res.setStatus(429);
        res.setHeader("Retry-After", Integer.toString(windowSeconds));
        res.setContentType("application/json");
        json.writeValue(
            res.getOutputStream(),
            Errors.body(429, "RATE_LIMITED", "Aguarde um minuto antes de tentar novamente.", req));
        return;
      }
    }
    chain.doFilter(req, res);
  }
}
