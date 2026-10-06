package br.com.enturma.auth;

import br.com.enturma.common.Db;
import java.time.Instant;
import java.time.Duration;
import java.util.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/account/privacy")
public class AccountPrivacyController {
  private final Db db;

  public AccountPrivacyController(Db db){ this.db=db; }

  @GetMapping("/deletion")
  public Object status(@AuthenticationPrincipal Actor a){
    var rows=db.list("SELECT requested_at,execute_at,mode,cancelled_at,executed_at FROM account_deletion_request WHERE user_id=?",a.id());
    return rows.isEmpty()?Map.of("status","NONE"):rows.getFirst();
  }

  @PostMapping("/deletion/schedule")
  @Transactional
  public Object schedule(@AuthenticationPrincipal Actor a){
    Instant executeAt=Instant.now().plus(Duration.ofDays(5));
    db.jdbc.update(
        "INSERT INTO account_deletion_request(user_id,execute_at,mode,cancelled_at,executed_at)"
        + " VALUES (?,?, 'DELAYED',NULL,NULL) ON CONFLICT(user_id) DO UPDATE SET requested_at=now(),execute_at=EXCLUDED.execute_at,"
        + " mode='DELAYED',cancelled_at=NULL,executed_at=NULL",a.id(),executeAt);
    return Map.of("executeAt",executeAt.toString(),"cancelable",true);
  }

  @PostMapping("/deletion/cancel")
  public void cancel(@AuthenticationPrincipal Actor a){
    db.jdbc.update(
        "UPDATE account_deletion_request SET cancelled_at=now() WHERE user_id=? AND executed_at IS NULL AND cancelled_at IS NULL AND execute_at>now()",
        a.id());
  }

  @DeleteMapping("/deletion/now")
  @Transactional
  public Object now(@AuthenticationPrincipal Actor a){
    purge(a.id(),"IMMEDIATE");
    return Map.of("deleted",true);
  }

  @Scheduled(fixedDelayString="PT1H")
  @Transactional
  public void processScheduled(){
    for(var row:db.list(
        "SELECT user_id FROM account_deletion_request WHERE mode='DELAYED' AND cancelled_at IS NULL AND executed_at IS NULL AND execute_at<=now() LIMIT 100")){
      purge((UUID)row.get("userId"),"DELAYED");
    }
  }

  private void purge(UUID userId,String mode){
    // Remove segredos, dispositivos, conteúdo privado e dados de personalização antes de anonimizar.
    db.jdbc.update("DELETE FROM account_token WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM password_reset_flow WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM notification_push_device WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM notification_web_push_subscription WHERE user_id=?",userId);
    db.jdbc.update("UPDATE user_session SET revoked_at=coalesce(revoked_at,now()) WHERE user_id=?",userId);
    // A conta é anonimizada, não apagada fisicamente. Portanto, dados que dependem
    // somente de ON DELETE CASCADE precisam ser removidos explicitamente aqui.
    db.jdbc.update("DELETE FROM ai_message WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM campus_tutor_interaction WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM campus_learning_profile WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM study_flashcard WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM portfolio_profile WHERE user_id=?",userId);

    db.jdbc.update("DELETE FROM teacher_submission WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM teacher_class_member WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM teacher_class WHERE owner_id=?",userId);
    db.jdbc.update("DELETE FROM teacher_profile WHERE user_id=?",userId);

    db.jdbc.update("DELETE FROM practice_attempt WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM practice_session WHERE user_id=?",userId);

    db.jdbc.update("UPDATE study_group_task SET assigned_to=NULL WHERE assigned_to=?",userId);
    db.jdbc.update("DELETE FROM study_group_task WHERE created_by=?",userId);
    db.jdbc.update("DELETE FROM study_group_member WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM study_group WHERE owner_id=?",userId);
    db.jdbc.update("DELETE FROM notification_desktop_push_event WHERE user_id=? OR actor_id=?",userId,userId);
    db.jdbc.update("DELETE FROM room_reaction WHERE user_id=?",userId);
    db.jdbc.update("UPDATE room_session_artifact SET user_id=NULL WHERE user_id=?",userId);
    db.jdbc.update("UPDATE room_system_event SET user_id=NULL WHERE user_id=?",userId);

    db.jdbc.update("DELETE FROM academic_game_progress WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM learning_mission WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM learning_mission_start WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM word_game_session WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM word_game_result WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM daily_word_progress WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM algorithm_game_result WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM daily_learning_progress WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM learning_xp_event WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM learning_progress WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM learning_stats WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM study_journey WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM user_experience_preference WHERE user_id=?",userId);

    db.jdbc.update("DELETE FROM profile_featured_badge WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM user_achievement WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM achievement_progress WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM achievement_sync_queue WHERE user_id=?",userId);

    String rideMatches =
        "SELECT m.id FROM ride_match m JOIN ride r ON r.id=m.ride_id WHERE"
            + " m.driver_id=? OR m.passenger_id=? OR r.owner_id=?";
    db.jdbc.update(
        "DELETE FROM ride_dispatch_attempt WHERE driver_id=? OR request_ride_id IN"
            + " (SELECT id FROM ride WHERE owner_id=?)",
        userId,
        userId);
    db.jdbc.update(
        "DELETE FROM ride_cancellation WHERE actor_id=? OR ride_id IN"
            + " (SELECT id FROM ride WHERE owner_id=?) OR match_id IN (" + rideMatches + ")",
        userId,
        userId,
        userId,
        userId,
        userId);
    db.jdbc.update("DELETE FROM ride_driver_availability WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM ride_user_mobility_pref WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM ride_live_location WHERE match_id IN (" + rideMatches + ")",userId,userId,userId);
    db.jdbc.update("DELETE FROM ride_safety_share WHERE match_id IN (" + rideMatches + ") OR shared_by=?",userId,userId,userId,userId);
    db.jdbc.update("DELETE FROM ride_safety_event WHERE match_id IN (" + rideMatches + ") OR actor_id=?",userId,userId,userId,userId);
    db.jdbc.update("DELETE FROM ride_voice WHERE match_id IN (" + rideMatches + ")",userId,userId,userId);
    db.jdbc.update("DELETE FROM ride_review WHERE match_id IN (" + rideMatches + ") OR reviewer_id=?",userId,userId,userId,userId);
    db.jdbc.update("DELETE FROM ride_message WHERE match_id IN (" + rideMatches + ")",userId,userId,userId);
    db.jdbc.update("DELETE FROM ride_match WHERE driver_id=? OR passenger_id=? OR ride_id IN (SELECT id FROM ride WHERE owner_id=?)",userId,userId,userId);
    db.jdbc.update("DELETE FROM ride_recurrence WHERE owner_id=?",userId);
    db.jdbc.update("DELETE FROM ride_vehicle_profile WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM ride WHERE owner_id=?",userId);
    db.jdbc.update("DELETE FROM focus_session WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM campus_task WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM study_match_profile WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM notification_preference WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM profile_privacy_setting WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM profile_widget WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM profile_featured_badge WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM profile_showcase WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM study_notebook WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM notification_push_delivery WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM notification WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM study_match_profile WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM friendship WHERE requester=? OR recipient=?",userId,userId);
    db.jdbc.update("DELETE FROM user_block WHERE user_id=? OR blocked_id=?",userId,userId);
    db.jdbc.update("DELETE FROM private_identity WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM academic_catalog_request WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM academic_enrollment_history WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM user_subject WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM academic_enrollment WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM email_outbox WHERE user_id=? OR recipient=(SELECT email FROM app_user WHERE id=?)",userId,userId);

    String suffix=userId.toString().replace("-","");
    db.jdbc.update(
        "UPDATE app_user SET name='Conta excluída',username=?,email=?,password_hash=?,status='DELETED',email_verified=false,"
        + " bio=NULL,avatar_mime=NULL,avatar_bytes=NULL,banner_mime=NULL,banner_bytes=NULL,profile_details='{}'::jsonb WHERE id=?",
        "deleted_"+suffix.substring(0,20),
        "deleted+"+suffix+"@invalid.enturma",
        "ACCOUNT_DELETED_"+suffix,
        userId);
    db.jdbc.update(
        "INSERT INTO account_deletion_request(user_id,execute_at,mode,executed_at) VALUES (?,now(),?,now())"
        + " ON CONFLICT(user_id) DO UPDATE SET mode=EXCLUDED.mode,executed_at=now(),cancelled_at=NULL",
        userId,mode);
  }
}
