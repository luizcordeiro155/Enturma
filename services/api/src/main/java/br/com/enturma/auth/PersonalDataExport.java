package br.com.enturma.auth;

import br.com.enturma.common.*;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Explicit projections: never export session secrets, hashes or another student's data. */
@RestController
@RequestMapping("/api/v1/account/privacy/export")
public class PersonalDataExport {
  private final Db db;
  public PersonalDataExport(Db db) { this.db=db; }
  private static final Map<String,String> SECTIONS=new LinkedHashMap<>(Map.of(
    "account", "SELECT id,name,username,email,bio,profile_details,created_at FROM app_user WHERE id=? ORDER BY id",
    "portfolio", "SELECT headline,summary,goal,skills,projects,public,updated_at FROM portfolio_profile WHERE user_id=? ORDER BY user_id",
    "notebooks", "SELECT id,title,created_at,updated_at FROM study_notebook WHERE user_id=? ORDER BY created_at,id",
    "sources", "SELECT s.id,s.notebook_id,s.title,s.kind,s.url,s.content,s.created_at FROM notebook_source s JOIN study_notebook n ON n.id=s.notebook_id WHERE n.user_id=? ORDER BY s.created_at,s.id",
    "conversations", "SELECT g.id,g.notebook_id,g.question,g.answer,g.citations,g.external_sources,g.created_at FROM notebook_generation g JOIN study_notebook n ON n.id=g.notebook_id WHERE n.user_id=? ORDER BY g.created_at,g.id",
    "media", "SELECT id,name,kind,favorite,created_at FROM chat_media WHERE user_id=? ORDER BY created_at,id",
    "attachments", "SELECT id,name,mime,created_at FROM portfolio_attachment WHERE user_id=? ORDER BY created_at,id",
    "social-posts", "SELECT id,kind,body,visibility,state,tags,project_url,story_overlays,published_at,created_at FROM social_post WHERE author_id=? ORDER BY created_at,id",
    "social-interactions", "SELECT post_id,kind,created_at FROM social_reaction WHERE user_id=? ORDER BY created_at,post_id,kind",
    "social-preferences", "SELECT private_account,recommendations,autoplay,interests,navigation FROM social_profile WHERE user_id=? ORDER BY user_id"
  ));
  static {
    SECTIONS.put("social-collections", "SELECT id,name,created_at FROM social_collection WHERE owner_id=? ORDER BY created_at,id");
    SECTIONS.put("social-collection-items", "SELECT i.collection_id,i.post_id,i.created_at FROM social_collection_item i JOIN social_collection c ON c.id=i.collection_id WHERE c.owner_id=? ORDER BY i.created_at,i.collection_id,i.post_id");
    SECTIONS.put("social-lives", "SELECT id,title,visibility,state,started_at,ended_at,peak_viewers FROM social_live WHERE author_id=? ORDER BY started_at,id");
    SECTIONS.put("social-comment-likes", "SELECT comment_id,created_at FROM social_comment_like WHERE user_id=? ORDER BY created_at,comment_id");
    SECTIONS.put("social-comment-media", "SELECT id,post_id,mime,octet_length(data) size,created_at FROM social_comment_media WHERE owner_id=? ORDER BY created_at,id");
    SECTIONS.put("social-comments", "SELECT id,post_id,parent_id,body,deleted,created_at FROM social_comment WHERE author_id=? ORDER BY created_at,id");
    SECTIONS.put("social-following", "SELECT followed_id,status,notify,created_at FROM social_follow WHERE follower_id=? ORDER BY created_at,followed_id");
    SECTIONS.put("social-followers", "SELECT follower_id,status,created_at FROM social_follow WHERE followed_id=? ORDER BY created_at,follower_id");
    SECTIONS.put("social-feedback", "SELECT post_id,watched_ms,completed,updated_at FROM social_feedback WHERE user_id=? ORDER BY updated_at,post_id");
    SECTIONS.put("social-video-views", "SELECT post_id,created_at FROM social_video_view WHERE user_id=? ORDER BY created_at,post_id");
    SECTIONS.put("social-mutes", "SELECT creator_id FROM social_mute WHERE user_id=? ORDER BY creator_id");
    SECTIONS.put("social-verification", "SELECT id,reason,status,decision,created_at,reviewed_at FROM social_verification WHERE user_id=? ORDER BY created_at,id");
    SECTIONS.put("study-routine", "SELECT timezone,default_start,default_end,weekdays,semester_start,semester_end,class_reminder_minutes,quiet_start,quiet_end,tutor_personality,state,city,updated_at FROM academic_routine WHERE user_id=? ORDER BY user_id");
    SECTIONS.put("study-classes", "SELECT id,subject_id,weekday,starts_at,ends_at,valid_from,valid_until,room,created_at FROM academic_class_schedule WHERE user_id=? ORDER BY created_at,id");
    SECTIONS.put("study-class-exceptions", "SELECT id,schedule_id,occurs_on,kind,moved_to,minutes,note,created_at FROM academic_class_exception WHERE user_id=? ORDER BY occurs_on,id");
    SECTIONS.put("study-holidays", "SELECT id,date,name,scope,created_at FROM calendar_holiday WHERE user_id=? ORDER BY date,id");
    SECTIONS.put("study-vacations", "SELECT id,starts_on,ends_on,name,created_at FROM calendar_vacation WHERE user_id=? ORDER BY starts_on,id");
    SECTIONS.put("study-attendance", "SELECT occurrence_key,schedule_id,occurs_on,status,answered_at FROM class_attendance WHERE user_id=? ORDER BY occurs_on,occurrence_key");
    SECTIONS.put("study-terms", "SELECT id,name,starts_on,ends_on,period_id,subjects,subjects_confirmed,created_at FROM academic_term WHERE user_id=? ORDER BY starts_on,id");
    SECTIONS.put("study-reminders", "SELECT id,kind,source_id,occurrence_at,fire_at,status,sent_at FROM academic_reminder_job WHERE user_id=? ORDER BY fire_at,id");
    SECTIONS.put("study-tasks", "SELECT id,subject_id,kind,title,notes,due_at,estimated_minutes,priority,completed_at,created_at FROM campus_task WHERE user_id=? ORDER BY due_at,id");
    SECTIONS.put("study-focus", "SELECT id,subject_id,label,planned_minutes,started_at,finished_at,actual_seconds FROM focus_session WHERE user_id=? ORDER BY started_at,id");
    SECTIONS.put("study-sessions", "SELECT id,subject_id,notebook_id,starts_at,minutes,goal,status,personality,difficulty,started_at,finished_at,created_at FROM study_session WHERE user_id=? ORDER BY starts_at,id");
    SECTIONS.put("study-quiz-attempts", "SELECT id,session_id,generation_id,answers,score,total,wrong_topics,created_at FROM study_quiz_attempt WHERE user_id=? ORDER BY created_at,id");
    SECTIONS.put("study-mastery", "SELECT subject_id,level,evidence,updated_at FROM subject_mastery WHERE user_id=? ORDER BY subject_id");
    SECTIONS.put("social-reports", "SELECT id,post_id,reason,status,created_at FROM social_report WHERE reporter_id=? ORDER BY created_at,id");
  }

  /**
   * The rest of what a person did on Enturma (LGPD art. 18, access and portability): section, table and
   * the columns that point at the person. Columns are read from the schema, minus secrets.
   */
  private static final String[][] TABLES = {
    {"privacy-consents", "consent_record", "user_id"},
    {"academic-enrollment", "academic_enrollment", "user_id"},
    {"academic-enrollment-history", "academic_enrollment_history", "user_id"},
    {"academic-subjects", "user_subject", "user_id"},
    {"academic-identity", "academic_identity", "user_id"},
    {"academic-verification-documents", "academic_verification_document", "user_id"},
    {"academic-verification-support", "academic_verification_support", "user_id"},
    {"academic-verification-history", "academic_verification_audit", "user_id"},
    {"academic-catalog-requests", "academic_catalog_request", "user_id"},
    {"account-deletion-requests", "account_deletion_request", "user_id"},
    {"sessions", "user_session", "user_id"},
    {"achievements", "user_achievement", "user_id"},
    {"achievement-progress", "achievement_progress", "user_id"},
    {"ai-messages", "ai_message", "user_id"},
    {"games-algorithm", "algorithm_game_result", "user_id"},
    {"games-academic", "academic_game_progress", "user_id"},
    {"games-words", "word_game_result", "user_id"},
    {"games-word-sessions", "word_game_session", "user_id"},
    {"learning-profile", "campus_learning_profile", "user_id"},
    {"learning-tutor", "campus_tutor_interaction", "user_id"},
    {"learning-daily", "daily_learning_progress", "user_id"},
    {"learning-daily-words", "daily_word_progress", "user_id"},
    {"learning-missions", "learning_mission", "user_id"},
    {"learning-mission-starts", "learning_mission_start", "user_id"},
    {"learning-progress", "learning_progress", "user_id"},
    {"learning-stats", "learning_stats", "user_id"},
    {"learning-xp", "learning_xp_event", "user_id"},
    {"practice-sessions", "practice_session", "user_id"},
    {"practice-attempts", "practice_attempt", "user_id"},
    {"forum-entries", "forum_entry", "author_id"},
    {"forum-reactions", "forum_reaction", "user_id"},
    {"forum-votes", "forum_vote", "user_id"},
    {"friends", "friendship", "requester", "recipient"},
    {"blocks", "user_block", "user_id"},
    {"notifications", "notification", "user_id"},
    {"notification-preferences", "notification_preference", "user_id"},
    {"notification-devices", "notification_push_device", "user_id"},
    {"experience-preferences", "user_experience_preference", "user_id"},
    {"profile-privacy", "profile_privacy_setting", "user_id"},
    {"profile-showcase", "profile_showcase", "user_id"},
    {"profile-widgets", "profile_widget", "user_id"},
    {"private-messages", "private_message", "sender_id"},
    {"private-message-reactions", "private_message_reaction", "user_id"},
    {"private-messages-hidden", "private_message_hidden", "user_id"},
    {"private-message-receipts", "private_message_receipt", "user_id"},
    {"private-calls", "private_call", "caller_id", "callee_id"},
    {"reports", "report", "reporter_id"},
    {"rides", "ride", "owner_id"},
    {"ride-recurrences", "ride_recurrence", "owner_id"},
    {"ride-matches", "ride_match", "user_id", "passenger_id", "driver_id"},
    {"ride-messages", "ride_message", "sender_id"},
    {"ride-reviews", "ride_review", "reviewer_id"},
    {"ride-cancellations", "ride_cancellation", "actor_id"},
    {"ride-safety-events", "ride_safety_event", "actor_id"},
    {"ride-safety-shares", "ride_safety_share", "shared_by"},
    {"ride-availability", "ride_driver_availability", "user_id"},
    {"ride-preferences", "ride_user_mobility_pref", "user_id"},
    {"ride-vehicles", "ride_vehicle_profile", "user_id"},
    {"rooms-hosted", "study_room", "host_id"},
    {"rooms-joined", "room_participant", "user_id"},
    {"room-messages", "room_message", "user_id"},
    {"room-messages-hidden", "room_message_hidden", "user_id"},
    {"room-message-receipts", "room_message_receipt", "user_id"},
    {"room-reactions", "room_reaction", "user_id"},
    {"room-attachments", "room_attachment", "uploaded_by"},
    {"room-notebook-shares", "room_notebook_share", "shared_by"},
    {"room-artifacts", "room_session_artifact", "user_id"},
    {"room-events", "room_system_event", "user_id"},
    {"social-media", "social_media", "owner_id"},
    {"social-mentions", "social_mention", "user_id"},
    {"social-story-views", "social_story_view", "user_id"},
    {"study-flashcards", "study_flashcard", "user_id"},
    {"study-groups", "study_group", "owner_id"},
    {"study-group-memberships", "study_group_member", "user_id"},
    {"study-group-tasks", "study_group_task", "created_by", "assigned_to"},
    {"study-journey", "study_journey", "user_id"},
    {"study-match-profile", "study_match_profile", "user_id"},
    {"study-materials", "study_material", "uploaded_by"},
    {"teacher-profile", "teacher_profile", "user_id"},
    {"teacher-classes", "teacher_class", "owner_id"},
    {"teacher-class-memberships", "teacher_class_member", "user_id"},
    {"teacher-submissions", "teacher_submission", "user_id"},
  };

  /**
   * Tables that point at a person but are not exported, and why. Secrets protect the account; working
   * queues and second-long presence are not information about the person.
   */
  public static final Map<String, String> EXEMPT =
      Map.ofEntries(
          Map.entry("academic_catalog_audit", "registro de ações de administradores no catálogo"),
          Map.entry("academic_import_job", "importações feitas por administradores"),
          Map.entry("academic_legacy_snapshot", "cópia técnica de migração do perfil antigo"),
          Map.entry("academic_verification_token", "segredo de uso único"),
          Map.entry("account_token", "segredo de uso único"),
          Map.entry("password_reset_flow", "segredo de recuperação de senha"),
          Map.entry("private_account_session_key", "chave criptográfica da conta"),
          Map.entry("private_identity", "chave criptográfica da conta"),
          Map.entry("achievement_sync_queue", "fila interna de processamento"),
          Map.entry("audit_log", "trilha de segurança das ações administrativas"),
          Map.entry("calendar_vacation_year", "controle interno de férias padrão"),
          Map.entry("campus_pickup_zone", "pontos de encontro cadastrados por administradores"),
          Map.entry("email_outbox", "fila de envio com links de uso único; apagada em 30 dias"),
          Map.entry("moderation_action", "registro interno de moderação"),
          Map.entry("moderation_blocked_host", "lista interna de domínios bloqueados"),
          Map.entry("moderation_case", "registro interno de moderação"),
          Map.entry("notification_desktop_push_event", "fila técnica de entrega"),
          Map.entry("notification_push_delivery", "fila técnica de entrega"),
          Map.entry("notification_web_push_subscription", "endereço técnico de push com chaves"),
          Map.entry("private_typing_presence", "presença de segundos, apagada ao expirar"),
          Map.entry("realtime_presence", "presença de segundos, apagada ao expirar"),
          Map.entry("profile_activity", "presença recente, apagada em 7 dias"),
          Map.entry("room_voice_presence", "presença em chamada, apagada ao sair"),
          Map.entry("ride_dispatch_attempt", "tentativa técnica de despacho de carona"),
          Map.entry("ride_live_location", "posição ao vivo, apagada em 15 minutos"),
          Map.entry("rate_limit", "contador antiabuso, apagado em 1 dia"));

  private static final Set<String> SECRET_PARTS =
      Set.of(
          "hash", "secret", "password", "token", "key", "keys", "cipher", "ciphertext", "nonce",
          "salt", "iv", "wrapped", "signature", "endpoint", "auth", "p256dh", "encrypted", "vault");

  private volatile Map<String, String> generated;

  /** Builds the generated sections from the live schema the first time they are needed. */
  private Map<String, String> generated() {
    var current = generated;
    if (current != null) return current;
    var built = new LinkedHashMap<String, String>();
    for (String[] t : TABLES) {
      var columns =
          db.jdbc.queryForList(
              "SELECT column_name FROM information_schema.columns WHERE"
                  + " table_schema=current_schema() AND table_name=? AND data_type<>'bytea' ORDER BY"
                  + " ordinal_position",
              String.class,
              t[1]);
      var safe =
          columns.stream()
              .filter(c -> Collections.disjoint(Arrays.asList(c.split("_")), SECRET_PARTS))
              .toList();
      if (safe.isEmpty()) continue;
      var where = new StringJoiner(" OR ");
      for (int i = 2; i < t.length; i++) where.add(t[i] + "=?");
      built.put(
          t[0],
          "SELECT " + String.join(",", safe) + " FROM " + t[1] + " WHERE " + where + " ORDER BY 1");
    }
    generated = built;
    return built;
  }

  /** Tables whose rows reach the person through some export section. */
  public Set<String> exportedTables() {
    var tables = new TreeSet<String>();
    for (String[] t : TABLES) tables.add(t[1]);
    for (String q : SECTIONS.values()) {
      var m = java.util.regex.Pattern.compile("(?i)\\b(?:FROM|JOIN)\\s+([a-z_]+)").matcher(q);
      while (m.find()) tables.add(m.group(1));
    }
    return tables;
  }

  private String query(String section) {
    return SECTIONS.containsKey(section) ? SECTIONS.get(section) : generated().get(section);
  }

  @GetMapping("/sections")
  public Set<String> sections() {
    var all = new LinkedHashSet<String>(SECTIONS.keySet());
    all.addAll(generated().keySet());
    return Collections.unmodifiableSet(all);
  }

  @GetMapping
  public ResponseEntity<?> export(@AuthenticationPrincipal Actor actor,
      @RequestParam(defaultValue="account") String section,@RequestParam(defaultValue="0") int offset) {
    String query=query(section);
    if(query==null || offset<0 || offset>100000) throw ApiException.invalid("Página de exportação inválida.");
    int people=(int)query.chars().filter(c->c=='?').count();
    var args=new ArrayList<Object>(Collections.nCopies(people,actor.id()));
    args.add(offset);
    var rows=db.list(query+" LIMIT 101 OFFSET ?",args.toArray());
    return ResponseEntity.ok().header("Cache-Control","private,no-store")
      .body(Map.of("section",section,"items",rows.subList(0,Math.min(100,rows.size())),"nextOffset",rows.size()>100?offset+100:-1));
  }
}
