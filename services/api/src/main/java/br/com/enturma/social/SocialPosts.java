package br.com.enturma.social;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import br.com.enturma.notifications.*;
import java.net.URI;
import java.util.*;
import java.util.regex.Pattern;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SocialPosts {
  private final Db db;
  private final SocialAccess access;
  private final NotificationService notices;
  private final ApplicationEventPublisher events;
  private final com.fasterxml.jackson.databind.ObjectMapper json;

  public SocialPosts(
      Db db,
      SocialAccess access,
      NotificationService notices,
      ApplicationEventPublisher events,
      com.fasterxml.jackson.databind.ObjectMapper json) {
    this.db = db;
    this.access = access;
    this.notices = notices;
    this.events = events;
    this.json = json;
  }

  public static List<String> tags(String body) {
    var tags = new LinkedHashSet<String>();
    var m =
        Pattern.compile("(?<![\\p{L}\\p{N}_])#([\\p{L}\\p{N}_]{1,40})")
            .matcher(body == null ? "" : body);
    while (m.find() && tags.size() < 20) tags.add(m.group(1).toLowerCase(Locale.ROOT));
    return List.copyOf(tags);
  }

  private static String project(String raw) {
    if (raw == null || raw.isBlank()) return null;
    try {
      URI uri = URI.create(raw);
      if (raw.length() > 500
          || !"https".equals(uri.getScheme())
          || uri.getHost() == null
          || uri.getUserInfo() != null) throw new IllegalArgumentException();
      return uri.toASCIIString();
    } catch (RuntimeException e) {
      throw ApiException.invalid("Use um link HTTPS válido para o projeto.");
    }
  }

  public record StoryOverlay(String text, double x, double y) {}

  public record Draft(
      UUID id,
      String kind,
      String body,
      String visibility,
      String projectUrl,
      int version,
      List<UUID> mediaIds,
      List<StoryOverlay> storyOverlays) {
    public Draft(
        UUID id,
        String kind,
        String body,
        String visibility,
        String projectUrl,
        int version,
        List<UUID> mediaIds) {
      this(id, kind, body, visibility, projectUrl, version, mediaIds, List.of());
    }
  }

  @Transactional
  public Map<String, Object> draft(Actor a, Draft input) {
    access.profile(a.id());
    // Serialize an owner's drafts before locking posts and reassigning their media.
    db.one("SELECT user_id FROM social_profile WHERE user_id=? FOR UPDATE", a.id());
    if (input.id() == null
        || input.kind() == null
        || !Set.of("POST", "CLIP", "STORY").contains(input.kind())
        || input.body() == null
        || input.body().length() > 4000
        || input.visibility() == null
        || !Set.of("PUBLIC", "FOLLOWERS").contains(input.visibility())
        || input.mediaIds() == null
        || input.mediaIds().stream().anyMatch(Objects::isNull)
        || input.mediaIds().size() > 10
        || new HashSet<>(input.mediaIds()).size() != input.mediaIds().size())
      throw ApiException.invalid("Revise a publicação e suas mídias.");
    String url = project(input.projectUrl());
    var overlays = input.storyOverlays() == null ? List.<StoryOverlay>of() : input.storyOverlays();
    if (overlays.size() > 8
        || (!input.kind().equals("STORY") && !overlays.isEmpty())
        || overlays.stream()
            .anyMatch(
                o ->
                    o == null
                        || o.text() == null
                        || o.text().isBlank()
                        || o.text().length() > 120
                        || !Double.isFinite(o.x())
                        || !Double.isFinite(o.y())
                        || o.x() < .1
                        || o.x() > .9
                        || o.y() < .1
                        || o.y() > .9))
      throw ApiException.invalid("Use até oito textos ou adesivos dentro do Story.");
    db.jdbc.update(
        "INSERT INTO social_post(id,author_id,kind) VALUES (?,?,?) ON CONFLICT DO NOTHING",
        input.id(),
        a.id(),
        input.kind());
    access.owner(a, input.id());
    var current = db.one("SELECT state,version FROM social_post WHERE id=?", input.id());
    if (!"DRAFT".equals(current.get("state")))
      throw ApiException.invalid("Esta publicação já foi finalizada.");
    int version = ((Number) current.get("version")).intValue();
    if (input.version() != version && !(input.version() == 0 && version == 1))
      throw new ApiException(
          409,
          "DRAFT_CONFLICT",
          "Este rascunho foi alterado em outra tela. Reabra-o antes de salvar.");
    db.jdbc.update(
        "UPDATE social_media SET post_id=NULL WHERE post_id=? AND owner_id=?", input.id(), a.id());
    for (int i = 0; i < input.mediaIds().size(); i++) {
      UUID media = input.mediaIds().get(i);
      db.one(
          "SELECT id FROM social_media WHERE id=? AND owner_id=? AND state<>'DELETING' AND (post_id"
              + " IS NULL OR post_id=?) FOR UPDATE",
          media,
          a.id(),
          input.id());
      db.jdbc.update(
          "UPDATE social_media SET post_id=?,ordinal=? WHERE id=?", input.id(), i, media);
    }
    db.jdbc.update(
        "UPDATE social_post SET"
            + " kind=?,body=?,visibility=?,tags=?::text[],project_url=?,version=version+1,updated_at=now()"
            + " WHERE id=?",
        input.kind(),
        input.body().strip(),
        input.visibility(),
        "{" + String.join(",", tags(input.body())) + "}",
        url,
        input.id());
    try {
      db.jdbc.update(
          "UPDATE social_post SET story_overlays=?::jsonb WHERE id=?",
          json.writeValueAsString(overlays),
          input.id());
    } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
      throw ApiException.invalid("Revise os elementos do Story.");
    }
    return ownDraft(a, input.id());
  }

  public Map<String, Object> ownDraft(Actor a, UUID id) {
    access.require();
    var row =
        db.one(
            "SELECT id,kind,body,visibility,project_url,version,updated_at,story_overlays FROM"
                + " social_post WHERE id=? AND author_id=? AND state='DRAFT'",
            id,
            a.id());
    row.put(
        "media",
        db.list(
            "SELECT id,kind,state,error,recipe,duration_ms,width,height,ordinal FROM social_media"
                + " WHERE post_id=? ORDER BY ordinal",
            id));
    return row;
  }

  public Object drafts(Actor a) {
    access.require();
    return db.list(
        "SELECT id,kind,body,version,updated_at FROM social_post WHERE author_id=? AND"
            + " state='DRAFT' ORDER BY updated_at DESC LIMIT 40",
        a.id());
  }

  @Transactional
  public Object publish(Actor a, UUID id, int version) {
    access.owner(a, id);
    var row = db.one("SELECT * FROM social_post WHERE id=?", id);
    if ("PUBLISHED".equals(row.get("state"))) return detail(a, id);
    if (((Number) row.get("version")).intValue() != version)
      throw new ApiException(
          409, "DRAFT_CONFLICT", "Revise o rascunho atualizado antes de publicar.");
    String kind = (String) row.get("kind");
    var media =
        db.list("SELECT * FROM social_media WHERE post_id=? ORDER BY ordinal FOR UPDATE", id);
    if (media.isEmpty() && row.get("body").toString().isBlank())
      throw ApiException.invalid("Adicione texto ou mídia antes de publicar.");
    if (media.stream().anyMatch(m -> !"READY".equals(m.get("state"))))
      throw ApiException.invalid("Aguarde o processamento das mídias.");
    if (kind.equals("CLIP") && (media.size() != 1 || !"VIDEO".equals(media.getFirst().get("kind"))))
      throw ApiException.invalid("Um Clip precisa de um vídeo processado.");
    if (kind.equals("STORY") && media.size() > 1)
      throw ApiException.invalid("Publique uma mídia por Story.");
    if (media.stream()
        .anyMatch(
            m ->
                "VIDEO".equals(m.get("kind"))
                    && (((Number) m.get("durationMs")).intValue() > 90000
                        || ((Number) m.get("durationMs")).intValue() <= 0)))
      throw ApiException.invalid("O vídeo final deve ter no máximo 90 segundos.");
    db.jdbc.update(
        "UPDATE social_post SET state='PUBLISHED',published_at=now(),expires_at=CASE WHEN"
            + " kind='STORY' THEN now()+interval '24 hours' ELSE NULL END,institution_id=(SELECT"
            + " institution_id FROM academic_identity WHERE user_id=? AND"
            + " status='STUDENT_VERIFIED'),updated_at=now() WHERE id=?",
        a.id(),
        id);
    for (UUID user : notices.mentions(row.get("body").toString()))
      if (!user.equals(a.id()) && access.mayView(new Actor(user, null, "USER"), id)) {
        db.jdbc.update(
            "INSERT INTO social_mention(post_id,user_id) VALUES (?,?) ON CONFLICT DO NOTHING",
            id,
            user);
        notices.send(
            a.id(),
            user,
            "SOCIAL_MENTION",
            "social:interaction",
            id,
            "/social?post=" + id,
            "Você foi mencionado em uma publicação.");
      }
    db.jdbc.update("INSERT INTO social_fanout(post_id) VALUES (?) ON CONFLICT DO NOTHING", id);
    events.publishEvent(new AppChanged("social_changed", Set.of()));
    return detail(a, id);
  }

  private String projection() {
    return "SELECT"
               + " p.id,p.author_id,p.kind,p.body,p.visibility,p.tags,p.project_url,p.story_overlays,p.version,p.pinned,p.published_at,p.expires_at,u.name,u.username,u.avatar_bytes"
               + " IS NOT NULL has_avatar,coalesce(sp.verified,false) verified,(SELECT count(*)"
               + " FROM social_reaction r WHERE r.post_id=p.id AND r.kind='LIKE') likes,(SELECT"
               + " count(*) FROM social_reaction r WHERE r.post_id=p.id AND r.kind='REPOST')"
               + " reposts,(SELECT count(*) FROM social_comment c WHERE c.post_id=p.id AND NOT"
               + " c.deleted) comments,coalesce((SELECT jsonb_agg(r.kind) FROM social_reaction r"
               + " WHERE r.post_id=p.id AND r.user_id=?),'[]'::jsonb) mine,(SELECT h.title FROM"
               + " social_highlight h WHERE h.post_id=p.id) highlight_title,EXISTS(SELECT 1 FROM"
               + " social_story_view sv WHERE sv.post_id=p.id AND sv.user_id=?)"
               + " seen,coalesce((SELECT"
               + " jsonb_agg(jsonb_build_object('id',m.id,'kind',m.kind,'durationMs',m.duration_ms,'width',m.width,'height',m.height)"
               + " ORDER BY m.ordinal) FROM social_media m WHERE m.post_id=p.id AND"
               + " m.state='READY'),'[]'::jsonb) media FROM social_post p JOIN app_user u ON"
               + " u.id=p.author_id LEFT JOIN social_profile sp ON sp.user_id=p.author_id ";
  }

  public Map<String, Object> detail(Actor a, UUID id) {
    access.require();
    return db.one(
        projection()
            + " WHERE p.id=? AND "
            + SocialAccess.published("p")
            + " AND "
            + SocialAccess.visible("p"),
        a.id(),
        a.id(),
        id,
        a.id(),
        a.id(),
        a.id(),
        a.id());
  }

  public Object feed(
      Actor a,
      String tab,
      String kind,
      String query,
      String cursor,
      UUID author,
      String collection) {
    access.profile(a.id());
    if (!Set.of("for-you", "following", "campus").contains(tab)
        || !Set.of("POST", "CLIP", "STORY", "ALL").contains(kind)
        || query.length() > 120
        || !Set.of("posts", "reposts", "tagged", "saved", "pinned").contains(collection))
      throw ApiException.invalid("Filtros inválidos.");
    if (collection.equals("saved") && (author == null || !author.equals(a.id())))
      throw ApiException.forbidden();
    String scope = tab + ":" + kind + ":" + query.hashCode() + ":" + author + ":" + collection;
    var boundary = SocialCursor.read(cursor, scope);
    var args = new ArrayList<Object>(List.of(a.id(), a.id(), a.id(), a.id(), a.id(), a.id()));
    String filters = " WHERE " + SocialAccess.published("p") + " AND " + SocialAccess.visible("p");
    if (kind.equals("ALL")) filters += " AND p.kind IN ('POST','CLIP')";
    else {
      filters += " AND p.kind=?";
      args.add(kind);
    }
    filters += " AND p.published_at<=? AND (p.published_at,p.id)<(?,?)";
    args.add(java.sql.Timestamp.from(boundary.snapshot()));
    args.add(java.sql.Timestamp.from(boundary.before()));
    args.add(boundary.id());
    if (kind.equals("STORY")) filters += " AND p.expires_at>now()";
    if (author != null) {
      if (collection.equals("posts") || collection.equals("pinned")) {
        filters += " AND p.author_id=?";
        args.add(author);
        if (collection.equals("pinned")) filters += " AND p.pinned";
      } else if (collection.equals("tagged")) {
        filters +=
            " AND EXISTS(SELECT 1 FROM social_mention sm WHERE sm.post_id=p.id AND sm.user_id=? AND"
                + " sm.approved)";
        args.add(author);
      } else {
        filters +=
            " AND EXISTS(SELECT 1 FROM social_reaction sr WHERE sr.post_id=p.id AND sr.user_id=?"
                + " AND sr.kind=?)";
        args.add(author);
        args.add(collection.equals("saved") ? "SAVE" : "REPOST");
      }
    }
    if (tab.equals("following")) {
      filters +=
          " AND EXISTS(SELECT 1 FROM social_follow f WHERE f.followed_id=p.author_id AND"
              + " f.follower_id=? AND f.status='ACCEPTED')";
      args.add(a.id());
    }
    if (tab.equals("campus")) {
      filters +=
          " AND p.institution_id=(SELECT institution_id FROM academic_identity WHERE user_id=? AND"
              + " status='STUDENT_VERIFIED')";
      args.add(a.id());
    }
    if (!query.isBlank()) {
      filters +=
          " AND (to_tsvector('portuguese',p.body) @@ websearch_to_tsquery('portuguese',?) OR"
              + " ?=ANY(p.tags))";
      args.add(query);
      args.add(query.replaceFirst("^#", "").toLowerCase(Locale.ROOT));
    }
    filters +=
        " AND NOT EXISTS(SELECT 1 FROM social_mute m WHERE m.user_id=? AND"
            + " m.creator_id=p.author_id) AND NOT EXISTS(SELECT 1 FROM social_reaction r WHERE"
            + " r.post_id=p.id AND r.user_id=? AND r.kind='HIDE')";
    args.add(a.id());
    args.add(a.id());
    var rows =
        db.list(
            projection() + filters + " ORDER BY p.published_at DESC,p.id DESC LIMIT 21",
            args.toArray());
    boolean more = rows.size() > 20;
    var page = new ArrayList<>(rows.subList(0, Math.min(20, rows.size())));
    String next = more ? boundary.next(scope, page.getLast()) : "";
    if (tab.equals("for-you") && author == null) rank(a, page);
    return Map.of("items", page, "nextCursor", next, "snapshot", boundary.snapshot().toString());
  }

  private void rank(Actor a, ArrayList<Map<String, Object>> page) {
    var preferences =
        db.one("SELECT recommendations,interests FROM social_profile WHERE user_id=?", a.id());
    var interests = new HashSet<String>(Arrays.asList((String[]) preferences.get("interests")));
    var following = new HashSet<UUID>();
    for (var r :
        db.list(
            "SELECT followed_id FROM social_follow WHERE follower_id=? AND status='ACCEPTED'",
            a.id())) following.add((UUID) r.get("followedId"));
    if (Boolean.TRUE.equals(preferences.get("recommendations"))) {
      // Only the student's authorized Social activity. Blocked/removed/private-inaccessible
      // posts cannot influence later recommendations, even if previously watched.
      for (var row :
          db.list(
              "SELECT DISTINCT unnest(p.tags) tag FROM social_post p WHERE "
                  + SocialAccess.published("p")
                  + " AND "
                  + SocialAccess.visible("p")
                  + " AND NOT EXISTS(SELECT 1 FROM social_reaction r WHERE r.user_id=? AND"
                  + " r.post_id=p.id AND r.kind='HIDE') AND (EXISTS(SELECT 1 FROM social_feedback f"
                  + " WHERE f.post_id=p.id AND f.user_id=? AND (f.watched_ms>5000 OR f.completed)"
                  + " AND f.updated_at>now()-interval '30 days') OR EXISTS(SELECT 1 FROM"
                  + " social_reaction r WHERE r.post_id=p.id AND r.user_id=? AND r.kind IN"
                  + " ('LIKE','SAVE','REPOST') AND r.created_at>now()-interval '30 days') OR"
                  + " EXISTS(SELECT 1 FROM social_comment c WHERE c.post_id=p.id AND c.author_id=?"
                  + " AND NOT c.deleted AND c.created_at>now()-interval '30 days')) LIMIT 50",
              a.id(),
              a.id(),
              a.id(),
              a.id(),
              a.id(),
              a.id(),
              a.id(),
              a.id())) interests.add(row.get("tag").toString());
    }
    page.sort(
        Comparator.<Map<String, Object>>comparingInt(
                p ->
                    SocialRanker.score(
                        following.contains(p.get("authorId")),
                        Arrays.asList((String[]) p.get("tags")),
                        interests))
            .reversed()
            .thenComparing(p -> p.get("publishedAt").toString(), Comparator.reverseOrder()));
    SocialRanker.diversify(page);
  }

  @Transactional
  public Object react(Actor a, UUID id, String kind, boolean active) {
    var p = access.post(a, id);
    if (!Set.of("LIKE", "SAVE", "REPOST", "HIDE").contains(kind))
      throw ApiException.invalid("Interação inválida.");
    int inserted = 0;
    if (active)
      inserted =
          db.jdbc.update(
              "INSERT INTO social_reaction(post_id,user_id,kind) VALUES (?,?,?) ON CONFLICT DO"
                  + " NOTHING",
              id,
              a.id(),
              kind);
    else
      db.jdbc.update(
          "DELETE FROM social_reaction WHERE post_id=? AND user_id=? AND kind=?", id, a.id(), kind);
    if (inserted > 0 && Set.of("LIKE", "REPOST").contains(kind))
      notices.send(
          a.id(),
          (UUID) p.get("authorId"),
          "SOCIAL_" + kind,
          "social:interaction",
          id,
          "/social?post=" + id,
          kind.equals("LIKE")
              ? "Sua publicação recebeu uma curtida."
              : "Um estudante republicou seu conteúdo.");
    return detail(a, id);
  }

  public Object comments(Actor a, UUID id, int page) {
    access.post(a, id);
    return db.list(
        "SELECT c.id,c.author_id,c.parent_id,c.body,c.created_at,u.name,u.username,u.avatar_bytes"
            + " IS NOT NULL has_avatar,coalesce(s.verified,false) verified FROM social_comment c"
            + " JOIN app_user u ON u.id=c.author_id LEFT JOIN social_profile s ON s.user_id=u.id"
            + " WHERE c.post_id=? AND NOT c.deleted AND u.status='ACTIVE' AND NOT EXISTS(SELECT 1"
            + " FROM user_block b WHERE (b.user_id=? AND b.blocked_id=c.author_id) OR"
            + " (b.blocked_id=? AND b.user_id=c.author_id)) ORDER BY c.created_at,c.id LIMIT 30"
            + " OFFSET ?",
        id,
        a.id(),
        a.id(),
        Db.offset(page));
  }

  @Transactional
  public Object comment(Actor a, UUID postId, UUID id, String text, UUID parent) {
    var p = access.post(a, postId);
    if (id == null || text == null || text.isBlank() || text.length() > 1500)
      throw ApiException.invalid("Escreva de 1 a 1500 caracteres.");
    UUID recipient = (UUID) p.get("authorId");
    if (parent != null) {
      var c =
          db.one(
              "SELECT author_id,parent_id FROM social_comment WHERE id=? AND post_id=? AND NOT"
                  + " deleted",
              parent,
              postId);
      if (c.get("parentId") != null)
        throw ApiException.invalid("Responda ao comentário principal.");
      recipient = (UUID) c.get("authorId");
      access.unblocked(a.id(), recipient);
    }
    int inserted =
        db.jdbc.update(
            "INSERT INTO social_comment(id,post_id,author_id,parent_id,body) VALUES (?,?,?,?,?) ON"
                + " CONFLICT(id) DO NOTHING",
            id,
            postId,
            a.id(),
            parent,
            text.strip());
    db.one(
        "SELECT id FROM social_comment WHERE id=? AND post_id=? AND author_id=?",
        id,
        postId,
        a.id());
    if (inserted > 0) {
      notices.send(
          a.id(),
          recipient,
          "SOCIAL_COMMENT",
          "social:interaction",
          id,
          "/social?post=" + postId,
          "Um estudante respondeu à sua publicação.");
      for (UUID mentioned : notices.mentions(text))
        if (!mentioned.equals(a.id())
            && access.mayView(new Actor(mentioned, null, "USER"), postId)) {
          notices.send(
              a.id(),
              mentioned,
              "SOCIAL_MENTION",
              "social:interaction",
              id,
              "/social?post=" + postId,
              "Você foi mencionado em um comentário.");
        }
    }
    return Map.of("id", id);
  }

  @Transactional
  public void deleteComment(Actor a, UUID post, UUID id) {
    var p = access.post(a, post);
    var c = db.one("SELECT author_id FROM social_comment WHERE id=? AND post_id=?", id, post);
    if (!a.admin() && !a.id().equals(c.get("authorId")) && !a.id().equals(p.get("authorId")))
      throw ApiException.forbidden();
    db.jdbc.update("UPDATE social_comment SET deleted=true,body='' WHERE id=?", id);
  }

  @Transactional
  public void remove(Actor a, UUID id) {
    access.owner(a, id);
    db.jdbc.update(
        "UPDATE social_post SET"
            + " state='REMOVED',pinned=false,body='',project_url=NULL,tags='{}',story_overlays='[]',updated_at=now()"
            + " WHERE id=?",
        id);
    db.jdbc.update("UPDATE social_media SET state='DELETING' WHERE post_id=?", id);
    db.jdbc.update("DELETE FROM social_highlight WHERE post_id=?", id);
  }

  @Transactional
  public void pin(Actor a, UUID id, boolean pinned) {
    access.profile(a.id());
    db.one("SELECT user_id FROM social_profile WHERE user_id=? FOR UPDATE", a.id());
    access.owner(a, id);
    var post = db.one("SELECT state FROM social_post WHERE id=?", id);
    if (!"PUBLISHED".equals(post.get("state")))
      throw ApiException.invalid("Publique o conteúdo antes de fixar.");
    if (pinned
        && db.jdbc.queryForObject(
                "SELECT count(*) FROM social_post WHERE author_id=? AND pinned AND"
                    + " state='PUBLISHED' AND id<>?",
                Long.class,
                a.id(),
                id)
            >= 3) throw ApiException.invalid("Você pode fixar até três publicações.");
    db.jdbc.update("UPDATE social_post SET pinned=? WHERE id=?", pinned, id);
  }

  public void mention(Actor a, UUID id, boolean approved) {
    access.post(a, id);
    if (approved)
      db.jdbc.update(
          "UPDATE social_mention SET approved=true WHERE post_id=? AND user_id=?", id, a.id());
    else db.jdbc.update("DELETE FROM social_mention WHERE post_id=? AND user_id=?", id, a.id());
  }

  public Object pendingMentions(Actor a) {
    access.require();
    return db.list(
        projection()
            + " JOIN social_mention sm ON sm.post_id=p.id WHERE sm.user_id=? AND NOT sm.approved"
            + " AND "
            + SocialAccess.published("p")
            + " AND "
            + SocialAccess.visible("p")
            + " ORDER BY p.published_at DESC LIMIT 30",
        a.id(),
        a.id(),
        a.id(),
        a.id(),
        a.id(),
        a.id(),
        a.id());
  }

  public void view(Actor a, UUID id, int watchedMs, boolean completed) {
    var p = access.post(a, id);
    if (watchedMs < 0 || watchedMs > 90000) throw ApiException.invalid("Tempo inválido.");
    if ("STORY".equals(p.get("kind")))
      db.jdbc.update(
          "INSERT INTO social_story_view(post_id,user_id) VALUES (?,?) ON CONFLICT DO NOTHING",
          id,
          a.id());
    if (db.exists(
        "SELECT EXISTS(SELECT 1 FROM social_profile WHERE user_id=? AND recommendations)", a.id()))
      db.jdbc.update(
          "INSERT INTO social_feedback(user_id,post_id,watched_ms,completed) VALUES (?,?,?,?) ON"
              + " CONFLICT(user_id,post_id) DO UPDATE SET"
              + " watched_ms=greatest(social_feedback.watched_ms,EXCLUDED.watched_ms),completed=social_feedback.completed"
              + " OR EXCLUDED.completed,updated_at=now()",
          a.id(),
          id,
          watchedMs,
          completed);
  }

  @Transactional
  public void highlight(Actor a, UUID id, String title) {
    access.owner(a, id);
    db.one("SELECT id FROM social_post WHERE id=? AND kind='STORY' AND state='PUBLISHED'", id);
    if (title == null) db.jdbc.update("DELETE FROM social_highlight WHERE post_id=?", id);
    else {
      if (title.isBlank() || title.length() > 60)
        throw ApiException.invalid("Dê um nome de até 60 caracteres ao destaque.");
      db.jdbc.update(
          "INSERT INTO social_highlight(post_id,title) VALUES (?,?) ON CONFLICT(post_id) DO UPDATE"
              + " SET title=EXCLUDED.title",
          id,
          title.strip());
    }
  }

  public Object viewers(Actor a, UUID id, int page) {
    access.require();
    db.one("SELECT id FROM social_post WHERE id=? AND author_id=? AND kind='STORY'", id, a.id());
    return db.list(
        "SELECT u.id,u.name,u.username,u.avatar_bytes IS NOT NULL has_avatar,v.created_at FROM"
            + " social_story_view v JOIN app_user u ON u.id=v.user_id WHERE v.post_id=? AND"
            + " u.status='ACTIVE' AND NOT EXISTS(SELECT 1 FROM user_block b WHERE (b.user_id=? AND"
            + " b.blocked_id=u.id) OR (b.blocked_id=? AND b.user_id=u.id)) ORDER BY v.created_at"
            + " DESC,u.id LIMIT 30 OFFSET ?",
        id,
        a.id(),
        a.id(),
        Db.offset(page));
  }

  public Object highlights(Actor a, UUID user) {
    access.unblocked(a.id(), user);
    return db.list(
        projection()
            + " JOIN social_highlight h ON h.post_id=p.id WHERE p.author_id=? AND "
            + SocialAccess.published("p")
            + " AND "
            + SocialAccess.visible("p")
            + " ORDER BY h.created_at DESC LIMIT 30",
        a.id(),
        a.id(),
        user,
        a.id(),
        a.id(),
        a.id(),
        a.id());
  }
}
