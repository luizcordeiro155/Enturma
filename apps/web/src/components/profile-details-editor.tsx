"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  ChevronRight,
  Image as ImageIcon,
  Palette,
  Sparkles,
  Type,
  X,
} from "lucide-react";
import { ProfileImageEditor } from "./profile-image-editor";
import { api } from "@/lib/api";
import {
  ProfileCard,
  type PublicProfile,
  type ProfileDetails,
} from "./user-identity";
import {
  ShowcaseFields,
  ShowcaseView,
  AchievementGrid,
  type Showcase,
} from "./profile-showcase";

export function ProfileDetailsEditor({
  profile,
  onSaved,
}: {
  profile: PublicProfile;
  onSaved: () => Promise<void>;
}) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [showcase, setShowcase] = useState<Showcase>();
  const [busy, setBusy] = useState(false);
  const [mediaVersion, setMediaVersion] = useState(0);
  const [crop, setCrop] = useState<{ file: File; kind: "avatar" | "banner" }>();
  const [appearance, setAppearance] = useState({
    name: profile.name,
    bio: profile.bio ?? "",
    accentColor: profile.accentColor ?? "#183f36",
  });
  const [details, setDetails] = useState<ProfileDetails>({
    decoration: "NONE",
    nameFont: "SYSTEM",
    ...profile.profileDetails,
  });

  useEffect(() => {
    let active = true;
    api<Showcase>(`/users/${profile.id}/showcase`)
      .then((value) => {
        if (active) setShowcase(value);
      })
      .catch((error) => {
        if (active) setStatus(error.message);
      });
    return () => {
      active = false;
    };
  }, [profile.id]);

  function setDetail(field: keyof ProfileDetails, value: string) {
    setDetails((current) => ({ ...current, [field]: value }));
  }

  function choose(kind: "avatar" | "banner", file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setStatus("Use JPG, PNG, WEBP ou GIF.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setStatus("Escolha uma imagem de até 20 MB para recortar.");
      return;
    }
    setCrop({ kind, file });
  }

  async function upload(file: File) {
    if (!crop) return;
    if (file.size > (crop.kind === "avatar" ? 2 : 3) * 1024 * 1024) {
      throw Error("A imagem excede o limite. Use o recorte ou escolha um arquivo menor.");
    }
    const form = new FormData();
    form.set("file", file);
    const response = await fetch(`/api/backend/users/me/${crop.kind}`, {
      method: "POST",
      body: form,
    });
    if (!response.ok) {
      throw Error(
        (await response.json().catch(() => ({}))).message ??
          "Não foi possível salvar a imagem.",
      );
    }
    await onSaved();
    setMediaVersion(Date.now());
    setCrop(undefined);
    setStatus("Imagem atualizada.");
  }

  async function saveProfile() {
    if (busy) return;
    setBusy(true);
    setStatus("");
    try {
      await api("/users/me/appearance", {
        method: "PUT",
        body: JSON.stringify(appearance),
      });
      await api("/users/me/profile-details", {
        method: "PUT",
        body: JSON.stringify(details),
      });
      if (!showcase) throw Error("Aguarde o carregamento do perfil antes de salvar.");
      await api("/users/me/showcase", {
        method: "PUT",
        body: JSON.stringify({
          ...showcase.appearance,
          privacy: showcase.privacy,
          widgets: showcase.widgets.map(({ kind, visible, favorite }) => ({
            kind,
            visible,
            favorite,
          })),
          badges: showcase.badges?.map((badge) => badge.code) ?? [],
        }),
      });
      await onSaved();
      setStatus("Perfil salvo com sucesso.");
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const previewUser: PublicProfile = {
    ...profile,
    ...appearance,
    mediaVersion,
    profileDetails: details,
    showcaseAppearance: showcase?.appearance,
  };

  return (
    <section className="profile-details-editor profile-discord-editor">
      <form
        className="profile-discord-form"
        onSubmit={(event) => {
          event.preventDefault();
          void saveProfile();
        }}
      >
        <header className="profile-mobile-editor-header">
          <button
            type="button"
            className="profile-editor-close"
            aria-label="Fechar personalização"
            onClick={() => router.back()}
          >
            <X size={28} />
          </button>
          <div>
            <strong>Perfil</strong>
            <small>Usado em todo o Enturma</small>
          </div>
          <button
            type="submit"
            className="profile-editor-save"
            disabled={busy || !showcase}
          >
            {busy ? "Salvando…" : "Salvar"}
          </button>
        </header>

        <div className="profile-single-note">Um único perfil para todo o Enturma</div>

        <div className="profile-editor-scroll">
          <section className="profile-preview-stage" aria-label="Prévia do perfil">
            <span className="profile-preview-label">Prévia do perfil</span>
            <ProfileCard user={previewUser} />
          </section>

          {status ? <p className="profile-save-status" role="status">{status}</p> : null}

          <section className="profile-editor-section">
            <h2>Visual do perfil</h2>
            <div className="profile-media-grid discord-media-grid">
              <label className="profile-media-action">
                <span className="profile-media-icon"><Camera size={22} /></span>
                <span><strong>Foto de perfil</strong><small>JPG, PNG, WEBP ou GIF</small></span>
                <ChevronRight size={20} />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={busy}
                  onChange={(event) => {
                    choose("avatar", event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </label>

              <label className="profile-media-action">
                <span className="profile-media-icon"><ImageIcon size={22} /></span>
                <span><strong>Banner</strong><small>Personalize o topo do perfil</small></span>
                <ChevronRight size={20} />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={busy}
                  onChange={(event) => {
                    choose("banner", event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
          </section>

          <section className="profile-editor-section">
            <h2>Sobre você</h2>
            <label className="profile-discord-field">
              <span>Nome exibido</span>
              <input
                value={appearance.name}
                required
                minLength={2}
                maxLength={100}
                onChange={(event) =>
                  setAppearance((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>
            <label className="profile-discord-field">
              <span>Pronomes</span>
              <input
                value={details.pronouns ?? ""}
                maxLength={40}
                placeholder="Opcional"
                onChange={(event) => setDetail("pronouns", event.target.value)}
              />
            </label>
            <label className="profile-discord-field">
              <span>Bio</span>
              <textarea
                value={appearance.bio}
                maxLength={280}
                placeholder="Conte um pouco sobre você"
                onChange={(event) =>
                  setAppearance((current) => ({ ...current, bio: event.target.value }))
                }
              />
              <small>{appearance.bio.length}/280</small>
            </label>
            <label className="profile-discord-field">
              <span>Status personalizado</span>
              <input
                value={details.statusText ?? ""}
                maxLength={80}
                placeholder="📚 Estudando algoritmos"
                onChange={(event) => setDetail("statusText", event.target.value)}
              />
            </label>
          </section>

          <section className="profile-editor-section">
            <h2>Tema e identidade</h2>
            <label className="profile-setting-row profile-color-row">
              <span className="profile-setting-icon"><Palette size={21} /></span>
              <span><strong>Cor principal</strong><small>{appearance.accentColor}</small></span>
              <input
                type="color"
                value={appearance.accentColor}
                aria-label="Cor principal do perfil"
                onChange={(event) =>
                  setAppearance((current) => ({ ...current, accentColor: event.target.value }))
                }
              />
            </label>

            <label className="profile-setting-row">
              <span className="profile-setting-icon"><Sparkles size={21} /></span>
              <span>
                <strong>Decoração do avatar</strong>
                <small>
                  {details.decoration === "NONE"
                    ? "Nenhuma"
                    : details.decoration === "RING"
                      ? "Anel colorido"
                      : details.decoration === "GLOW"
                        ? "Brilho"
                        : "Anel degradê"}
                </small>
              </span>
              <select
                value={details.decoration}
                aria-label="Decoração do avatar"
                onChange={(event) => setDetail("decoration", event.target.value)}
              >
                <option value="NONE">Sem decoração</option>
                <option value="RING">Anel colorido</option>
                <option value="GLOW">Brilho</option>
                <option value="GRADIENT">Anel degradê</option>
              </select>
            </label>

            <label className="profile-setting-row">
              <span className="profile-setting-icon"><Type size={21} /></span>
              <span>
                <strong>Estilo do nome</strong>
                <small>
                  {details.nameFont === "MONO"
                    ? "Código"
                    : details.nameFont === "SERIF"
                      ? "Editorial"
                      : "Padrão"}
                </small>
              </span>
              <select
                value={details.nameFont}
                aria-label="Estilo do nome"
                onChange={(event) => setDetail("nameFont", event.target.value)}
              >
                <option value="SYSTEM">Padrão</option>
                <option value="MONO">Código</option>
                <option value="SERIF">Editorial</option>
              </select>
            </label>
          </section>

          <section className="profile-editor-section">
            <h2>Mais sobre você</h2>
            <label className="profile-discord-field">
              <span>Interesses</span>
              <input
                value={details.interests ?? ""}
                maxLength={120}
                placeholder="JavaScript, UX, jogos…"
                onChange={(event) => setDetail("interests", event.target.value)}
              />
            </label>
            <label className="profile-discord-field">
              <span>Site ou GitHub</span>
              <input
                type="url"
                value={details.website ?? ""}
                maxLength={200}
                placeholder="https://"
                onChange={(event) => setDetail("website", event.target.value)}
              />
            </label>
          </section>

          {showcase ? (
            <section className="profile-advanced-area">
              <div className="profile-advanced-heading">
                <span>Personalização avançada</span>
                <h2>Mural, efeitos, widgets e privacidade</h2>
                <p>Todos os recursos já existentes continuam no mesmo perfil global.</p>
              </div>
              <ShowcaseFields value={showcase} onChange={setShowcase} />
              <section className="profile-showcase-preview">
                <h2>Prévia do mural</h2>
                <ShowcaseView value={showcase} />
              </section>
              {showcase.achievements ? (
                <section className="profile-editor-section">
                  <h2>Suas conquistas</h2>
                  <AchievementGrid achievements={showcase.achievements} />
                </section>
              ) : null}
            </section>
          ) : (
            <p className="profile-loading-card">Carregando personalização…</p>
          )}

          <button type="submit" className="profile-desktop-save" disabled={busy || !showcase}>
            {busy ? "Salvando…" : "Salvar perfil"}
          </button>
          <div className="profile-editor-bottom-space" />
        </div>
      </form>

      {crop ? (
        <ProfileImageEditor
          file={crop.file}
          kind={crop.kind}
          onApply={upload}
          onCancel={() => setCrop(undefined)}
        />
      ) : null}
    </section>
  );
}
