"use client";
import { Lock } from "lucide-react";
import {
  COSMETIC_FIELDS,
  COSMETIC_LAYERS,
  COSMETIC_PACKS,
  type CosmeticDetails,
} from "@/cosmetics/catalog";

export type CosmeticShop = {
  level: number;
  items: { id: string; level: number; unlocked: boolean }[];
};
const LAYER_NAMES = {
  frame: "Moldura",
  avatar: "Avatar",
  effect: "Efeito",
  theme: "Cores",
};

/** The shelf of packs in the profile editor: put pieces on, mix them, try locked ones. */
export function CosmeticsPicker({
  shop,
  details,
  trying,
  onChange,
  onTry,
}: {
  shop?: CosmeticShop;
  details: CosmeticDetails;
  trying?: string;
  onChange: (change: CosmeticDetails) => void;
  onTry: (id?: string) => void;
}) {
  if (!shop)
    return <p className="cosmetic-shop-note">Carregando os pacotes…</p>;
  const wearing = COSMETIC_LAYERS.some(
    (layer) => details[COSMETIC_FIELDS[layer]],
  );
  return (
    <div className="cosmetic-shop">
      <p className="cosmetic-shop-level">
        <strong>Você está no nível {shop.level}</strong>
        <span>
          Cada pacote tem moldura, decoração de avatar, efeito e cores. Dá para
          usar o pacote inteiro ou misturar as peças.
        </span>
      </p>
      {COSMETIC_PACKS.map((pack) => {
        const item = shop.items.find((entry) => entry.id === pack.id);
        if (!item) return null;
        const complete = COSMETIC_LAYERS.every(
          (layer) => details[COSMETIC_FIELDS[layer]] === pack.id,
        );
        return (
          <div
            key={pack.id}
            role="group"
            aria-label={pack.name}
            className="cosmetic-pack"
            data-locked={!item.unlocked}
          >
            <div className="cosmetic-pack-head">
              <strong>{pack.name}</strong>
              {item.unlocked ? (
                <span className="cosmetic-pack-level">Nível {item.level}</span>
              ) : (
                <span className="cosmetic-pack-level">
                  <Lock size={14} aria-hidden />
                  Libera no nível {item.level}
                </span>
              )}
            </div>
            <p>{pack.blurb}</p>
            <div className="cosmetic-pack-pieces">
              {COSMETIC_LAYERS.map((layer) => {
                const field = COSMETIC_FIELDS[layer],
                  on = details[field] === pack.id;
                return (
                  <button
                    key={layer}
                    type="button"
                    className="secondary"
                    data-layer={layer}
                    aria-pressed={on}
                    disabled={!item.unlocked}
                    onClick={() => onChange({ [field]: on ? "" : pack.id })}
                  >
                    {LAYER_NAMES[layer]}
                  </button>
                );
              })}
            </div>
            <div className="cosmetic-pack-actions">
              {item.unlocked ? (
                <button
                  type="button"
                  data-action="all"
                  aria-pressed={complete}
                  onClick={() =>
                    onChange({
                      cosmeticFrame: pack.id,
                      cosmeticAvatar: pack.id,
                      cosmeticEffect: pack.id,
                      cosmeticTheme: pack.id,
                    })
                  }
                >
                  Usar o pacote completo
                </button>
              ) : null}
              <button
                type="button"
                className="secondary"
                data-action="try"
                aria-pressed={trying === pack.id}
                onClick={() => onTry(trying === pack.id ? undefined : pack.id)}
              >
                {trying === pack.id ? "Parar de experimentar" : "Experimentar"}
              </button>
            </div>
          </div>
        );
      })}
      {wearing ? (
        <button
          type="button"
          className="secondary cosmetic-shop-clear"
          onClick={() =>
            onChange({
              cosmeticFrame: "",
              cosmeticAvatar: "",
              cosmeticEffect: "",
              cosmeticTheme: "",
            })
          }
        >
          Tirar tudo
        </button>
      ) : null}
    </div>
  );
}
