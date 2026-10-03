package br.com.enturma.auth;

import br.com.enturma.common.Db;
import java.time.Instant;
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
    db.jdbc.update("DELETE FROM push_device WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM web_push_subscription WHERE user_id=?",userId);
    db.jdbc.update("UPDATE user_session SET revoked_at=coalesce(revoked_at,now()) WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM study_flashcard WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM focus_session WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM campus_task WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM study_match_profile WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM notification_preference WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM profile_privacy_setting WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM profile_widget WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM profile_featured_badge WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM profile_showcase WHERE user_id=?",userId);
    db.jdbc.update("DELETE FROM study_notebook WHERE user_id=?",userId);

    String suffix=userId.toString().replace("-","");
    db.jdbc.update(
        "UPDATE app_user SET name='Conta excluída',username=?,email=?,password_hash=?,status='DELETED',email_verified=false WHERE id=?",
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
