"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import {
  ProfileCard,
  type PublicProfile,
  type ProfileDetails,
} from "./user-identity";
export function ProfileDetailsEditor({ profile }: { profile: PublicProfile }) {
  const [details, setDetails] = useState<ProfileDetails>({
    decoration: "NONE",
    nameFont: "SYSTEM",
    ...profile.profileDetails,
  });
  const [status, setStatus] = useState("");
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
        <ProfileCard user={{ ...profile, profileDetails: details }} />
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await api("/users/me/profile-details", {
                method: "PUT",
                body: JSON.stringify(details),
              });
              setStatus("Personalização salva para todas as suas conversas.");
            } catch (e) {
              setStatus((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
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
          <button disabled={busy}>
            {busy ? "Salvando…" : "Salvar identidade"}
          </button>
          <p role="status">{status}</p>
        </form>
      </div>
    </section>
  );
}
