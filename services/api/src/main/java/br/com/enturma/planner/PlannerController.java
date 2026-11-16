package br.com.enturma.planner;

import br.com.enturma.auth.Actor;
import br.com.enturma.planner.PlannerService.*;
import java.time.LocalDate;
import java.util.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/planner")
public class PlannerController {
  private final PlannerService planner;
  private final AcademicTerms terms;

  public PlannerController(PlannerService planner, AcademicTerms terms) {
    this.planner = planner;
    this.terms = terms;
  }

  @GetMapping("/routine")
  public Object routine(@AuthenticationPrincipal Actor a) {
    return planner.routine(a);
  }

  @PutMapping("/routine")
  public Object saveRoutine(@AuthenticationPrincipal Actor a, @RequestBody Routine r) {
    return planner.saveRoutine(a, r);
  }

  public record Focus(boolean enabled) {}

  @GetMapping("/focus")
  public Object focus(@AuthenticationPrincipal Actor a) {
    return planner.focus(a);
  }

  @PutMapping("/focus")
  public Object setFocus(@AuthenticationPrincipal Actor a, @RequestBody Focus f) {
    return planner.setFocusMode(a, f.enabled());
  }

  @GetMapping("/calendar")
  public Object calendar(
      @AuthenticationPrincipal Actor a,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
    return planner.calendar(a, from, to);
  }

  @PostMapping("/classes")
  public Object addClasses(@AuthenticationPrincipal Actor a, @RequestBody ClassSeries s) {
    return Map.of("ids", planner.addClasses(a, s));
  }

  @PutMapping("/classes/{id}")
  public void updateClass(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @RequestBody ClassUpdate u) {
    planner.updateClass(a, id, u);
  }

  @DeleteMapping("/classes/{id}")
  public void deleteClass(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    planner.deleteClass(a, id);
  }

  @PostMapping("/classes/{id}/exceptions")
  public Object addException(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @RequestBody ClassException e) {
    return Map.of("id", planner.addException(a, id, e));
  }

  @DeleteMapping("/classes/{id}/exceptions/{exception}")
  public void deleteException(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @PathVariable UUID exception) {
    planner.deleteException(a, id, exception);
  }

  @PostMapping("/holidays")
  public Object addHoliday(@AuthenticationPrincipal Actor a, @RequestBody PersonalHoliday h) {
    return Map.of("id", planner.addHoliday(a, h));
  }

  @DeleteMapping("/holidays/{id}")
  public void deleteHoliday(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    planner.deleteHoliday(a, id);
  }

  @PostMapping("/vacations")
  public Object addVacation(@AuthenticationPrincipal Actor a, @RequestBody Vacation v) {
    return Map.of("id", planner.addVacation(a, v));
  }

  @PutMapping("/vacations/{id}")
  public void updateVacation(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @RequestBody Vacation v) {
    planner.updateVacation(a, id, v);
  }

  @DeleteMapping("/vacations/{id}")
  public void deleteVacation(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    planner.deleteVacation(a, id);
  }

  @GetMapping("/attendance")
  public Object attendance(@AuthenticationPrincipal Actor a, @RequestParam(required = false) UUID term) {
    return planner.attendance(a, term);
  }

  @GetMapping("/terms")
  public Object terms(@AuthenticationPrincipal Actor a) {
    return terms.overview(a);
  }

  /** Starts the next semester; the student then chooses its subjects. */
  @PostMapping("/terms")
  public Object startTerm(@AuthenticationPrincipal Actor a, @RequestBody AcademicTerms.NewTerm t) {
    return terms.start(a, t);
  }

  /** {@code status} PRESENT or ABSENT; null removes the answer. */
  public record Attendance(String key, String status) {}

  @PutMapping("/attendance")
  public void setAttendance(@AuthenticationPrincipal Actor a, @RequestBody Attendance body) {
    if (body.status() == null) planner.clearAttendance(a, body.key());
    else planner.setAttendance(a, body.key(), body.status());
  }

  @PostMapping("/tasks")
  public Object addTask(@AuthenticationPrincipal Actor a, @RequestBody PlannerTask t) {
    return Map.of("id", planner.addTask(a, t));
  }

  @PutMapping("/tasks/{id}")
  public void updateTask(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @RequestBody PlannerTask t) {
    planner.updateTask(a, id, t);
  }

  @DeleteMapping("/tasks/{id}")
  public void deleteTask(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    planner.deleteTask(a, id);
  }
}
