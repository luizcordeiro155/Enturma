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

  public PlannerController(PlannerService planner) {
    this.planner = planner;
  }

  @GetMapping("/routine")
  public Object routine(@AuthenticationPrincipal Actor a) {
    return planner.routine(a);
  }

  @PutMapping("/routine")
  public Object saveRoutine(@AuthenticationPrincipal Actor a, @RequestBody Routine r) {
    return planner.saveRoutine(a, r);
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
