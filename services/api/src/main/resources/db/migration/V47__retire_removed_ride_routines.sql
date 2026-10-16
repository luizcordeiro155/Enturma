-- Repair trips left behind by the previous deactivate-only routine deletion.
-- Confirmed bookings and journeys already underway keep their own lifecycle.
UPDATE ride r SET recurrence_id=NULL
WHERE r.status='OPEN' AND r.recurrence_id IN (SELECT id FROM ride_recurrence WHERE NOT active)
 AND (r.trip_status NOT IN ('SCHEDULED','MATCHING') OR EXISTS(
  SELECT 1 FROM ride_match m WHERE (m.ride_id=r.id OR m.request_ride_id=r.id)
  AND m.status='ACCEPTED' AND m.deleted_at IS NULL));

UPDATE ride r SET status='CANCELLED',trip_status='CANCELLED'
WHERE r.status='OPEN' AND r.recurrence_id IN (SELECT id FROM ride_recurrence WHERE NOT active)
 AND r.trip_status IN ('SCHEDULED','MATCHING');
UPDATE ride_match m SET status='CANCELLED',closed_at=coalesce(closed_at,now()),
 purge_at=coalesce(purge_at,now()+interval '24 hours')
WHERE m.status IN ('PENDING','WAITLISTED') AND EXISTS(
 SELECT 1 FROM ride r JOIN ride_recurrence rr ON rr.id=r.recurrence_id
 WHERE NOT rr.active AND r.status='CANCELLED' AND (m.ride_id=r.id OR m.request_ride_id=r.id));
DELETE FROM notification n WHERE n.kind='RIDE_REMINDER_30' AND EXISTS(
 SELECT 1 FROM ride r WHERE r.id=n.target_id AND r.status<>'OPEN');
DELETE FROM notification_desktop_push_event n WHERE n.kind='RIDE_REMINDER_30' AND EXISTS(
 SELECT 1 FROM ride r WHERE r.id=n.target_id AND r.status<>'OPEN');
DELETE FROM email_outbox e WHERE e.sent_at IS NULL AND EXISTS(
 SELECT 1 FROM ride r WHERE r.status<>'OPEN' AND e.dedupe_key='RIDE_REMINDER_30:'||r.id::text||':null');
