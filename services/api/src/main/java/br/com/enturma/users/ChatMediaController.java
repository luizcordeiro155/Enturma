package br.com.enturma.users;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import br.com.enturma.study.RoomMediaController;
import java.security.MessageDigest;
import java.util.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/chat-media")
public class ChatMediaController {
  private final Db db;
  public ChatMediaController(Db db) { this.db = db; }

  @GetMapping
  public Object list(@AuthenticationPrincipal Actor actor) {
    return db.jdbc.queryForList("SELECT id,name,kind,favorite FROM chat_media WHERE user_id=? ORDER BY created_at DESC LIMIT 60", actor.id());
  }

  @PostMapping
  @Transactional
  public Object save(@AuthenticationPrincipal Actor actor, @RequestParam MultipartFile file,
      @RequestParam(defaultValue="STICKER") String kind, @RequestParam(defaultValue="") String name) throws Exception {
    if (!Set.of("STICKER","GIF").contains(kind)) throw ApiException.invalid("Tipo de mídia inválido.");
    if (file.isEmpty() || file.getSize()>1400*1024) throw ApiException.invalid("Use uma imagem de até 1,4 MB.");
    byte[] bytes=file.getBytes();
    String mime=Set.of("image/png","image/jpeg","image/webp","image/gif").stream()
        .filter(m -> RoomMediaController.validImage(m,bytes)).findFirst().orElseThrow(() -> ApiException.invalid("Use PNG, JPG, WEBP ou GIF."));
    if (kind.equals("GIF") && !mime.equals("image/gif")) throw ApiException.invalid("Escolha um arquivo GIF animado.");
    String digest=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
    db.one("SELECT id FROM app_user WHERE id=? FOR UPDATE",actor.id());
    var existing=db.jdbc.queryForList("SELECT id,name,kind,favorite FROM chat_media WHERE user_id=? AND digest=? AND kind=?",actor.id(),digest,kind);
    if (!existing.isEmpty()) {
      db.jdbc.update("UPDATE chat_media SET favorite=true WHERE id=? AND user_id=?",existing.getFirst().get("id"),actor.id());
      existing.getFirst().put("favorite",true);
      return existing.getFirst();
    }
    if (db.jdbc.queryForObject("SELECT count(*) FROM chat_media WHERE user_id=?",Integer.class,actor.id())>=60)
      throw ApiException.invalid("Sua biblioteca pode ter 60 itens. Remova um antes de adicionar outro.");
    String title=name.replaceAll("[\\p{Cntrl}/\\\\]", " ").strip();
    if (title.isEmpty()) title=kind.equals("GIF")?"Meu GIF":"Minha figurinha";
    if(title.length()>80) title=title.substring(0,80);
    UUID id=UUID.randomUUID();
    db.jdbc.update("INSERT INTO chat_media(id,user_id,name,kind,mime,data,digest) VALUES(?,?,?,?,?,?,?)",id,actor.id(),title,kind,mime,bytes,digest);
    return Map.of("id",id,"name",title,"kind",kind,"favorite",true);
  }

  @GetMapping("/{id}/file")
  public ResponseEntity<byte[]> file(@AuthenticationPrincipal Actor actor,@PathVariable UUID id) {
    var row=db.one("SELECT data,mime FROM chat_media WHERE id=? AND user_id=?",id,actor.id());
    return ResponseEntity.ok().contentType(MediaType.parseMediaType((String)row.get("mime")))
        .header("Cache-Control","private,no-store").header("X-Content-Type-Options","nosniff")
        .header("Content-Security-Policy","sandbox").body((byte[])row.get("data"));
  }
  public record Favorite(@NotNull Boolean favorite) {}
  @PatchMapping("/{id}")
  public void favorite(@AuthenticationPrincipal Actor actor,@PathVariable UUID id,@Valid @RequestBody Favorite body) {
    db.one("SELECT id FROM chat_media WHERE id=? AND user_id=?",id,actor.id());
    db.jdbc.update("UPDATE chat_media SET favorite=? WHERE id=? AND user_id=?",body.favorite(),id,actor.id());
  }
  @DeleteMapping("/{id}")
  public void delete(@AuthenticationPrincipal Actor actor,@PathVariable UUID id) {
    db.jdbc.update("DELETE FROM chat_media WHERE id=? AND user_id=?",id,actor.id());
  }
}
