-- Students without an academic e-mail may enter with their personal e-mail. This is a
-- separate flag so a later academic verification never removes access while pending.
ALTER TABLE academic_identity ADD COLUMN personal_access boolean NOT NULL DEFAULT false;

-- Focus mode: during classes and AI study sessions the Social is paused (opt-out).
ALTER TABLE academic_routine ADD COLUMN focus_mode boolean NOT NULL DEFAULT true;
