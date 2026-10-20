package br.com.enturma.ai;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import br.com.enturma.study.StudyService;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/study-rooms/{room}/notebooks")
public class RoomNotebookController {
  private final Db db;
  private final StudyService study;
  private final NotebookService notebooks;

  public RoomNotebookController(Db db, StudyService study, NotebookService notebooks) {
    this.db = db;
    this.study = study;
    this.notebooks = notebooks;
  }

  @GetMapping
  public Object list(@AuthenticationPrincipal Actor a, @PathVariable UUID room) {
    study.member(a, room);
    return db.list(
        "SELECT n.id,n.title,s.shared_by,u.name owner_name FROM room_notebook_share s JOIN"
            + " study_notebook n ON n.id=s.notebook_id AND n.user_id=s.shared_by JOIN app_user u ON"
            + " u.id=s.shared_by JOIN room_participant p ON p.room_id=s.room_id AND"
            + " p.user_id=s.shared_by AND NOT p.removed WHERE s.room_id=? ORDER BY s.created_at",
        room);
  }

  @PutMapping("/{notebook}")
  @Transactional
  public void share(
      @AuthenticationPrincipal Actor a, @PathVariable UUID room, @PathVariable UUID notebook) {
    study.activeLocked(room);
    study.member(a, room);
    notebooks.owner(a, notebook);
    if (db.jdbc.queryForObject(
            "SELECT count(*) FROM room_notebook_share WHERE room_id=?", Integer.class, room)
        >= 10) throw ApiException.invalid("A sala pode compartilhar até 10 cadernos por vez.");
    db.jdbc.update(
        "INSERT INTO room_notebook_share(room_id,notebook_id,shared_by) VALUES (?,?,?) ON CONFLICT"
            + " DO NOTHING",
        room,
        notebook,
        a.id());
  }

  @DeleteMapping("/{notebook}")
  @Transactional
  public void remove(
      @AuthenticationPrincipal Actor a, @PathVariable UUID room, @PathVariable UUID notebook) {
    // The owner may revoke even after leaving or being removed from the room.
    notebooks.owner(a, notebook);
    db.jdbc.update(
        "DELETE FROM room_notebook_share WHERE room_id=? AND notebook_id=? AND shared_by=?",
        room,
        notebook,
        a.id());
  }

  @GetMapping("/{notebook}")
  public Object read(
      @AuthenticationPrincipal Actor a, @PathVariable UUID room, @PathVariable UUID notebook) {
    study.member(a, room);
    db.one(
        "SELECT s.notebook_id FROM room_notebook_share s JOIN study_notebook n ON"
            + " n.id=s.notebook_id AND n.user_id=s.shared_by JOIN room_participant p ON"
            + " p.room_id=s.room_id AND p.user_id=s.shared_by AND NOT p.removed WHERE s.room_id=?"
            + " AND s.notebook_id=?",
        room,
        notebook);
    return db.list(
        "SELECT title,kind,left(content,15000) content FROM notebook_source WHERE notebook_id=? AND"
            + " status='READY' ORDER BY created_at LIMIT 20",
        notebook);
  }
}
