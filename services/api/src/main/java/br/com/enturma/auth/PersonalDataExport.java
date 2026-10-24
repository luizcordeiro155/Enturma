package br.com.enturma.auth;

import br.com.enturma.common.*;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Explicit projections: never export session secrets, hashes or another student's data. */
@RestController
@RequestMapping("/api/v1/account/privacy/export")
public class PersonalDataExport {
  private final Db db;
  public PersonalDataExport(Db db) { this.db=db; }
  private static final Map<String,String> SECTIONS=Map.of(
    "account", "SELECT id,name,username,email,bio,profile_details,created_at FROM app_user WHERE id=? ORDER BY id",
    "portfolio", "SELECT headline,summary,skills,projects,public,updated_at FROM portfolio_profile WHERE user_id=? ORDER BY user_id",
    "notebooks", "SELECT id,title,created_at,updated_at FROM study_notebook WHERE user_id=? ORDER BY created_at,id",
    "sources", "SELECT s.id,s.notebook_id,s.title,s.kind,s.url,s.content,s.created_at FROM notebook_source s JOIN study_notebook n ON n.id=s.notebook_id WHERE n.user_id=? ORDER BY s.created_at,s.id",
    "conversations", "SELECT g.id,g.notebook_id,g.question,g.answer,g.citations,g.external_sources,g.created_at FROM notebook_generation g JOIN study_notebook n ON n.id=g.notebook_id WHERE n.user_id=? ORDER BY g.created_at,g.id",
    "media", "SELECT id,name,kind,favorite,created_at FROM chat_media WHERE user_id=? ORDER BY created_at,id",
    "attachments", "SELECT id,name,mime,created_at FROM portfolio_attachment WHERE user_id=? ORDER BY created_at,id"
  );
  @GetMapping
  public ResponseEntity<?> export(@AuthenticationPrincipal Actor actor,
      @RequestParam(defaultValue="account") String section,@RequestParam(defaultValue="0") int offset) {
    String query=SECTIONS.get(section);
    if(query==null || offset<0 || offset>100000) throw ApiException.invalid("Página de exportação inválida.");
    var rows=db.list(query+" LIMIT 101 OFFSET ?",actor.id(),offset);
    return ResponseEntity.ok().header("Cache-Control","private,no-store")
      .body(Map.of("section",section,"items",rows.subList(0,Math.min(100,rows.size())),"nextOffset",rows.size()>100?offset+100:-1));
  }
}
