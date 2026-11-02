package br.com.enturma.chat;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.Db;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Discovery only. A client must fetch each real envelope before explicitly acknowledging it. */
@RestController
public class MessageDeliveryController {
  private final Db db;

  public MessageDeliveryController(Db db) {
    this.db = db;
  }

  @GetMapping("/api/v1/messages/pending-delivery")
  public Object pending(@AuthenticationPrincipal Actor actor) {
    return db.list(
        """
        WITH viewer AS (SELECT ?::uuid id), candidates AS (
          SELECT m.id,m.sender_id sender,m.created_at,'friend:'||m.friendship_id::text context_key
          FROM private_message_receipt d JOIN private_message m ON m.id=d.message_id
          JOIN friendship f ON f.id=m.friendship_id CROSS JOIN viewer v
          WHERE d.user_id=v.id AND d.delivered_at IS NULL AND m.deleted_at IS NULL
          AND f.status='ACCEPTED' AND (f.requester=v.id OR f.recipient=v.id)
          AND NOT EXISTS(SELECT 1 FROM private_message_hidden h WHERE h.message_id=m.id AND h.user_id=v.id)
          UNION ALL
          SELECT m.id,m.user_id sender,m.created_at,'room:'||m.room_id::text context_key
          FROM room_message_receipt d JOIN room_message m ON m.id=d.message_id
          JOIN study_room r ON r.id=m.room_id CROSS JOIN viewer v
          JOIN room_participant p ON p.room_id=r.id AND p.user_id=v.id
          WHERE d.user_id=v.id AND d.delivered_at IS NULL AND m.deleted_at IS NULL
          AND NOT p.removed AND (p.left_at IS NULL OR r.status='ENDED')
          AND NOT EXISTS(SELECT 1 FROM room_message_hidden h WHERE h.message_id=m.id AND h.user_id=v.id)
          AND NOT EXISTS(SELECT 1 FROM moderation_case c JOIN moderation_action a ON a.case_id=c.id
            WHERE c.user_id=v.id AND c.room_id=r.id AND a.kind='KICK' AND a.revoked_at IS NULL
            AND (a.ends_at IS NULL OR a.ends_at>now()))
        )
        SELECT c.id,c.context_key FROM candidates c CROSS JOIN viewer v
        WHERE NOT EXISTS(SELECT 1 FROM user_block b WHERE
          (b.user_id=v.id AND b.blocked_id=c.sender) OR (b.blocked_id=v.id AND b.user_id=c.sender))
        ORDER BY c.created_at,c.id LIMIT 20
        """,
        actor.id());
  }
}
