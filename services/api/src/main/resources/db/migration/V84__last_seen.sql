-- Quando a pessoa esteve com o Enturma aberto pela última vez ("visto por último"),
-- mostrado só a amigos aceitos e só enquanto os dois lados mantêm a opção ligada.
ALTER TABLE app_user ADD COLUMN last_seen_at timestamptz;
ALTER TABLE profile_privacy_setting DROP CONSTRAINT profile_privacy_setting_field_check;
ALTER TABLE profile_privacy_setting ADD CONSTRAINT profile_privacy_setting_field_check
  CHECK(field IN ('ACADEMIC','STATS','ACHIEVEMENTS','JOINED','WIDGETS','ACTIVITY','LAST_SEEN'));
