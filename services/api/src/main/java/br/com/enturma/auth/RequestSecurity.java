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

  public RequestSecurity(AuthService auth, Db db, ObjectMapper json, ClientIdentity clients) {
    this.auth = auth;
    this.db = db;
    this.json = json;
    this.clients = clients;
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
    if (!Set.of("GET", "HEAD", "OPTIONS").contains(req.getMethod())
        && req.getRequestURI().startsWith("/api/")) {
      var authentication = SecurityContextHolder.getContext().getAuthentication();
      String subject =
          authentication == null
              ? clients.subject(req)
              : ((Actor) authentication.getPrincipal()).id().toString();
      boolean authRoute = req.getRequestURI().startsWith("/api/v1/auth/");
      String bucket = (authRoute ? "auth:" : "write:") + Tokens.hash(subject);
      Integer hits =
          db.jdbc.queryForObject(
              "INSERT INTO rate_limit(bucket,hits,resets_at) VALUES (?,1,now()+interval '1 minute')"
                  + " ON CONFLICT(bucket) DO UPDATE SET hits=CASE WHEN rate_limit.resets_at<now()"
                  + " THEN 1 ELSE rate_limit.hits+1 END,resets_at=CASE WHEN"
                  + " rate_limit.resets_at<now() THEN now()+interval '1 minute' ELSE"
                  + " rate_limit.resets_at END RETURNING hits",
              Integer.class,
              bucket);
      if (hits != null && hits > (authRoute ? 20 : 90)) {
        res.setStatus(429);
        res.setHeader("Retry-After", "60");
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
