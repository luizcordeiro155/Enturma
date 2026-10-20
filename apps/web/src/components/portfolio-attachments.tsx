"use client";
/* eslint-disable @next/next/no-img-element -- authenticated attachment URLs */
import { useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { api } from "@/lib/api";
export type PortfolioAsset = { id: string; name: string; mime: string };
export function PortfolioAttachments({
  ids = [],
  assets,
  owner = false,
  onChange,
  onUpload,
}: {
  ids?: string[];
  assets: PortfolioAsset[];
  owner?: boolean;
  onChange?: (ids: string[]) => void;
  onUpload?: (asset: PortfolioAsset) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="portfolio-attachment-section">
      <div className="portfolio-gallery">
        {ids.map((id) => {
          const asset = assets.find((a) => a.id === id);
          if (!asset) return null;
          const href = `/api/backend/${owner ? "portfolio/me" : "public/portfolio"}/assets/${id}`;
          return (
            <figure key={id}>
              {asset.mime.startsWith("image/") ? (
                <a href={href} target="_blank" rel="noreferrer">
                  <img src={href} alt={asset.name} loading="lazy" />
                </a>
              ) : (
                <a
                  className="portfolio-document"
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FileText size={28} />
                  <span>
                    {asset.name}
                    <small>Abrir PDF</small>
                  </span>
                </a>
              )}
              {onChange && (
                <button
                  type="button"
                  className="icon-control"
                  aria-label={`Remover ${asset.name}`}
                  disabled={busy}
                  onClick={() => onChange(ids.filter((a) => a !== id))}
                >
                  <X size={14} />
                </button>
              )}
            </figure>
          );
        })}
      </div>
      {onChange && onUpload && (
        <label className="portfolio-upload">
          <Upload size={18} />
          <span>
            {busy ? "Enviando arquivo…" : "Adicionar imagem ou PDF"}
            <small>Até 6 arquivos por projeto · 3 MB cada</small>
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
            disabled={busy || ids.length >= 6}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setBusy(true);
              setError("");
              try {
                if (file.size > 3 * 1024 * 1024)
                  throw Error("Envie arquivos de até 3 MB.");
                const form = new FormData();
                form.set("file", file);
                const asset = await api<PortfolioAsset>(
                  "/portfolio/me/assets",
                  { method: "POST", body: form },
                );
                onUpload(asset);
                onChange([...ids, asset.id]);
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          />
        </label>
      )}
      {error && <p role="status">{error}</p>}
    </div>
  );
}
