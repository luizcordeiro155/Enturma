-- Confirmação de embarque em duas etapas: motorista valida o PIN e passageiro confirma que entrou no carro.

ALTER TABLE ride_match
  ADD COLUMN boarding_verified_at timestamptz;

UPDATE ride_match
SET boarding_verified_at=boarded_at
WHERE boarded_at IS NOT NULL AND boarding_verified_at IS NULL;

CREATE INDEX ride_match_boarding_pending
  ON ride_match(ride_id,boarding_verified_at,boarded_at)
  WHERE status='ACCEPTED' AND deleted_at IS NULL;
