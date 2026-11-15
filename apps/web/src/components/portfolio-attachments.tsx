"use client";
/* eslint-disable @next/next/no-img-element -- authenticated attachment URLs */
import { useState } from "react";
import { FileText, ImageIcon, Upload, X } from "lucide-react";
import { api } from "@/lib/api";
export type PortfolioAsset = { id: string; name: string; mime: string };
export function PortfolioAttachments({
  ids = [],
  assets,
  owner = false,
  compact = false,
  onChange,
  onUpload,
}: {
  ids?: string[];
  assets: PortfolioAsset[];
  owner?: boolean;
  /** A row of file chips instead of large previews (public project cards). */
  compact?: boolean;
  onChange?: (ids: string[]) => void;
  onUpload?: (asset: PortfolioAsset) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (compact)
    return (
      <ul className="portfolio-file-chips" aria-label="Arquivos do projeto">
        {ids.map((id) => {
          const asset = assets.find((a) => a.id === id);
          if (!asset) return null;
          const image = asset.mime.startsWith("image/");
          return (
            <li key={id}>
              <a
                href={`/api/backend/public/portfolio/assets/${id}`}
                target="_blank"
                rel="noreferrer"
              >
                {image ? (
                  <ImageIcon size={15} aria-hidden="true" />
                ) : (
                  <FileText size={15} aria-hidden="true" />
                )}
                <span>{asset.name}</span>
                <small>{image ? "Imagem" : "PDF"}</small>
              </a>
            </li>
          );
        })}
      </ul>
    );
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
        <label
          className="portfolio-upload"
          data-disabled={busy || ids.length >= 6 ? "true" : undefined}
        >
          <Upload size={18} />
          <span>
            {busy
              ? "Enviando arquivo…"
              : ids.length >= 6
                ? "Limite de 6 arquivos atingido"
                : "Adicionar imagem ou PDF"}
            <small>
              {ids.length}/6 arquivos · PNG, JPG, WEBP, GIF ou PDF até 3 MB
            </small>
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
      {error && (
        <p role="status" className="portfolio-upload-error">
          {error}
        </p>
      )}
    </div>
  );
}
