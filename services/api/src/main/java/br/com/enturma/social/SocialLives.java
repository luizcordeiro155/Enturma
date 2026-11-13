package br.com.enturma.social;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import br.com.enturma.notifications.AppChanged;
import br.com.enturma.voice.VoiceProvider;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.bind.annotation.*;

/** LiveKit credentials are issued only after the same privacy checks as social posts. */
@RestController
@RequestMapping("/api/v1/social/live")
public class SocialLives {
  private final Db db;private final SocialAccess access;private final VoiceProvider provider;
  private final boolean liveEnabled;private final TransactionTemplate tx;private final ApplicationEventPublisher events;
  public SocialLives(Db db,SocialAccess access,VoiceProvider provider,PlatformTransactionManager manager,
      ApplicationEventPublisher events,@Value("${SOCIAL_LIVE_ENABLED:false}") boolean enabled){
    this.db=db;this.access=access;this.provider=provider;this.tx=new TransactionTemplate(manager);this.events=events;this.liveEnabled=enabled;
  }
  public boolean enabled(){return access.enabled()&&liveEnabled&&provider.enabled();}
  private void ready(){access.require();if(!enabled())throw new ApiException(503,"SOCIAL_LIVE_UNAVAILABLE","As lives ainda n\u00e3o est\u00e3o dispon\u00edveis.");}
  public String room(UUID id){return "enturma-social-live-"+id;}
  private String projection(){return "SELECT l.id,l.author_id,l.title,l.visibility,l.state,l.started_at,l.viewers,l.peak_viewers,u.name,u.username,u.avatar_bytes IS NOT NULL has_avatar,coalesce(s.verified,false) verified FROM social_live l JOIN app_user u ON u.id=l.author_id LEFT JOIN social_profile s ON s.user_id=u.id";}
  private Map<String,Object> visible(Actor actor,UUID id){
    access.profile(actor.id());
    return db.one(projection()+" WHERE l.id=? AND "+SocialAccess.visible("l"),id,actor.id(),actor.id(),actor.id(),actor.id());
  }
  @GetMapping public List<Map<String,Object>> list(@AuthenticationPrincipal Actor actor){
    ready();access.profile(actor.id());
    return db.list(projection()+" WHERE (l.state='LIVE' OR (l.author_id=? AND l.state='STARTING')) AND "+SocialAccess.visible("l")+" ORDER BY l.started_at DESC,l.id LIMIT 60",actor.id(),actor.id(),actor.id(),actor.id(),actor.id());
  }
  @GetMapping("/{id}") public Map<String,Object> detail(@AuthenticationPrincipal Actor actor,@PathVariable UUID id){ready();return visible(actor,id);}
  public record Start(@NotNull UUID id,@NotBlank @Size(max=120) String title,@NotNull @Pattern(regexp="PUBLIC|FOLLOWERS") String visibility){}
  @PostMapping public Map<String,Object> start(@AuthenticationPrincipal Actor actor,@Valid @RequestBody Start body){
    ready();if(body.id()==null||body.title()==null||body.title().isBlank()||body.title().length()>120||!Set.of("PUBLIC","FOLLOWERS").contains(body.visibility()))throw ApiException.invalid("Informe um t\u00edtulo e a visibilidade da live.");
    return tx.execute(status->{
      access.profile(actor.id());db.one("SELECT user_id FROM social_profile WHERE user_id=? FOR UPDATE",actor.id());
      var existing=db.list("SELECT id FROM social_live WHERE author_id=? AND state IN ('STARTING','LIVE')",actor.id());
      if(!existing.isEmpty()){
        if(body.id().equals(existing.getFirst().get("id")))return visible(actor,body.id());
        throw new ApiException(409,"LIVE_ALREADY_ACTIVE","Voc\u00ea j\u00e1 tem uma live aberta. Encerre-a antes de iniciar outra.");
      }
      if(db.exists("SELECT EXISTS(SELECT 1 FROM social_live WHERE id=?)",body.id()))throw ApiException.invalid("Esta live j\u00e1 foi encerrada. Inicie uma nova.");
      db.jdbc.update("INSERT INTO social_live(id,author_id,title,visibility) VALUES (?,?,?,?)",body.id(),actor.id(),body.title().strip(),body.visibility());
      return visible(actor,body.id());
    });
  }
  @PostMapping("/{id}/token") public Map<String,Object> join(@AuthenticationPrincipal Actor actor,@PathVariable UUID id){
    ready();var live=visible(actor,id);boolean host=actor.id().equals(live.get("authorId"));
    if("ENDED".equals(live.get("state")))throw new ApiException(410,"LIVE_ENDED","Esta live terminou.");
    if(!host&&!"LIVE".equals(live.get("state")))throw new ApiException(409,"LIVE_STARTING","O anfitri\u00e3o est\u00e1 preparando a transmiss\u00e3o.");
    String name=db.one("SELECT name FROM app_user WHERE id=? AND status='ACTIVE'",actor.id()).get("name").toString();
    return Map.of("id",id,"url",provider.url(),"token",provider.liveToken(actor.id().toString(),name,room(id),Instant.now().plusSeconds(120).getEpochSecond(),host),"host",host);
  }
  @PostMapping("/{id}/heartbeat") public Map<String,Object> heartbeat(@AuthenticationPrincipal Actor actor,@PathVariable UUID id){
    ready();var live=visible(actor,id);if(!actor.id().equals(live.get("authorId")))throw ApiException.forbidden();
    if(!"ENDED".equals(live.get("state")))synchronize(id);
    return visible(actor,id);
  }
  @PostMapping("/{id}/end") public void end(@AuthenticationPrincipal Actor actor,@PathVariable UUID id){
    access.require();var live=db.one("SELECT author_id FROM social_live WHERE id=?",id);
    if(!actor.id().equals(live.get("authorId"))&&!actor.admin())throw ApiException.forbidden();
    finish(id);
  }
  private void finish(UUID id){
    tx.executeWithoutResult(status->{
      int changed=db.jdbc.update("UPDATE social_live SET state='ENDED',ended_at=coalesce(ended_at,now()),viewers=0,cleanup_pending=true WHERE id=? AND state<>'ENDED'",id);
      if(changed>0)events.publishEvent(new AppChanged("social_changed",Set.of()));
    });
    try {provider.deleteRoom(room(id));db.jdbc.update("UPDATE social_live SET cleanup_pending=false WHERE id=?",id);}
    catch(RuntimeException ignored){/* Retry in reconcile. Ending never advertises an active room. */}
  }
  private void synchronize(UUID id){
    var live=db.one("SELECT author_id,state,last_host_seen,started_at FROM social_live WHERE id=?",id);
    if("ENDED".equals(live.get("state")))return;
    UUID author=(UUID)live.get("authorId");
    if(!db.exists("SELECT EXISTS(SELECT 1 FROM app_user WHERE id=? AND status='ACTIVE')",author)){finish(id);return;}
    List<String> participants=provider.participants(room(id));
    if(participants.contains(author.toString())){
      int viewers=0;
      for(String identity:participants){
        if(identity.equals(author.toString()))continue;
        boolean allowed=false;
        try {UUID user=UUID.fromString(identity);visible(new Actor(user,null,"USER"),id);allowed=true;}catch(IllegalArgumentException|ApiException ignored){}
        if(allowed)viewers++;else provider.remove(room(id),identity);
      }
      int changed=db.jdbc.update("UPDATE social_live SET state='LIVE',last_host_seen=now(),viewers=?,peak_viewers=greatest(peak_viewers,?) WHERE id=? AND state IN ('STARTING','LIVE')",viewers,viewers,id);
      if(changed>0&&"STARTING".equals(live.get("state")))events.publishEvent(new AppChanged("social_changed",Set.of()));
    }else if(Instant.parse(live.get("lastHostSeen").toString()).isBefore(Instant.now().minusSeconds(60)))finish(id);
  }
  @Scheduled(fixedDelay=15000) public void reconcile(){
    if(!provider.enabled())return;
    for(var live:db.list("SELECT id,state,cleanup_pending FROM social_live WHERE state IN ('STARTING','LIVE') OR cleanup_pending ORDER BY started_at LIMIT 100")){
      UUID id=(UUID)live.get("id");
      try{if(!enabled()||"ENDED".equals(live.get("state")))finish(id);else synchronize(id);}
      catch(RuntimeException ignored){/* An unavailable media server is not proof that a host disconnected. */}
    }
  }
}
