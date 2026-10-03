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
  public record ExamPlanRequest(
      UUID subjectId,
      @NotBlank @Size(max=180) String title,
      @NotNull Instant examAt,
      @Size(max=20) List<@Size(max=120) String> topics) {}
  public record FlashcardRequest(
      UUID notebookId, UUID subjectId,
      @NotBlank @Size(max=1200) String front,
      @NotBlank @Size(max=2400) String back) {}
  public record FlashcardReview(@Min(1) @Max(4) int rating) {}
  public record GroupRequest(
      UUID subjectId,
      @NotBlank @Size(max=120) String name,
      @Size(max=600) String description,
      String visibility) {}

  @GetMapping("/today")
  public Object today(@AuthenticationPrincipal Actor a) {
    db.jdbc.update("INSERT INTO learning_stats(user_id) VALUES (?) ON CONFLICT DO NOTHING", a.id());
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
        "SELECT coalesce(total_xp,0) total_xp,coalesce(current_streak,0) streak"
        + " FROM learning_stats WHERE user_id=?", a.id());
    var activeRooms = db.one(
        "SELECT count(*) active_rooms FROM study_room r WHERE r.ends_at>now() AND r.status IN ('OPEN','ACTIVE')");
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


  @PostMapping("/exam-plan")
  @Transactional
  public Object examPlan(@AuthenticationPrincipal Actor a, @Valid @RequestBody ExamPlanRequest r) {
    if (!r.examAt().isAfter(Instant.now().plusSeconds(3600)))
      throw ApiException.invalid("A prova precisa estar no futuro.");
    if (r.subjectId() != null && !db.exists(
        "SELECT EXISTS(SELECT 1 FROM user_subject WHERE user_id=? AND subject_id=?)", a.id(), r.subjectId()))
      throw ApiException.invalid("Selecione esta matéria no seu perfil primeiro.");

    long days = Math.max(1, Duration.between(Instant.now(), r.examAt()).toDays());
    int sessions = (int)Math.min(10, Math.max(2, days));
    List<String> topics = r.topics() == null ? List.of() : r.topics().stream()
        .filter(Objects::nonNull).map(String::strip).filter(v -> !v.isBlank()).toList();
    List<Map<String,Object>> created = new ArrayList<>();

    for (int i=0;i<sessions;i++) {
      double fraction=(i+1.0)/(sessions+1.0);
      Instant due=Instant.now().plusSeconds((long)(Duration.between(Instant.now(),r.examAt()).toSeconds()*fraction));
      String topic=topics.isEmpty() ? "" : topics.get(i % topics.size());
      String title=(i==sessions-1 ? "Revisão final — " : "Revisão — ") + r.title();
      String notes=topic.isBlank()
          ? "Sessão criada automaticamente pelo plano de prova do Enturma."
          : "Foco: "+topic+". Sessão criada automaticamente pelo plano de prova do Enturma.";
      UUID id=UUID.randomUUID();
      db.jdbc.update(
          "INSERT INTO campus_task(id,user_id,subject_id,kind,title,notes,due_at,estimated_minutes,priority)"
          + " VALUES (?,?,?,'STUDY',?,?,?,45,?)",
          id,a.id(),r.subjectId(),title,notes,due,i>=sessions-2 ? "HIGH" : "NORMAL");
      created.add(Map.of("id",id,"dueAt",due.toString(),"title",title,"topic",topic));
    }
    UUID examId=UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO campus_task(id,user_id,subject_id,kind,title,notes,due_at,estimated_minutes,priority)"
        + " VALUES (?,?,?,'EXAM',?,'Gerado pelo plano de preparação.',?,60,'URGENT')",
        examId,a.id(),r.subjectId(),r.title(),r.examAt());
    return Map.of("sessions",created,"examTaskId",examId);
  }

  @GetMapping("/flashcards/due")
  public Object dueFlashcards(@AuthenticationPrincipal Actor a) {
    return db.list(
        "SELECT f.id,f.front,f.back,f.next_review_at,f.review_count,e.name subject_name,n.title notebook_title"
        + " FROM study_flashcard f LEFT JOIN academic_entry e ON e.id=f.subject_id"
        + " LEFT JOIN study_notebook n ON n.id=f.notebook_id"
        + " WHERE f.user_id=? AND f.next_review_at<=now() ORDER BY f.next_review_at LIMIT 50",
        a.id());
  }

  @PostMapping("/flashcards")
  public Object flashcard(@AuthenticationPrincipal Actor a, @Valid @RequestBody FlashcardRequest r) {
    if (r.notebookId()!=null && !db.exists(
        "SELECT EXISTS(SELECT 1 FROM study_notebook WHERE id=? AND user_id=?)",r.notebookId(),a.id()))
      throw ApiException.forbidden();
    UUID id=UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO study_flashcard(id,user_id,notebook_id,subject_id,front,back) VALUES (?,?,?,?,?,?)",
        id,a.id(),r.notebookId(),r.subjectId(),r.front().strip(),r.back().strip());
    return Map.of("id",id);
  }

  @PostMapping("/flashcards/{id}/review")
  @Transactional
  public Object reviewFlashcard(
      @AuthenticationPrincipal Actor a,@PathVariable UUID id,@Valid @RequestBody FlashcardReview r) {
    var card=db.one("SELECT interval_days,ease FROM study_flashcard WHERE id=? AND user_id=? FOR UPDATE",id,a.id());
    int old=((Number)card.get("intervalDays")).intValue();
    double ease=((Number)card.get("ease")).doubleValue();
    int interval;
    if(r.rating()==1){interval=0;ease=Math.max(1.3,ease-.20);}
    else if(r.rating()==2){interval=Math.max(1,old==0?1:old);ease=Math.max(1.3,ease-.10);}
    else if(r.rating()==3){interval=old==0?1:Math.max(2,(int)Math.round(old*ease));}
    else {interval=old==0?3:Math.max(4,(int)Math.round(old*(ease+.25)));ease=Math.min(3.2,ease+.10);}
    db.jdbc.update(
        "UPDATE study_flashcard SET interval_days=?,ease=?,review_count=review_count+1,"
        + " next_review_at=now()+(? * interval '1 day') WHERE id=? AND user_id=?",
        interval,ease,interval,id,a.id());
    return Map.of("intervalDays",interval,"ease",ease);
  }

  @GetMapping("/groups")
  public Object groups(@AuthenticationPrincipal Actor a) {
    return db.list(
        "SELECT g.id,g.name,g.description,g.visibility,g.owner_id,e.name subject_name,"
        + " count(m.user_id) members, bool_or(m.user_id=?) joined"
        + " FROM study_group g LEFT JOIN study_group_member m ON m.group_id=g.id"
        + " LEFT JOIN academic_entry e ON e.id=g.subject_id"
        + " WHERE g.visibility='PUBLIC' OR g.owner_id=? OR EXISTS(SELECT 1 FROM study_group_member x WHERE x.group_id=g.id AND x.user_id=?)"
        + " GROUP BY g.id,e.name ORDER BY g.created_at DESC LIMIT 50",
        a.id(),a.id(),a.id());
  }

  @PostMapping("/groups")
  @Transactional
  public Object createGroup(@AuthenticationPrincipal Actor a,@Valid @RequestBody GroupRequest r) {
    String visibility=normalize(r.visibility(),Set.of("PRIVATE","COURSE","PUBLIC"),"PRIVATE");
    UUID id=UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO study_group(id,owner_id,subject_id,name,description,visibility) VALUES (?,?,?,?,?,?)",
        id,a.id(),r.subjectId(),r.name().strip(),Objects.toString(r.description(),"").strip(),visibility);
    db.jdbc.update(
        "INSERT INTO study_group_member(group_id,user_id,role) VALUES (?,?,'OWNER')",id,a.id());
    return Map.of("id",id);
  }

  @PostMapping("/groups/{id}/join")
  public void joinGroup(@AuthenticationPrincipal Actor a,@PathVariable UUID id) {
    var g=db.one("SELECT visibility FROM study_group WHERE id=?",id);
    if("PRIVATE".equals(g.get("visibility"))) throw ApiException.forbidden();
    db.jdbc.update(
        "INSERT INTO study_group_member(group_id,user_id,role) VALUES (?,?,'MEMBER') ON CONFLICT DO NOTHING",
        id,a.id());
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
