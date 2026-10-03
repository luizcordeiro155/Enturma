package br.com.enturma.campus;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.ApiException;
import br.com.enturma.common.Db;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/campus/groups")
public class GroupWorkspaceController {
  private final Db db;

  public GroupWorkspaceController(Db db) {
    this.db = db;
  }

  public record Task(
      @NotBlank @Size(max = 180) String title,
      @Size(max = 1200) String description,
      UUID assignedTo,
      Instant dueAt) {}

  public record Move(
      @NotBlank @Pattern(regexp = "TODO|DOING|DONE") String status,
      @Min(0) @Max(999) int position) {}

  private Map<String, Object> group(Actor a, UUID id) {
    var g =
        db.one(
            "SELECT g.*,e.name subject_name FROM study_group g"
                + " LEFT JOIN academic_entry e ON e.id=g.subject_id WHERE g.id=?",
            id);
    boolean owner = a.id().equals(g.get("ownerId"));
    boolean member =
        db.exists(
            "SELECT EXISTS(SELECT 1 FROM study_group_member WHERE group_id=? AND user_id=?)",
            id,
            a.id());
    if (!owner && !member) throw ApiException.forbidden();
    return g;
  }

  @GetMapping("/{id}/workspace")
  public Object workspace(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    var g = group(a, id);
    g.put(
        "members",
        db.list(
            "SELECT u.id,u.name,u.username,m.role FROM study_group_member m"
                + " JOIN app_user u ON u.id=m.user_id WHERE m.group_id=? ORDER BY m.joined_at",
            id));
    g.put(
        "tasks",
        db.list(
            "SELECT t.*,u.name assigned_name FROM study_group_task t"
                + " LEFT JOIN app_user u ON u.id=t.assigned_to WHERE t.group_id=?"
                + " ORDER BY t.status,t.position,t.created_at",
            id));
    return g;
  }

  @PostMapping("/{id}/tasks")
  public Object create(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID id,
      @Valid @RequestBody Task r) {
    group(a, id);
    if (r.assignedTo() != null
        && !db.exists(
            "SELECT EXISTS(SELECT 1 FROM study_group_member WHERE group_id=? AND user_id=?)",
            id,
            r.assignedTo()))
      throw ApiException.invalid("A pessoa precisa fazer parte do grupo.");

    UUID task = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO study_group_task(id,group_id,created_by,assigned_to,title,description,due_at)"
            + " VALUES (?,?,?,?,?,?,?)",
        task,
        id,
        a.id(),
        r.assignedTo(),
        r.title().strip(),
        Objects.toString(r.description(), "").strip(),
        r.dueAt());
    return Map.of("id", task);
  }

  @PatchMapping("/{groupId}/tasks/{taskId}")
  public void move(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID groupId,
      @PathVariable UUID taskId,
      @Valid @RequestBody Move r) {
    group(a, groupId);
    if (db.jdbc.update(
            "UPDATE study_group_task SET status=?,position=?,updated_at=now()"
                + " WHERE id=? AND group_id=?",
            r.status(),
            r.position(),
            taskId,
            groupId)
        == 0) throw ApiException.missing();
  }

  @DeleteMapping("/{groupId}/tasks/{taskId}")
  public void delete(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID groupId,
      @PathVariable UUID taskId) {
    group(a, groupId);
    db.jdbc.update("DELETE FROM study_group_task WHERE id=? AND group_id=?", taskId, groupId);
  }
}
