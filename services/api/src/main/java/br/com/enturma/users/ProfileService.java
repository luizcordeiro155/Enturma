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
            "SELECT id,name,username,email,email_verified,role,bio,accent_color,"
                + " avatar_bytes IS NOT NULL has_avatar,banner_bytes IS NOT NULL has_banner"
                + " FROM app_user WHERE id=?",
            a.id());
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
  public void updateAppearance(Actor a, String name, String bio, String accentColor) {
    String color = accentColor == null ? "#183f36" : accentColor.strip();
    if (!color.matches("^#[0-9A-Fa-f]{6}$")) throw ApiException.invalid("Cor de destaque inválida.");
    String safeName = name == null ? "" : name.strip();
    if (safeName.length() < 2 || safeName.length() > 100)
      throw ApiException.invalid("Nome deve ter entre 2 e 100 caracteres.");
    String safeBio = bio == null ? "" : bio.strip();
    if (safeBio.length() > 280) throw ApiException.invalid("Bio deve ter até 280 caracteres.");
    db.jdbc.update(
        "UPDATE app_user SET name=?,bio=?,accent_color=? WHERE id=?",
        safeName,
        safeBio.isBlank() ? null : safeBio,
        color.toLowerCase(Locale.ROOT),
        a.id());
  }

  @Transactional
  public void saveAvatar(Actor a, String mime, byte[] bytes) {
    validateImage(mime, bytes, 2 * 1024 * 1024, "avatar");
    db.jdbc.update(
        "UPDATE app_user SET avatar_mime=?,avatar_bytes=? WHERE id=?", mime, bytes, a.id());
  }

  @Transactional
  public void saveBanner(Actor a, String mime, byte[] bytes) {
    validateImage(mime, bytes, 3 * 1024 * 1024, "banner");
    db.jdbc.update(
        "UPDATE app_user SET banner_mime=?,banner_bytes=? WHERE id=?", mime, bytes, a.id());
  }

  public record ImageAsset(byte[] bytes, String mime) {}

  public ImageAsset avatar(UUID userId) {
    var row = db.one("SELECT avatar_mime,avatar_bytes FROM app_user WHERE id=?", userId);
    if (row.get("avatarBytes") == null)
      throw new ApiException(404, "AVATAR_NOT_FOUND", "Este usuário ainda não possui avatar.");
    return new ImageAsset((byte[]) row.get("avatarBytes"), String.valueOf(row.get("avatarMime")));
  }

  public ImageAsset banner(UUID userId) {
    var row = db.one("SELECT banner_mime,banner_bytes FROM app_user WHERE id=?", userId);
    if (row.get("bannerBytes") == null)
      throw new ApiException(404, "BANNER_NOT_FOUND", "Este usuário ainda não possui banner.");
    return new ImageAsset((byte[]) row.get("bannerBytes"), String.valueOf(row.get("bannerMime")));
  }

  private void validateImage(String mime, byte[] bytes, int max, String label) {
    if (bytes == null || bytes.length == 0 || bytes.length > max)
      throw ApiException.invalid(
          "O " + label + " deve ter no máximo " + (max / 1024 / 1024) + " MB.");
    if (!Set.of("image/jpeg", "image/png", "image/webp", "image/gif").contains(mime))
      throw ApiException.invalid("Formato de imagem não suportado.");
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
