package br.com.enturma.users;

import br.com.enturma.academics.CatalogService;
import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {
  private final Db db;
  private final CatalogService catalog;

  public ProfileService(Db db, CatalogService catalog) {
    this.db = db;
    this.catalog = catalog;
  }

  public Object me(Actor a) {
    var user =
        db.one(
            "SELECT id,name,username,email,email_verified,role FROM app_user WHERE id=?", a.id());
    user.put(
        "enrollment",
        db
            .list(
                "SELECT e.*,c.name period_name FROM academic_enrollment e JOIN academic_entry c ON"
                    + " c.id=e.period_id WHERE user_id=?",
                a.id())
            .stream()
            .findFirst()
            .orElse(null));
    user.put(
        "subjects",
        db.list(
            "SELECT c.* FROM user_subject s JOIN academic_entry c ON c.id=s.subject_id WHERE"
                + " s.user_id=? ORDER BY c.name",
            a.id()));
    return user;
  }

  @Transactional
  public void enroll(Actor a, UUID period, List<UUID> subjects, String shift, String preferences) {
    catalog.verified(period, "PERIOD");
    if (!Set.of("MORNING", "AFTERNOON", "EVENING", "FULL_TIME", "REMOTE").contains(shift))
      throw ApiException.invalid("Turno inválido.");
    if (subjects.isEmpty()
        || subjects.size() > 30
        || new HashSet<>(subjects).size() != subjects.size())
      throw ApiException.invalid("Selecione de 1 a 30 matérias diferentes.");
    for (UUID id : subjects)
      if (!catalog.verified(id, "SUBJECT").get("parentId").equals(period))
        throw ApiException.invalid("A matéria não pertence ao período selecionado.");
    db.jdbc.update(
        "INSERT INTO academic_enrollment(user_id,period_id,shift,preferences) VALUES (?,?,?,?) ON"
            + " CONFLICT(user_id) DO UPDATE SET"
            + " period_id=EXCLUDED.period_id,shift=EXCLUDED.shift,preferences=EXCLUDED.preferences",
        a.id(),
        period,
        shift,
        preferences);
    db.jdbc.update("DELETE FROM user_subject WHERE user_id=?", a.id());
    for (UUID id : subjects) db.jdbc.update("INSERT INTO user_subject VALUES (?,?)", a.id(), id);
  }
}
