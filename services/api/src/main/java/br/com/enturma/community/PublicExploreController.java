package br.com.enturma.community;

import br.com.enturma.common.ApiException;
import br.com.enturma.common.Db;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

/**
 * Explicit read-only discovery projection. Never returns credentials, memberships or invite codes.
 */
@RestController
@RequestMapping("/api/v1/public/explore")
public class PublicExploreController {
  private final Db db;
  private final ProfileShowcaseController showcases;
  private static final String PUBLIC_AUTHOR =
      "u.status='ACTIVE' AND EXISTS (SELECT 1 FROM forum_entry f WHERE f.author_id=u.id AND NOT"
          + " f.deleted)";
  private static final Set<String> CATEGORIES =
      Set.of("GENERAL", "PROGRAMMING", "ACADEMIC", "CAREER", "CAMPUS");
  private static final String VISIBLE = " NOT e.deleted AND u.status='ACTIVE' ";
  private static final String FORUM =
      """
      SELECT e.id,e.author_id,e.root_id,e.parent_id,e.title,e.body,e.category,e.depth,
        e.deleted,e.created_at,e.updated_at,e.accepted_answer_id,u.name,u.username,
        (u.avatar_bytes IS NOT NULL) has_avatar,u.media_version,u.accent_color,'{}'::jsonb profile_details,0 my_vote,
        coalesce((SELECT sum(value) FROM forum_vote WHERE entry_id=e.id),0) score,
        (SELECT count(*) FROM forum_entry c JOIN app_user cu ON cu.id=c.author_id
          WHERE c.root_id=e.id AND NOT c.deleted AND cu.status='ACTIVE') comments_count,
        ((SELECT accepted_answer_id FROM forum_entry WHERE id=coalesce(e.root_id,e.id))=e.id) accepted,
        coalesce((SELECT jsonb_agg(r) FROM (SELECT emoji,count(*) count,false mine
          FROM forum_reaction WHERE entry_id=e.id GROUP BY emoji ORDER BY emoji) r),'[]'::jsonb) reactions
      FROM forum_entry e JOIN app_user u ON u.id=e.author_id
      """;
  private static final String OPEN_ROOM =
      "r.status IN ('OPEN','ACTIVE') AND NOT r.entries_locked AND r.ends_at>now()";

  public PublicExploreController(Db db, ProfileShowcaseController showcases) {
    this.db = db;
    this.showcases = showcases;
  }

  @GetMapping("/users/{id}/profile")
  public Object authorProfile(@PathVariable UUID id) {
    var profile =
        db.one(
            "SELECT"
                + " u.id,u.name,u.username,u.bio,u.accent_color,u.profile_details,u.media_version,(u.avatar_bytes"
                + " IS NOT NULL) has_avatar,(u.banner_bytes IS NOT NULL) has_banner FROM app_user u"
                + " WHERE u.id=? AND "
                + PUBLIC_AUTHOR,
            id);
    return Map.of("profile", profile, "showcase", showcases.publicShowcase(id));
  }

  @GetMapping("/users/{id}/{kind:avatar|banner}")
  public ResponseEntity<byte[]> authorImage(@PathVariable UUID id, @PathVariable String kind) {
    // Only fixed, server-owned column names enter this query.
    boolean avatar = kind.equals("avatar");
    String bytes = avatar ? "avatar_bytes" : "banner_bytes";
    String mime = avatar ? "avatar_mime" : "banner_mime";
    var image =
        db.one(
            "SELECT u."
                + bytes
                + " data,u."
                + mime
                + " mime FROM app_user u WHERE u.id=? AND "
                + PUBLIC_AUTHOR
                + " AND u."
                + bytes
                + " IS NOT NULL",
            id);
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType((String) image.get("mime")))
        .header("Cache-Control", "no-store")
        .header("X-Content-Type-Options", "nosniff")
        .body((byte[]) image.get("data"));
  }

  @GetMapping("/forum")
  public Object forum(
      @RequestParam(defaultValue = "") String q,
      @RequestParam(defaultValue = "") String category,
      @RequestParam(defaultValue = "new") String sort,
      @RequestParam(defaultValue = "0") int page) {
    if (q.length() > 160
        || (!category.isEmpty() && !CATEGORIES.contains(category))
        || !Set.of("new", "top", "relevance").contains(sort))
      throw ApiException.invalid("Filtros inválidos.");
    String order =
        sort.equals("top")
            ? "score DESC,e.created_at DESC,e.id"
            : sort.equals("relevance") && !q.isBlank()
                ? "ts_rank(e.search_vector,websearch_to_tsquery('portuguese',?)) DESC,e.created_at"
                    + " DESC,e.id"
                : "e.created_at DESC,e.id";
    var args = new ArrayList<Object>(List.of(q, q, "%" + q + "%", category, category));
    if (sort.equals("relevance") && !q.isBlank()) args.add(q);
    args.add(Db.offset(page));
    return page(
        db.list(
            FORUM
                + " WHERE e.root_id IS NULL AND "
                + VISIBLE
                + " AND (?='' OR e.search_vector @@ websearch_to_tsquery('portuguese',?) OR e.title"
                + " ILIKE ?) AND (?='' OR e.category=?) ORDER BY "
                + order
                + " LIMIT 31 OFFSET ?",
            args.toArray()));
  }

  @GetMapping("/forum/{id}")
  public Map<String, Object> detail(@PathVariable UUID id) {
    return db.one(FORUM + " WHERE e.id=? AND e.root_id IS NULL AND " + VISIBLE, id);
  }

  @GetMapping("/forum/{id}/comments")
  public Object comments(@PathVariable UUID id, @RequestParam(defaultValue = "0") int page) {
    detail(id);
    return page(
        db.list(
            FORUM
                + " WHERE e.root_id=? AND "
                + VISIBLE
                + " ORDER BY e.created_at DESC,e.id LIMIT 31 OFFSET ?",
            id,
            Db.offset(page)));
  }

  @GetMapping("/forum/{id}/related")
  public Object related(@PathVariable UUID id) {
    var root = detail(id);
    return db.list(
        FORUM
            + " WHERE e.id<>? AND e.root_id IS NULL AND e.category=? AND "
            + VISIBLE
            + " ORDER BY score DESC,e.created_at DESC,e.id LIMIT 5",
        id,
        root.get("category"));
  }

  @GetMapping("/forum/{id}/target/{target}")
  public Object target(@PathVariable UUID id, @PathVariable UUID target) {
    detail(id);
    return db.one(
        FORUM + " WHERE e.id=? AND (e.id=? OR e.root_id=?) AND " + VISIBLE, target, id, id);
  }

  @GetMapping("/rooms")
  public Object rooms(
      @RequestParam(defaultValue = "0") int page, @RequestParam(required = false) UUID subjectId) {
    return db.list(
        """
        SELECT r.id,r.subject_id,r.title,r.status,r.max_participants,r.created_at,r.ends_at,
          r.lifecycle,r.entries_locked,r.has_avatar,r.has_banner,r.media_version,s.name subject_name,
          (SELECT count(*) FROM room_participant p WHERE p.room_id=r.id AND p.left_at IS NULL) participants
        FROM study_room r JOIN academic_entry s ON s.id=r.subject_id WHERE
        """
            + OPEN_ROOM
            + " AND (?::uuid IS NULL OR r.subject_id=?) ORDER BY r.created_at DESC,r.id LIMIT 30"
            + " OFFSET ?",
        subjectId,
        subjectId,
        Db.offset(page));
  }

  @GetMapping("/rooms/{id}/{kind}")
  public ResponseEntity<byte[]> roomImage(@PathVariable UUID id, @PathVariable String kind) {
    if (!Set.of("avatar", "banner").contains(kind)) throw ApiException.missing();
    var image =
        db.one(
            "SELECT m.mime,m.data FROM room_media m JOIN study_room r ON r.id=m.room_id WHERE"
                + " r.id=? AND m.kind=? AND "
                + OPEN_ROOM,
            id,
            kind);
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType((String) image.get("mime")))
        .header("Cache-Control", "no-store")
        .header("X-Content-Type-Options", "nosniff")
        .body((byte[]) image.get("data"));
  }

  private Object page(List<Map<String, Object>> rows) {
    return Map.of("items", rows.subList(0, Math.min(30, rows.size())), "hasMore", rows.size() > 30);
  }
}
