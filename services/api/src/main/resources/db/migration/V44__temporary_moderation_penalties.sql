UPDATE moderation_action
SET ends_at =
  starts_at +
  CASE kind
    WHEN 'WARNING' THEN interval '5 minutes'
    WHEN 'MUTE' THEN interval '2 minutes'
    WHEN 'RESTRICTION' THEN interval '5 minutes'
    WHEN 'KICK' THEN interval '5 minutes'
    WHEN 'SUSPENSION' THEN interval '15 minutes'
    WHEN 'BAN' THEN interval '30 minutes'
    ELSE interval '5 minutes'
  END
WHERE ends_at IS NULL
  AND revoked_at IS NULL;

UPDATE moderation_case c
SET status = 'EXPIRED'
WHERE status <> 'REVOKED'
  AND EXISTS (
    SELECT 1
    FROM moderation_action a
    WHERE a.case_id = c.id
      AND a.revoked_at IS NULL
      AND a.ends_at <= now()
  );
