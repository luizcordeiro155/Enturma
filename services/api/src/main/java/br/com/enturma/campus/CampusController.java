package br.com.enturma.campus;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.ApiException;
import br.com.enturma.common.Db;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.*;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/campus")
public class CampusController {
  private final Db db;

  public CampusController(Db db) { this.db = db; }

  public record TaskRequest(
      UUID subjectId,
      @NotBlank @Size(max=180) String title,
      @Size(max=1200) String notes,
      @NotBlank String kind,
      @NotNull Instant dueAt,
      @Min(5) @Max(1440) int estimatedMinutes,
      String priority) {}

  public record FocusRequest(UUID subjectId, @Size(max=180) String label, @Min(5) @Max(240) int minutes) {}
  public record MatchRequest(UUID subjectId, @Size(max=200) String goal, boolean availableNow, String preferredMode) {}

  @GetMapping("/today")
  public Object today(@AuthenticationPrincipal Actor a) {
    var tasks = db.list(
        "SELECT t.id,t.kind,t.title,t.notes,t.due_at,t.estimated_minutes,t.priority,t.completed_at,"
        + " e.name subject_name FROM campus_task t LEFT JOIN academic_entry e ON e.id=t.subject_id"
        + " WHERE t.user_id=? AND t.due_at<now()+interval '8 days' ORDER BY t.completed_at NULLS FIRST,t.due_at LIMIT 40",
        a.id());
    var focus = db.one(
        "SELECT coalesce(sum(actual_seconds),0) focus_seconds,"
        + " count(*) FILTER(WHERE finished_at IS NOT NULL) focus_sessions"
        + " FROM focus_session WHERE user_id=? AND started_at>=date_trunc('week',now())",
        a.id());
    var flashcards = db.one(
        "SELECT count(*) FILTER(WHERE next_review_at<=now()) due_flashcards,count(*) total_flashcards"
        + " FROM study_flashcard WHERE user_id=?", a.id());
    var study = db.one(
        "SELECT coalesce(total_xp,0) total_xp,coalesce(streak,0) streak"
        + " FROM learning_stats WHERE user_id=?", a.id());
    var activeRooms = db.one(
        "SELECT count(*) active_rooms FROM study_room r WHERE r.ends_at>now() AND NOT r.ended");
    var matched = db.list(
        "SELECT u.id,u.name,u.username,p.goal,p.preferred_mode,e.name subject_name"
        + " FROM study_match_profile p JOIN app_user u ON u.id=p.user_id"
        + " LEFT JOIN academic_entry e ON e.id=p.subject_id"
        + " WHERE p.available_now AND p.user_id<>? AND u.status='ACTIVE'"
        + " AND (p.subject_id IS NULL OR p.subject_id IN (SELECT subject_id FROM user_subject WHERE user_id=?))"
        + " ORDER BY p.updated_at DESC LIMIT 6",
        a.id(), a.id());
    var opportunities = db.list(
        "SELECT * FROM campus_opportunity WHERE expires_at IS NULL OR expires_at>now() ORDER BY created_at DESC LIMIT 6");
    var events = db.list(
        "SELECT * FROM campus_event WHERE starts_at>now()-interval '3 hours' ORDER BY starts_at LIMIT 6");

    Map<String,Object> result = new LinkedHashMap<>();
    result.put("tasks", tasks);
    result.put("focus", focus);
    result.put("flashcards", flashcards);
    result.put("study", study);
    result.put("activeRooms", activeRooms.get("activeRooms"));
    result.put("matches", matched);
    result.put("opportunities", opportunities);
    result.put("events", events);
    return result;
  }

  @PostMapping("/tasks")
  @Transactional
  public Object task(@AuthenticationPrincipal Actor a, @Valid @RequestBody TaskRequest r) {
    String kind = normalize(r.kind(), Set.of("CLASS","EXAM","ASSIGNMENT","PRESENTATION","STUDY","GROUP","EVENT"), "STUDY");
    String priority = normalize(r.priority(), Set.of("LOW","NORMAL","HIGH","URGENT"), "NORMAL");
    UUID id=UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO campus_task(id,user_id,subject_id,kind,title,notes,due_at,estimated_minutes,priority)"
        + " VALUES (?,?,?,?,?,?,?,?,?)",
        id,a.id(),r.subjectId(),kind,r.title().strip(),Objects.toString(r.notes(),"").strip(),r.dueAt(),r.estimatedMinutes(),priority);
    return Map.of("id",id);
  }

  @PostMapping("/tasks/{id}/complete")
  public void complete(@AuthenticationPrincipal Actor a,@PathVariable UUID id) {
    if (db.jdbc.update("UPDATE campus_task SET completed_at=now() WHERE id=? AND user_id=? AND completed_at IS NULL",id,a.id())==0)
      throw ApiException.missing();
  }

  @DeleteMapping("/tasks/{id}")
  public void deleteTask(@AuthenticationPrincipal Actor a,@PathVariable UUID id) {
    db.jdbc.update("DELETE FROM campus_task WHERE id=? AND user_id=?",id,a.id());
  }

  @PostMapping("/focus")
  @Transactional
  public Object focus(@AuthenticationPrincipal Actor a,@Valid @RequestBody FocusRequest r) {
    UUID id=UUID.randomUUID();
    db.jdbc.update("INSERT INTO focus_session(id,user_id,subject_id,label,planned_minutes) VALUES (?,?,?,?,?)",
        id,a.id(),r.subjectId(),Objects.toString(r.label(),"Sessão de foco").strip(),r.minutes());
    return Map.of("id",id,"startedAt",Instant.now().toString());
  }

  @PostMapping("/focus/{id}/finish")
  public void finishFocus(@AuthenticationPrincipal Actor a,@PathVariable UUID id) {
    int changed=db.jdbc.update(
        "UPDATE focus_session SET finished_at=now(),actual_seconds=GREATEST(0,EXTRACT(EPOCH FROM (now()-started_at))::bigint)"
        + " WHERE id=? AND user_id=? AND finished_at IS NULL",id,a.id());
    if(changed==0) throw ApiException.missing();
  }

  @PutMapping("/study-match")
  public void match(@AuthenticationPrincipal Actor a,@Valid @RequestBody MatchRequest r) {
    String mode=normalize(r.preferredMode(),Set.of("TEXT","VOICE","VIDEO","ANY"),"ANY");
    db.jdbc.update(
        "INSERT INTO study_match_profile(user_id,subject_id,goal,available_now,preferred_mode,updated_at)"
        + " VALUES (?,?,?,?,?,now()) ON CONFLICT(user_id) DO UPDATE SET subject_id=EXCLUDED.subject_id,"
        + " goal=EXCLUDED.goal,available_now=EXCLUDED.available_now,preferred_mode=EXCLUDED.preferred_mode,updated_at=now()",
        a.id(),r.subjectId(),Objects.toString(r.goal(),"").strip(),r.availableNow(),mode);
  }

  @GetMapping("/progress")
  public Object progress(@AuthenticationPrincipal Actor a) {
    return db.list(
        "SELECT date(started_at) day,sum(actual_seconds) seconds,count(*) sessions FROM focus_session"
        + " WHERE user_id=? AND started_at>=current_date-interval '30 days' GROUP BY date(started_at) ORDER BY day",
        a.id());
  }

  private String normalize(String value,Set<String> allowed,String fallback){
    String normalized=value==null?fallback:value.strip().toUpperCase(Locale.ROOT);
    if(!allowed.contains(normalized)) throw ApiException.invalid("Opção inválida.");
    return normalized;
  }
}
