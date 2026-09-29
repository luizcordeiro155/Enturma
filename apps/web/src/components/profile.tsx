"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Profile } from "@enturma/contracts";
import { Camera, Image as ImageIcon, Palette, Save } from "lucide-react";
import { api, post } from "@/lib/api";
import { Shell } from "./shell";
import { ProfileDetailsEditor } from "./profile-details-editor";
import { Feedback } from "./feedback";

export function ProfileView({
  subjectsOnly = false,
  settings = false,
}: {
  subjectsOnly?: boolean;
  settings?: boolean;
}) {
  const router = useRouter();
  const [p, setP] = useState<Profile>();
  const [sessions, setSessions] = useState<
    { id: string; device: string; createdAt: string }[]
  >([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(() => Date.now());
  const [bannerVersion, setBannerVersion] = useState(() => Date.now());

  async function loadProfile() {
    setP(await api<Profile>("/users/me"));
  }

  useEffect(() => {
    let active = true;
    api<Profile>("/users/me")
      .then((profile) => {
        if (active) setP(profile);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    if (settings)
      api<typeof sessions>("/auth/sessions")
        .then((items) => {
          if (active) setSessions(items);
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    return () => {
      active = false;
    };
  }, [settings]);

  async function revoke(id: string) {
    try {
      await api(`/auth/sessions/${id}`, { method: "DELETE" });
      setSessions((s) => s.filter((v) => v.id !== id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function uploadAsset(type: "avatar" | "banner", file: File | null) {
    if (!file) return;
    const max = type === "avatar" ? 2 * 1024 * 1024 : 3 * 1024 * 1024;
    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.type,
      )
    ) {
      setError("Use JPG, PNG, WEBP ou GIF.");
      return;
    }
    if (file.size > max) {
      setError(
        `${type === "avatar" ? "Avatar" : "Banner"} deve ter no máximo ${max / 1024 / 1024} MB.`,
      );
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await api("/users/me");
      const form = new FormData();
      form.set("file", file);
      const res = await fetch(`/api/backend/users/me/${type}`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw Error(body.message ?? "Não foi possível enviar a imagem.");
      }
      await loadProfile();
      if (type === "avatar") setAvatarVersion(Date.now());
      else setBannerVersion(Date.now());
      setSuccess(
        type === "avatar" ? "Avatar atualizado." : "Banner atualizado.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const accent = p?.accentColor ?? "#183f36";
  const avatarUrl = p?.hasAvatar
    ? `/api/backend/users/${p.id}/avatar?v=${avatarVersion}`
    : null;
  const bannerUrl = p?.hasBanner
    ? `/api/backend/users/${p.id}/banner?v=${bannerVersion}`
    : null;

  return (
    <Shell>
      <div className={subjectsOnly ? "narrow" : "profile-page"}>
        <h1>
          {subjectsOnly
            ? "Minhas matérias"
            : settings
              ? "Configurações"
              : "Meu perfil"}
        </h1>
        <Feedback error={error} success={success} />

        {p ? (
          <>
            {!subjectsOnly && !settings ? (
              <ProfileDetailsEditor key={p.id} profile={p} />
            ) : null}
            {!subjectsOnly && !settings ? (
              <div className="profile-customizer">
                <section
                  className="profile-preview-card"
                  style={{ "--profile-accent": accent } as React.CSSProperties}
                >
                  <div
                    className="profile-banner"
                    style={
                      bannerUrl
                        ? { backgroundImage: `url("${bannerUrl}")` }
                        : {
                            background: `linear-gradient(135deg, ${accent}, #101816)`,
                          }
                    }
                  />
                  <div className="profile-card-body">
                    <div className="profile-avatar-wrap">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarUrl}
                          alt=""
                          className="profile-avatar"
                        />
                      ) : (
                        <div className="profile-avatar profile-avatar-fallback">
                          {p.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <span className="profile-online-dot" />
                    </div>
                    <h2>{p.name}</h2>
                    <p className="profile-handle">@{p.username}</p>
                    {p.bio ? (
                      <p className="profile-bio">{p.bio}</p>
                    ) : (
                      <p className="profile-bio muted">
                        Adicione uma bio para se apresentar à turma.
                      </p>
                    )}
                    <div className="profile-meta">
                      <span>
                        {p.enrollment?.periodName ??
                          "Curso/período não informado"}
                      </span>
                      <span>{p.subjects.length} matérias</span>
                    </div>
                  </div>
                </section>

                <section className="profile-editor">
                  <div className="profile-editor-title">
                    <div>
                      <h2>Personalizar perfil</h2>
                      <p>
                        Foto, banner, cor, nome de exibição e bio aparecem nas
                        salas.
                      </p>
                    </div>
                    <Palette size={22} />
                  </div>

                  <div className="profile-media-grid">
                    <label className="profile-upload">
                      <Camera size={20} />
                      <span>
                        <strong>Foto de perfil</strong>
                        <small>JPG, PNG, WEBP ou GIF · até 2 MB</small>
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        disabled={busy}
                        onChange={(e) =>
                          void uploadAsset(
                            "avatar",
                            e.target.files?.[0] ?? null,
                          )
                        }
                      />
                    </label>
                    <label className="profile-upload">
                      <ImageIcon size={20} />
                      <span>
                        <strong>Banner</strong>
                        <small>JPG, PNG, WEBP ou GIF · até 3 MB</small>
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        disabled={busy}
                        onChange={(e) =>
                          void uploadAsset(
                            "banner",
                            e.target.files?.[0] ?? null,
                          )
                        }
                      />
                    </label>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setBusy(true);
                      setError("");
                      setSuccess("");
                      const form = new FormData(e.currentTarget);
                      try {
                        await api("/users/me/appearance", {
                          method: "PUT",
                          body: JSON.stringify({
                            name: form.get("name"),
                            bio: form.get("bio"),
                            accentColor: form.get("accentColor"),
                          }),
                        });
                        await loadProfile();
                        setSuccess("Perfil personalizado com sucesso.");
                      } catch (e) {
                        setError((e as Error).message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <label>
                      Nome de exibição
                      <input
                        name="name"
                        defaultValue={p.name}
                        minLength={2}
                        maxLength={100}
                        required
                      />
                    </label>
                    <label>
                      Bio
                      <textarea
                        name="bio"
                        defaultValue={p.bio ?? ""}
                        maxLength={280}
                        placeholder="Conte rapidamente o que você estuda, no que pode ajudar e seus objetivos."
                      />
                    </label>
                    <label>
                      Cor do perfil
                      <div className="profile-color-control">
                        <input
                          name="accentColor"
                          type="color"
                          defaultValue={accent}
                        />
                        <span>{accent}</span>
                      </div>
                    </label>
                    <button disabled={busy}>
                      <Save size={17} />
                      {busy ? "Salvando…" : "Salvar personalização"}
                    </button>
                  </form>
                </section>
              </div>
            ) : null}

            {!subjectsOnly ? (
              <dl className="details profile-details">
                <dt>Usuário</dt>
                <dd>@{p.username}</dd>
                <dt>E-mail</dt>
                <dd>
                  {p.email} ·{" "}
                  {p.emailVerified ? "Confirmado" : "Confirmação pendente"}
                </dd>
                <dt>Período</dt>
                <dd>
                  {p.enrollment?.periodName ??
                    "Perfil acadêmico ainda não preenchido"}
                </dd>
              </dl>
            ) : null}

            <Link href="/onboarding" className="button secondary">
              Atualizar perfil acadêmico
            </Link>

            <h2 className="section-heading">Suas matérias</h2>
            {p.subjects.length ? (
              p.subjects.map((s) => (
                <article className="room-row" key={s.id}>
                  <div>
                    <h3>
                      <Link href={`/subjects/${s.id}`}>{s.name}</Link>
                    </h3>
                    <a href={s.sourceUrl} target="_blank" rel="noreferrer">
                      Consultar fonte: {s.sourceName}
                    </a>
                  </div>
                  <Link className="button" href="/rooms/new">
                    Estudar
                  </Link>
                </article>
              ))
            ) : (
              <p>Nenhuma matéria selecionada.</p>
            )}

            {settings ? (
              <>
                <h2 className="section-heading">Sessões ativas</h2>
                {sessions.map((s) => (
                  <div className="room-row" key={s.id}>
                    <span>
                      {s.device}
                      <small>
                        {new Date(s.createdAt).toLocaleString("pt-BR")}
                      </small>
                    </span>
                    <button onClick={() => revoke(s.id)}>Revogar</button>
                  </div>
                ))}
                <Link href="/forgot-password">Redefinir minha senha</Link>
                <button
                  className="button"
                  onClick={async () => {
                    try {
                      await post("/auth/logout");
                      router.push("/login");
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  Sair da conta
                </button>
              </>
            ) : null}

            {["ADMIN", "SUPER_ADMIN"].includes(p.role) ? (
              <p>
                <Link href="/admin">Administrar catálogo</Link>
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </Shell>
  );
}
