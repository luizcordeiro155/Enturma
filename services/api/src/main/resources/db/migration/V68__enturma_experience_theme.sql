-- Extend accepted preferences without changing any saved choice or the SYSTEM default.
ALTER TABLE user_experience_preference
  DROP CONSTRAINT user_experience_preference_theme_check;
ALTER TABLE user_experience_preference
  ADD CONSTRAINT user_experience_preference_theme_check
  CHECK (theme IN ('LIGHT', 'DARK', 'SYSTEM', 'ENTURMA'));
