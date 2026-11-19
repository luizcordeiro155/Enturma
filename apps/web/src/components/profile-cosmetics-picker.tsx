"use client";
import { useState } from "react";
import { Lock } from "lucide-react";
import {
  COSMETIC_FIELDS,
  COSMETIC_GROUPS,
  COSMETIC_LAYERS,
  COSMETIC_PACKS,
  type CosmeticDetails,
} from "@/cosmetics/catalog";

export type CosmeticShop = {
  level: number;
  items: { id: string; level: number; unlocked: boolean }[];
};
const LAYER_NAMES = { frame: "Moldura", avatar: "Avatar", effect: "Efeito" };
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length &&
  a.every((color, index) => color.toLowerCase() === b[index].toLowerCase());

/** The shelf of packs in the profile editor: put pieces on, mix them, try locked ones. */
export function CosmeticsPicker({
  shop,
  details,
  colors,
  trying,
  onChange,
  onColors,
  onTry,
}: {
  shop?: CosmeticShop;
  details: CosmeticDetails;
  /** The profile's two colours right now: primary and accent. */
  colors: readonly [string, string];
  trying?: string;
  onChange: (change: CosmeticDetails) => void;
  /** Takes a pack's suggested colours as the profile's own. */
  onColors: (colors: readonly [string, string]) => void;
  onTry: (id?: string) => void;
}) {
  // Which shelf is open; none means all of them, one under the other.
  const [shelf, setShelf] = useState<string>();
  if (!shop)
    return <p className="cosmetic-shop-note">Carregando os pacotes…</p>;
  const wearing = COSMETIC_LAYERS.some(
    (layer) => details[COSMETIC_FIELDS[layer]],
  );
  const card = (pack: (typeof COSMETIC_PACKS)[number]) => {
    const item = shop.items.find((entry) => entry.id === pack.id);
    if (!item) return null;
    const painted = same(colors, pack.colors),
      complete =
        painted &&
        COSMETIC_LAYERS.every(
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
        <div className="cosmetic-pack-pieces">
          <button
            type="button"
            className="secondary cosmetic-pack-colors"
            data-action="colors"
            aria-pressed={painted}
            disabled={!item.unlocked}
            onClick={() => onColors(pack.colors)}
          >
            <i
              aria-hidden
              style={{
                background: `linear-gradient(135deg, ${pack.colors[0]}, ${pack.colors[1]})`,
              }}
            />
            Cores do pacote
          </button>
        </div>
        <div className="cosmetic-pack-actions">
          {item.unlocked ? (
            <button
              type="button"
              data-action="all"
              aria-pressed={complete}
              onClick={() => {
                onChange({
                  cosmeticFrame: pack.id,
                  cosmeticAvatar: pack.id,
                  cosmeticEffect: pack.id,
                });
                onColors(pack.colors);
              }}
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
  };
  return (
    <div className="cosmetic-shop">
      <p className="cosmetic-shop-level">
        <strong>Você está no nível {shop.level}</strong>
        <span>
          Cada pacote tem moldura, decoração de avatar, efeito e duas cores que
          combinam. Dá para usar o pacote inteiro ou misturar as peças, e trocar
          as cores depois em Tema e identidade.
        </span>
      </p>
      <div
        className="cosmetic-shelves"
        role="group"
        aria-label="Temas dos pacotes"
      >
        <button
          type="button"
          className="secondary"
          aria-pressed={!shelf}
          onClick={() => setShelf(undefined)}
        >
          Todos
        </button>
        {COSMETIC_GROUPS.map((group) => (
          <button
            key={group}
            type="button"
            className="secondary"
            aria-pressed={shelf === group}
            onClick={() => setShelf(group)}
          >
            {group}
          </button>
        ))}
      </div>
      {COSMETIC_GROUPS.filter((group) => !shelf || shelf === group).map(
        (group) => {
          const packs = COSMETIC_PACKS.filter(
            (pack) =>
              pack.group === group &&
              shop.items.some((entry) => entry.id === pack.id),
          );
          if (!packs.length) return null;
          return (
            <section key={group} className="cosmetic-shelf">
              <h3>{group}</h3>
              {packs.map(card)}
            </section>
          );
        },
      )}
      {wearing ? (
        <button
          type="button"
          className="secondary cosmetic-shop-clear"
          onClick={() =>
            onChange({
              cosmeticFrame: "",
              cosmeticAvatar: "",
              cosmeticEffect: "",
            })
          }
        >
          Tirar tudo
        </button>
      ) : null}
    </div>
  );
}
