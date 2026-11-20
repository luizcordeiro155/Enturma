-- Objetivo profissional do portfólio (Enturma Journey, fase 1).
-- Os campos novos dos projetos vivem no jsonb "projects" que já existe.
ALTER TABLE portfolio_profile ADD COLUMN goal varchar(200) NOT NULL DEFAULT '';
