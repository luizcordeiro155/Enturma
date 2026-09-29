CREATE TABLE study_material (id uuid PRIMARY KEY,room_id uuid NOT NULL REFERENCES study_room(id),uploaded_by uuid NOT NULL REFERENCES app_user(id),file_name varchar(200) NOT NULL,storage_key varchar(200) NOT NULL UNIQUE,mime_type varchar(100) NOT NULL,file_size bigint NOT NULL,status varchar(20) NOT NULL DEFAULT 'READY',created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX material_room ON study_material(room_id,created_at);
CREATE TABLE material_chunk (id uuid PRIMARY KEY,material_id uuid NOT NULL REFERENCES study_material(id),room_id uuid NOT NULL REFERENCES study_room(id),ordinal int NOT NULL,page int,body text NOT NULL,search tsvector GENERATED ALWAYS AS (to_tsvector('portuguese',body)) STORED);
CREATE INDEX chunk_room ON material_chunk(room_id);
CREATE INDEX chunk_search ON material_chunk USING gin(search);
CREATE TABLE ai_message (id uuid PRIMARY KEY,room_id uuid NOT NULL REFERENCES study_room(id),user_id uuid NOT NULL REFERENCES app_user(id),question varchar(2000) NOT NULL,answer text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE voice_room (room_id uuid PRIMARY KEY REFERENCES study_room(id),last_token_expires_at timestamptz NOT NULL,cleaned_at timestamptz);
