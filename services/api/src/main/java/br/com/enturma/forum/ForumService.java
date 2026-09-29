package br.com.enturma.forum;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ForumService {
  private final Db db;
  private final br.com.enturma.notifications.NotificationService notices;
  private static final Set<String> CATEGORIES =
      Set.of("GENERAL", "PROGRAMMING", "ACADEMIC", "CAREER", "CAMPUS");
  private static final Set<String> REACTIONS = Set.of("👍", "❤️", "💡", "🎉", "🤔");

  public ForumService(Db db, br.com.enturma.notifications.NotificationService notices) {
    this.notices = notices;
    this.db = db;
  }

  public Object highlights(Actor a) {
    return db.list(
        "SELECT * FROM (SELECT e.id,e.author_id,e.title,e.body excerpt,e.category,"
            + " e.created_at,u.name,u.username,u.accent_color,u.profile_details,u.avatar_bytes IS"
            + " NOT NULL has_avatar,(SELECT count(*) FROM forum_vote v WHERE v.entry_id=e.id AND"
            + " v.value=1) likes,(SELECT count(*) FROM forum_reaction r WHERE r.entry_id=e.id)"
            + " reaction_count,(SELECT count(*) FROM forum_entry c WHERE c.root_id=e.id AND NOT"
            + " c.deleted) comments_count FROM forum_entry e JOIN app_user u ON u.id=e.author_id"
            + " WHERE e.root_id IS NULL AND NOT e.deleted AND e.created_at >= now()-interval '30"
            + " days' AND "
            + visible()
            + ") h ORDER BY (likes+reaction_count) DESC,created_at DESC,id LIMIT 4",
        a.id(),
        a.id());
  }

  private String visible() {
    return " u.status='ACTIVE' AND NOT EXISTS(SELECT 1 FROM user_block b WHERE (b.user_id=? AND"
        + " b.blocked_id=e.author_id) OR (b.blocked_id=? AND b.user_id=e.author_id)) ";
  }

  private String projection() {
    return "SELECT e.*,u.name,u.username,u.accent_color,u.profile_details,u.avatar_bytes IS NOT"
        + " NULL has_avatar,coalesce((SELECT sum(v.value) FROM forum_vote v WHERE"
        + " v.entry_id=e.id),0) score,coalesce((SELECT v.value FROM forum_vote v WHERE"
        + " v.entry_id=e.id AND v.user_id=?),0) my_vote,(SELECT count(*) FROM forum_entry c"
        + " WHERE c.root_id=e.id AND NOT c.deleted) comments_count,coalesce((SELECT"
        + " jsonb_agg(r) FROM (SELECT emoji,count(*) count,bool_or(user_id=?) mine FROM"
        + " forum_reaction WHERE entry_id=e.id GROUP BY emoji ORDER BY emoji)r),'[]'::jsonb)"
        + " reactions FROM forum_entry e JOIN app_user u ON u.id=e.author_id ";
  }

  public Object list(Actor a, String query, String category, String sort, int page, boolean mine) {
    if (query.length() > 160
        || (!category.isEmpty() && !CATEGORIES.contains(category))
        || !Set.of("new", "top", "relevance").contains(sort))
      throw ApiException.invalid("Filtros inválidos.");
    String order =
        sort.equals("top")
            ? "score DESC,e.created_at DESC,e.id"
            : sort.equals("relevance") && !query.isBlank()
                ? "ts_rank(e.search_vector,websearch_to_tsquery('portuguese',?)) DESC,e.created_at"
                    + " DESC,e.id"
                : "e.created_at DESC,e.id";
    var args =
        new ArrayList<Object>(
            List.of(
                a.id(),
                a.id(),
                a.id(),
                a.id(),
                query,
                query,
                "%" + query + "%",
                category,
                category,
                mine,
                a.id()));
    if (sort.equals("relevance") && !query.isBlank()) args.add(query);
    args.add(Db.offset(page));
    var rows =
        db.list(
            projection()
                + " WHERE e.root_id IS NULL AND NOT e.deleted AND "
                + visible()
                + " AND (?='' OR e.search_vector @@ websearch_to_tsquery('portuguese',?) OR e.title"
                + " ILIKE ?) AND (?='' OR e.category=?) AND (NOT ? OR e.author_id=?) ORDER BY "
                + order
                + " LIMIT 31 OFFSET ?",
            args.toArray());
    boolean more = rows.size() > 30;
    return Map.of("items", rows.subList(0, Math.min(30, rows.size())), "hasMore", more);
  }

  private Map<String, Object> entry(Actor a, UUID id, boolean lock) {
    var e = db.one("SELECT * FROM forum_entry WHERE id=?", id);
    UUID root = e.get("rootId") == null ? id : (UUID) e.get("rootId");
    db.one(
        "SELECT id FROM forum_entry WHERE id=? AND NOT deleted" + (lock ? " FOR UPDATE" : ""),
        root);
    e =
        db.one(
            "SELECT e.* FROM forum_entry e JOIN app_user u ON u.id=e.author_id WHERE e.id=? AND NOT"
                + " e.deleted AND "
                + visible(),
            id,
            a.id(),
            a.id());
    if (!root.equals(id))
      db.one(
          "SELECT e.id FROM forum_entry e JOIN app_user u ON u.id=e.author_id WHERE e.id=? AND "
              + visible(),
          root,
          a.id(),
          a.id());
    return e;
  }

  public Object detail(Actor a, UUID id) {
    var e = entry(a, id, false);
    if (e.get("rootId") != null) throw ApiException.missing();
    return db.one(projection() + " WHERE e.id=?", a.id(), a.id(), id);
  }

  public Object comments(Actor a, UUID id, int page) {
    detail(a, id);
    var rows =
        db.list(
            projection()
                + " WHERE e.root_id=? AND "
                + visible()
                + " ORDER BY e.created_at DESC,e.id LIMIT 31 OFFSET ?",
            a.id(),
            a.id(),
            id,
            a.id(),
            a.id(),
            Db.offset(page));
    return Map.of("items", rows.subList(0, Math.min(30, rows.size())), "hasMore", rows.size() > 30);
  }

  public Object target(Actor a, UUID root, UUID target) {
    detail(a, root);
    var e = entry(a, target, false);
    if (!target.equals(root) && !root.equals(e.get("rootId"))) throw ApiException.missing();
    return db.one(projection() + " WHERE e.id=?", a.id(), a.id(), target);
  }

  public Object related(Actor a, UUID id) {
    var e = entry(a, id, false);
    String title = Objects.toString(e.get("title"), "");
    String terms =
        String.join(
            " OR ",
            Arrays.stream(title.split("[^\\p{L}\\p{N}]+"))
                .filter(w -> w.length() > 3)
                .distinct()
                .limit(8)
                .toList());
    return db.list(
        projection()
            + " WHERE e.root_id IS NULL AND NOT e.deleted AND e.id<>? AND "
            + visible()
            + " AND (e.search_vector @@ websearch_to_tsquery('portuguese',?) OR e.category=?) ORDER"
            + " BY ts_rank(e.search_vector,websearch_to_tsquery('portuguese',?)) DESC,e.created_at"
            + " DESC LIMIT 5",
        a.id(),
        a.id(),
        id,
        a.id(),
        a.id(),
        terms,
        e.get("category"),
        terms);
  }

  private void valid(String title, String body, String category) {
    if (title == null
        || title.strip().length() < 5
        || title.length() > 180
        || body == null
        || body.isBlank()
        || body.length() > 12000
        || category == null
        || !CATEGORIES.contains(category))
      throw ApiException.invalid("Informe um título de 5 a 180 caracteres, conteúdo e assunto.");
  }

  @Transactional
  public Object create(Actor a, String title, String body, String category) {
    valid(title, body, category);
    UUID id = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO forum_entry(id,author_id,title,body,category) VALUES (?,?,?,?,?)",
        id,
        a.id(),
        title.strip(),
        body.strip(),
        category);
    notices.forumMentions(a.id(), id, id, title + " " + body);
    notices.forumChanged();
    return Map.of("id", id);
  }

  @Transactional
  public void edit(Actor a, UUID id, String title, String body, String category) {
    var e = entry(a, id, true);
    if (!e.get("authorId").equals(a.id())) throw ApiException.forbidden();
    if (e.get("rootId") == null) {
      valid(title, body, category);
      db.jdbc.update(
          "UPDATE forum_entry SET title=?,body=?,category=?,updated_at=now() WHERE id=?",
          title.strip(),
          body.strip(),
          category,
          id);
    } else {
      if (body == null || body.isBlank() || body.length() > 4000)
        throw ApiException.invalid("Escreva até 4.000 caracteres.");
      db.jdbc.update("UPDATE forum_entry SET body=?,updated_at=now() WHERE id=?", body.strip(), id);
    }
    notices.forumMentions(a.id(), e.get("rootId") == null ? id : (UUID) e.get("rootId"), id, body);
    notices.forumChanged();
  }

  @Transactional
  public Object comment(Actor a, UUID root, UUID parent, String body) {
    var post = entry(a, root, true);
    if (post.get("rootId") != null) throw ApiException.invalid("Escolha uma publicação.");
    if (body == null || body.isBlank() || body.length() > 4000)
      throw ApiException.invalid("Escreva até 4.000 caracteres.");
    int depth = 1;
    UUID target = parent == null ? root : parent;
    if (!target.equals(root)) {
      var e = entry(a, target, false);
      if (!root.equals(e.get("rootId")))
        throw ApiException.invalid("A resposta deve pertencer a esta publicação.");
      depth = ((Number) e.get("depth")).intValue() + 1;
      if (depth > 4)
        throw ApiException.invalid(
            "Limite de respostas nesta sequência. Comente diretamente na publicação.");
    }
    UUID id = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO forum_entry(id,author_id,root_id,parent_id,body,category,depth) VALUES"
            + " (?,?,?,?,?,?,?)",
        id,
        a.id(),
        root,
        target,
        body.strip(),
        post.get("category"),
        depth);
    notices.forumMentions(a.id(), root, id, body);
    UUID recipient = (UUID) (target.equals(root) ? post : entry(a, target, false)).get("authorId");
    if (!notices.mentions(body).contains(recipient))
      notices.send(
          a.id(),
          recipient,
          "FORUM_REPLY",
          "forum:" + root,
          id,
          "/forum/" + root + "#entry-" + id,
          "Alguém respondeu à sua conversa no fórum.");
    notices.forumChanged();
    return Map.of("id", id);
  }

  @Transactional
  public void delete(Actor a, UUID id) {
    var e = entry(a, id, true);
    if (!e.get("authorId").equals(a.id()) && !a.admin()) throw ApiException.forbidden();
    if (e.get("rootId") == null) {
      db.jdbc.update("DELETE FROM notification WHERE context_key=?", "forum:" + id);
      db.jdbc.update("DELETE FROM forum_entry WHERE id=?", id);
    } else {
      db.jdbc.update("UPDATE forum_entry SET body='',deleted=true,updated_at=now() WHERE id=?", id);
      db.jdbc.update("DELETE FROM forum_vote WHERE entry_id=?", id);
      db.jdbc.update("DELETE FROM forum_reaction WHERE entry_id=?", id);
    }
    notices.forumChanged();
  }

  @Transactional
  public void vote(Actor a, UUID id, int value) {
    var e = entry(a, id, true);
    if (value < -1 || value > 1) throw ApiException.invalid("Voto inválido.");
    if (value == 0)
      db.jdbc.update("DELETE FROM forum_vote WHERE entry_id=? AND user_id=?", id, a.id());
    else
      db.jdbc.update(
          "INSERT INTO forum_vote(entry_id,user_id,value) VALUES (?,?,?) ON"
              + " CONFLICT(entry_id,user_id) DO UPDATE SET value=EXCLUDED.value",
          id,
          a.id(),
          value);
    if (value == 1) activity(a, e, id, "FORUM_LIKE", "Sua publicação recebeu uma curtida.");
    notices.forumChanged();
  }

  @Transactional
  public void react(Actor a, UUID id, String emoji) {
    var e = entry(a, id, true);
    if (emoji == null || emoji.isEmpty()) {
      db.jdbc.update("DELETE FROM forum_reaction WHERE entry_id=? AND user_id=?", id, a.id());
      notices.forumChanged();
      return;
    }
    if (!REACTIONS.contains(emoji)) throw ApiException.invalid("Reação inválida.");
    db.jdbc.update(
        "INSERT INTO forum_reaction(entry_id,user_id,emoji) VALUES (?,?,?) ON"
            + " CONFLICT(entry_id,user_id) DO UPDATE SET emoji=EXCLUDED.emoji",
        id,
        a.id(),
        emoji);
    activity(a, e, id, "FORUM_REACTION", "Sua publicação recebeu uma reação.");
    notices.forumChanged();
  }

  private void activity(Actor a, Map<String, Object> entry, UUID id, String kind, String message) {
    UUID root = entry.get("rootId") == null ? id : (UUID) entry.get("rootId");
    notices.send(
        a.id(),
        (UUID) entry.get("authorId"),
        kind,
        "forum:" + root,
        id,
        "/forum/" + root + "#entry-" + id,
        message);
  }
}
