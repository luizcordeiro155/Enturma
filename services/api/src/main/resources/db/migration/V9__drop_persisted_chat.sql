-- Enturma private-room chat is ephemeral and end-to-end encrypted in clients.
-- Remove legacy server-side chat persistence, including any existing historical content.
DROP TABLE IF EXISTS chat_reaction;
DROP TABLE IF EXISTS chat_message;
