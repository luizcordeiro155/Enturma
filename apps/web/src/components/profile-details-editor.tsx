"use client";
import { useEffect, useState } from "react";
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
  const [status, setStatus] = useState("");
  const [showcase, setShowcase] = useState<Showcase>();
  useEffect(() => {
    let active = true;
    api<Showcase>(`/users/${profile.id}/showcase`)
      .then((s) => {
        if (active) setShowcase(s);
      })
      .catch((e) => setStatus(e.message));
    return () => {
      active = false;
    };
  }, [profile.id]);
  const [appearance, setAppearance] = useState({
    name: profile.name,
    bio: profile.bio ?? "",
    accentColor: profile.accentColor ?? "#183f36",
  });
  const [mediaVersion, setMediaVersion] = useState(0);
  const [crop, setCrop] = useState<{ file: File; kind: "avatar" | "banner" }>();
  function choose(kind: "avatar" | "banner", file?: File) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.type,
      )
    ) {
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
    if (file.size > (crop.kind === "avatar" ? 2 : 3) * 1024 * 1024)
      throw Error(
        "A imagem excede o limite. Use o recorte ou escolha um arquivo menor.",
      );
    await api("/users/me");
    const form = new FormData();
    form.set("file", file);
    const response = await fetch(`/api/backend/users/me/${crop.kind}`, {
      method: "POST",
      body: form,
    });
    if (!response.ok)
      throw Error(
        (await response.json().catch(() => ({}))).message ??
          "Não foi possível salvar a imagem.",
      );
    await onSaved();
    // Upload completion needs a fresh URL to invalidate the browser image cache.
    setMediaVersion(Date.now());
    setStatus("Imagem atualizada.");
  }
  const [details, setDetails] = useState<ProfileDetails>({
    decoration: "NONE",
    nameFont: "SYSTEM",
    ...profile.profileDetails,
  });

  const [busy, setBusy] = useState(false);
  function set(field: keyof ProfileDetails, value: string) {
    setDetails((d) => ({ ...d, [field]: value }));
  }
  return (
    <section className="profile-details-editor">
      <h2>Sua identidade no Enturma</h2>
      <p>
        Escolha como aparecer nas conversas e na lista da turma. As cores
        decoram o perfil sem reduzir o contraste do texto.
      </p>
      <div className="profile-details-layout">
        <div
          className={`profile-preview-column ${showcase?.appearance.layout === "WIDGETS_FIRST" ? "widgets-first" : ""}`}
        >
          <ProfileCard
            user={{
              ...profile,
              ...appearance,
              mediaVersion,
              profileDetails: details,
              showcaseAppearance: showcase?.appearance,
            }}
          />
          {showcase && <ShowcaseView value={showcase} />}
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
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
              if (!showcase)
                throw Error("Aguarde o carregamento do mural antes de salvar.");
              await api("/users/me/showcase", {
                method: "PUT",
                body: JSON.stringify({
                  ...showcase.appearance,
                  privacy: showcase.privacy,
                  widgets: showcase.widgets.map(
                    ({ kind, visible, favorite }) => ({
                      kind,
                      visible,
                      favorite,
                    }),
                  ),
                  badges: showcase.badges?.map((b) => b.code) ?? [],
                }),
              });
              await onSaved();
              setStatus("Personalização salva para todas as suas conversas.");
            } catch (e) {
              setStatus((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="profile-media-grid">
            <label className="profile-upload">
              Foto de perfil
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={busy}
                onChange={(e) => {
                  choose("avatar", e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            <label className="profile-upload">
              Banner
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={busy}
                onChange={(e) => {
                  choose("banner", e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <label>
            Nome de exibição
            <input
              value={appearance.name}
              required
              minLength={2}
              maxLength={100}
              onChange={(e) =>
                setAppearance((p) => ({ ...p, name: e.target.value }))
              }
            />
          </label>
          <label>
            Bio
            <textarea
              value={appearance.bio}
              maxLength={280}
              onChange={(e) =>
                setAppearance((p) => ({ ...p, bio: e.target.value }))
              }
            />
          </label>
          <label>
            Cor do perfil
            <input
              type="color"
              value={appearance.accentColor}
              onChange={(e) =>
                setAppearance((p) => ({ ...p, accentColor: e.target.value }))
              }
            />
          </label>
          <label>
            Pronomes
            <input
              value={details.pronouns ?? ""}
              maxLength={40}
              placeholder="Opcional"
              onChange={(e) => set("pronouns", e.target.value)}
            />
          </label>
          <label>
            Status personalizado
            <input
              value={details.statusText ?? ""}
              maxLength={80}
              placeholder="📚 Estudando algoritmos"
              onChange={(e) => set("statusText", e.target.value)}
            />
          </label>
          <label>
            Interesses
            <input
              value={details.interests ?? ""}
              maxLength={120}
              placeholder="JavaScript, UX, jogos…"
              onChange={(e) => set("interests", e.target.value)}
            />
          </label>
          <label>
            Site ou GitHub
            <input
              type="url"
              value={details.website ?? ""}
              maxLength={200}
              placeholder="https://"
              onChange={(e) => set("website", e.target.value)}
            />
          </label>
          <label>
            Decoração do avatar
            <select
              value={details.decoration}
              onChange={(e) => set("decoration", e.target.value)}
            >
              <option value="NONE">Sem decoração</option>
              <option value="RING">Anel colorido</option>
              <option value="GLOW">Brilho</option>
              <option value="GRADIENT">Anel degradê</option>
            </select>
          </label>
          <label>
            Estilo do nome
            <select
              value={details.nameFont}
              onChange={(e) => set("nameFont", e.target.value)}
            >
              <option value="SYSTEM">Padrão</option>
              <option value="MONO">Código</option>
              <option value="SERIF">Editorial</option>
            </select>
          </label>
          {showcase && (
            <ShowcaseFields value={showcase} onChange={setShowcase} />
          )}
          <button disabled={busy || !showcase}>
            {busy ? "Salvando…" : "Salvar perfil"}
          </button>
          <p role="status">{status}</p>
        </form>
      </div>
      {showcase?.achievements && (
        <section>
          <h2>Suas conquistas</h2>
          <AchievementGrid achievements={showcase.achievements} />
        </section>
      )}
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
