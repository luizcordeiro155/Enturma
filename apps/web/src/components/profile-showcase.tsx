"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Award,
  ArrowUp,
  ArrowDown,
  Star,
  LockKeyhole,
  Target,
  Code2,
  FolderGit2,
  School,
  Trash2,
} from "lucide-react";
import { AchievementArt } from "./achievement-art";
import { api } from "@/lib/api";
import type { ProfileVisualAppearance } from "@enturma/contracts";
export type Achievement = {
  code: string;
  name: string;
  description: string;
  icon?: string;
  category?: string;
  tier: string;
  xp: number;
  requirement: number;
  progress: number;
  earnedAt?: string;
};
export type Widget = {
  kind: string;
  visible: boolean;
  favorite: boolean;
  content?: {
    name?: string;
    title?: string;
    game?: string;
    id?: string;
    username?: string;
  }[];
};
export type Showcase = {
  appearance: ProfileVisualAppearance & {
    goal: string;
    technologies: string;
    projects: string;
  };
  privacy?: Record<string, boolean>;
  widgets: Widget[];
  badges?: { code: string }[];
  achievements?: Achievement[];
  stats?: {
    totalXp: number;
    level: number;
    currentStreak: number;
    studyMinutes: number;
  };
  academic?: { course: string; period: string; institution: string }[];
  joinedAt?: string;
};
export const WIDGET_NAMES: Record<string, string> = {
  SUBJECTS: "Matérias favoritas",
  GOAL: "Objetivo da semana",
  STREAK: "Sequência de estudos",
  ACHIEVEMENTS: "Conquistas",
  NOTEBOOKS: "Cadernos de estudo",
  POSTS: "Publicações",
  ROOMS: "Salas frequentadas",
  HOURS: "Tempo em companhia",
  PROJECTS: "Projetos",
  PORTFOLIO: "Portfólio acadêmico",
  TECHNOLOGIES: "Tecnologias",
  ACADEMIC: "Vida acadêmica",
  MINIGAMES: "Desafios concluídos",
};
const PRIVACY_NAMES: Record<string, string> = {
  ACADEMIC: "Instituição, curso e matérias",
  STATS: "XP, sequência e tempo de estudo",
  ACHIEVEMENTS: "Conquistas e insígnias",
  JOINED: "Data de entrada",
  WIDGETS: "Widgets e textos do mural",
  ACTIVITY: "Atividade de estudo e jogos (nunca ligações privadas)",
};

function achievementTierClass(tier?: string) {
  return `tier-${(tier ?? "BRONZE").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

/** One open achievement across the profile, including older WebViews. */
function AchievementDisclosure({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node))
        ref.current.open = false;
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);
  return (
    <details
      ref={ref}
      className={className}
      name="enturma-achievement"
      data-achievement-disclosure
      onToggle={(event) => {
        const current = event.currentTarget;
        setOpen(current.open);
        if (current.open)
          document
            .querySelectorAll<HTMLDetailsElement>(
              "details[data-achievement-disclosure][open]",
            )
            .forEach((other) => {
              if (other !== current) other.open = false;
            });
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && event.currentTarget.open) {
          event.preventDefault();
          event.stopPropagation();
          event.currentTarget.open = false;
          event.currentTarget.querySelector("summary")?.focus();
        }
      }}
    >
      {children}
    </details>
  );
}

export function FeaturedAchievementBadges({
  showcase,
}: {
  showcase?: Showcase;
}) {
  const achievements = (showcase?.badges ?? [])
    .map((badge) =>
      showcase?.achievements?.find(
        (achievement) => achievement.code === badge.code,
      ),
    )
    .filter((achievement): achievement is Achievement => Boolean(achievement));

  if (!achievements.length) return null;

  return (
    <div
      className="profile-handle-achievements"
      aria-label="Conquistas em destaque"
    >
      {achievements.map((achievement) => {
        return (
          <AchievementDisclosure
            className={`profile-achievement-badge ${achievementTierClass(achievement.tier)}`}
            key={achievement.code}
          >
            <summary
              aria-label={`Conquista: ${achievement.name}`}
              data-tooltip={achievement.name}
            >
              <AchievementArt code={achievement.code} size={24} />
            </summary>
            <div className="profile-achievement-popover">
              <span className="profile-achievement-popover-icon">
                <AchievementArt code={achievement.code} size={48} />
              </span>
              <div>
                <strong>{achievement.name}</strong>
                <small>
                  {achievement.tier} · {achievement.xp} XP
                </small>
                <p>{achievement.description}</p>
                {achievement.earnedAt ? (
                  <small>
                    Conquistada em{" "}
                    {new Date(achievement.earnedAt).toLocaleDateString("pt-BR")}
                  </small>
                ) : null}
              </div>
            </div>
          </AchievementDisclosure>
        );
      })}
    </div>
  );
}

export function ShowcaseFields({
  value,
  onChange,
  group,
}: {
  group?: "appearance" | "privacy" | "widgets" | "badges";
  value: Showcase;
  onChange: (s: Showcase) => void;
}) {
  const appearance = (key: string, v: string) =>
    onChange({ ...value, appearance: { ...value.appearance, [key]: v } });
  const update = (index: number, patch: Partial<Widget>) =>
    onChange({
      ...value,
      widgets: value.widgets.map((w, i) =>
        i === index ? { ...w, ...patch } : w,
      ),
    });
  const move = (index: number, direction: number) => {
    const widgets = [...value.widgets];
    [widgets[index], widgets[index + direction]] = [
      widgets[index + direction],
      widgets[index],
    ];
    onChange({ ...value, widgets });
  };
  return (
    <>
      {(!group || group === "appearance") && (
        <fieldset className="showcase-fields">
          <legend>Tema e mural</legend>
          <label>
            Cor secundária
            <input
              type="color"
              value={value.appearance.secondaryColor}
              onChange={(e) => appearance("secondaryColor", e.target.value)}
            />
          </label>
          <label>
            Fundo decorativo
            <select
              value={value.appearance.theme}
              onChange={(e) => appearance("theme", e.target.value)}
            >
              <option value="SOLID">Cor sólida</option>
              <option value="GRADIENT">Degradê</option>
            </select>
          </label>
          <label>
            Efeito
            <select
              value={value.appearance.effect}
              onChange={(e) => appearance("effect", e.target.value)}
            >
              <option value="NONE">Sem efeito</option>
              <option value="AURORA">Aurora</option>
              <option value="DOTS">Constelação</option>
            </select>
          </label>
          <label>
            Ordem do perfil
            <select
              value={value.appearance.layout}
              onChange={(e) => appearance("layout", e.target.value)}
            >
              <option value="IDENTITY_FIRST">Identidade primeiro</option>
              <option value="WIDGETS_FIRST">Mural primeiro</option>
            </select>
          </label>
          <label>
            Fundo do mural
            <select
              value={value.appearance.muralMode ?? "DEFAULT"}
              onChange={(e) => appearance("muralMode", e.target.value)}
            >
              <option value="PROFILE">Continuar as cores do perfil</option>
              <option value="DEFAULT">Padrão do aplicativo</option>
              <option value="CUSTOM">Cores próprias do mural</option>
            </select>
          </label>
          {value.appearance.muralMode === "CUSTOM" ? (
            <>
              <label>
                Cor principal do mural
                <input
                  type="color"
                  value={value.appearance.muralColor ?? "#18243d"}
                  onChange={(e) => appearance("muralColor", e.target.value)}
                />
              </label>
              <label>
                Segunda cor do mural
                <input
                  type="color"
                  value={value.appearance.muralSecondaryColor ?? "#661245"}
                  onChange={(e) =>
                    appearance("muralSecondaryColor", e.target.value)
                  }
                />
              </label>
            </>
          ) : null}
          <label>
            Direção do degradê · {value.appearance.gradientAngle ?? 155}°
            <input
              type="range"
              min="0"
              max="360"
              value={value.appearance.gradientAngle ?? 155}
              onChange={(e) =>
                onChange({
                  ...value,
                  appearance: {
                    ...value.appearance,
                    gradientAngle: Number(e.target.value),
                  },
                })
              }
            />
          </label>
          <label>
            Movimento das cores
            <select
              value={value.appearance.gradientFlow ?? "STILL"}
              onChange={(e) => appearance("gradientFlow", e.target.value)}
            >
              <option value="STILL">Parado</option>
              <option value="FLOW">Rio de cores</option>
            </select>
          </label>
          {(
            [
              ["goal", "Objetivo da semana", 200],
              ["technologies", "Tecnologias que estudo", 200],
              ["projects", "Projetos e portfólio", 1000],
            ] as const
          ).map(([key, label, max]) => (
            <label key={key}>
              {label}
              <textarea
                aria-label={label}
                value={value.appearance[key]}
                maxLength={max}
                onChange={(e) => appearance(key, e.target.value)}
              />
            </label>
          ))}
        </fieldset>
      )}
      {(!group || group === "privacy") && (
        <fieldset className="showcase-fields">
          <legend>
            <LockKeyhole size={18} /> Privacidade do perfil
          </legend>
          <p>
            Você sempre vê seus dados. Escolha o que outras pessoas podem
            visualizar.
          </p>
          {Object.entries(PRIVACY_NAMES).map(([key, label]) => (
            <label className="check-row" key={key}>
              <input
                type="checkbox"
                checked={value.privacy?.[key] ?? false}
                onChange={(e) =>
                  onChange({
                    ...value,
                    privacy: { ...value.privacy, [key]: e.target.checked },
                  })
                }
              />
              {label}
            </label>
          ))}
        </fieldset>
      )}
      {(!group || group === "widgets") && (
        <fieldset className="showcase-fields">
          <legend>Widgets · {value.widgets.length}/8</legend>
          {value.widgets.map((w, index) => (
            <div className="widget-editor-row" key={w.kind}>
              <strong>{WIDGET_NAMES[w.kind]}</strong>
              <div className="actions">
                <label>
                  <input
                    type="checkbox"
                    checked={w.visible}
                    onChange={(e) =>
                      update(index, { visible: e.target.checked })
                    }
                  />
                  Mostrar
                </label>
                <button
                  type="button"
                  className="icon-control"
                  aria-label={`Favoritar ${WIDGET_NAMES[w.kind]}`}
                  aria-pressed={w.favorite}
                  onClick={() => update(index, { favorite: !w.favorite })}
                >
                  <Star size={16} />
                </button>
                <button
                  type="button"
                  className="icon-control"
                  disabled={index === 0}
                  aria-label="Mover para cima"
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  className="icon-control"
                  disabled={index === value.widgets.length - 1}
                  aria-label="Mover para baixo"
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  type="button"
                  className="profile-remove-button"
                  onClick={() =>
                    onChange({
                      ...value,
                      widgets: value.widgets.filter((_, i) => i !== index),
                    })
                  }
                >
                  <Trash2 size={16} /> Remover
                </button>
              </div>
            </div>
          ))}
          <label>
            Adicionar widget
            <select
              value=""
              disabled={value.widgets.length >= 8}
              onChange={(e) => {
                if (e.target.value)
                  onChange({
                    ...value,
                    widgets: [
                      ...value.widgets,
                      { kind: e.target.value, visible: true, favorite: false },
                    ],
                  });
              }}
            >
              <option value="">Selecione…</option>
              {Object.entries(WIDGET_NAMES)
                .filter(([key]) => !value.widgets.some((w) => w.kind === key))
                .map(([key, name]) => (
                  <option value={key} key={key}>
                    {name}
                  </option>
                ))}
            </select>
          </label>
        </fieldset>
      )}
      {(!group || group === "badges") && (
        <fieldset className="showcase-fields">
          <legend>Insígnias em destaque · {value.badges?.length ?? 0}/4</legend>
          {value.achievements
            ?.filter((a) => a.earnedAt)
            .map((a) => (
              <label className="check-row" key={a.code}>
                <input
                  type="checkbox"
                  checked={
                    value.badges?.some((b) => b.code === a.code) ?? false
                  }
                  disabled={
                    !value.badges?.some((b) => b.code === a.code) &&
                    (value.badges?.length ?? 0) >= 4
                  }
                  onChange={(e) =>
                    onChange({
                      ...value,
                      badges: e.target.checked
                        ? [...(value.badges ?? []), { code: a.code }]
                        : (value.badges ?? []).filter((b) => b.code !== a.code),
                    })
                  }
                />
                {a.name}
              </label>
            ))}
          {!value.achievements?.some((a) => a.earnedAt) && (
            <p>Conclua atividades para desbloquear suas primeiras insígnias.</p>
          )}
        </fieldset>
      )}
    </>
  );
}
export function ShowcaseView({
  value,
  showBadges = true,
  compact = false,
  detailed = false,
}: {
  value: Showcase;
  showBadges?: boolean;
  compact?: boolean;
  detailed?: boolean;
}) {
  const earnedAchievements =
    value.achievements?.filter((achievement) => achievement.earnedAt) ?? [];
  const advancedHighlights = [
    {
      key: "GOAL",
      title: "Objetivo da semana",
      text: value.appearance.goal?.trim(),
      Icon: Target,
    },
    {
      key: "TECHNOLOGIES",
      title: "Tecnologias",
      text: value.appearance.technologies?.trim(),
      Icon: Code2,
    },
    {
      key: "PROJECTS",
      title: "Projetos e portfólio",
      text: value.appearance.projects?.trim(),
      Icon: FolderGit2,
    },
  ].filter((item) => Boolean(item.text));

  const summarizedKinds = new Set([
    "GOAL",
    "TECHNOLOGIES",
    "PROJECTS",
    "STREAK",
    "HOURS",
    "ACADEMIC",
    "ACHIEVEMENTS",
  ]);

  return (
    <div
      className={`profile-showcase${compact ? " profile-showcase-compact" : ""}${detailed ? " profile-showcase-detailed" : ""}`}
    >
      {showBadges ? (
        <div className="badge-row">
          {value.badges?.map((b) => {
            const a = value.achievements?.find((a) => a.code === b.code);
            if (!a) return null;
            return (
              <AchievementDisclosure
                className={`badge-detail ${achievementTierClass(a.tier)}`}
                key={b.code}
              >
                <summary>
                  <AchievementArt code={a.code} size={32} />
                  {a.name}
                </summary>
                <div className="badge-description">
                  <strong>
                    {a.name} · {a.tier}
                  </strong>
                  <p>{a.description}</p>
                  <p>
                    {Math.min(a.requirement, a.progress)}/{a.requirement} ·{" "}
                    {a.xp} XP
                  </p>
                  {a.earnedAt && (
                    <small>
                      Recebida em{" "}
                      {new Date(a.earnedAt).toLocaleDateString("pt-BR")}
                    </small>
                  )}
                </div>
              </AchievementDisclosure>
            );
          })}
        </div>
      ) : null}
      {value.stats && (
        <div className="profile-stat-row">
          <span>Nível {value.stats.level}</span>
          <span>{value.stats.totalXp} XP</span>
          <span>{value.stats.currentStreak} dias de sequência</span>
        </div>
      )}
      {value.joinedAt && (
        <small>
          Membro desde {new Date(value.joinedAt).toLocaleDateString("pt-BR")}
        </small>
      )}

      {detailed && advancedHighlights.length ? (
        <div className="profile-advanced-highlights">
          {advancedHighlights.map(({ key, title, text, Icon }) => (
            <article className="profile-advanced-highlight" key={key}>
              <span className="profile-advanced-highlight-icon">
                <Icon size={18} />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {detailed && value.academic?.length ? (
        <article className="profile-advanced-academic">
          <span className="profile-advanced-highlight-icon">
            <School size={18} />
          </span>
          <div>
            <h3>Vida acadêmica</h3>
            {value.academic.map((academic, index) => (
              <p key={index}>
                <strong>{academic.course}</strong>
                {academic.period ? ` · ${academic.period}` : ""}
                <br />
                {academic.institution}
              </p>
            ))}
          </div>
        </article>
      ) : null}

      {detailed && earnedAchievements.length ? (
        <section className="profile-advanced-achievements">
          <div className="profile-advanced-section-heading">
            <Award size={18} />
            <div>
              <h3>Conquistas</h3>
              <small>{earnedAchievements.length} desbloqueadas</small>
            </div>
          </div>
          <AchievementGrid achievements={earnedAchievements} />
        </section>
      ) : null}

      <div className="showcase-grid">
        {value.widgets
          .filter(
            (w) => w.visible && (!detailed || !summarizedKinds.has(w.kind)),
          )
          .map((w) => (
            <article
              key={w.kind}
              className={`showcase-widget ${w.favorite ? "favorite" : ""}`}
            >
              <h3>
                {w.favorite && <Star size={16} />} {WIDGET_NAMES[w.kind]}
              </h3>
              {w.kind === "PORTFOLIO" ? (
                w.content?.[0]?.username ? (
                  <Link
                    className="profile-portfolio-link"
                    href={`/p/${encodeURIComponent(w.content[0].username)}`}
                  >
                    <strong>{w.content[0].title}</strong>
                    <span>Ver projetos, trabalhos e documentos ↗</span>
                  </Link>
                ) : (
                  <p className="muted">
                    Publique seu portfólio no Enturma para exibi-lo aqui.
                  </p>
                )
              ) : w.kind === "GOAL" ? (
                <p>{value.appearance.goal || "Objetivo ainda não definido."}</p>
              ) : w.kind === "PROJECTS" ? (
                <p>
                  {value.appearance.projects || "Nenhum projeto adicionado."}
                </p>
              ) : w.kind === "TECHNOLOGIES" ? (
                <p>{value.appearance.technologies || "Em descoberta."}</p>
              ) : w.kind === "STREAK" ? (
                <p>{value.stats?.currentStreak ?? 0} dias seguidos</p>
              ) : w.kind === "HOURS" ? (
                <p>{value.stats?.studyMinutes ?? 0} minutos em companhia</p>
              ) : w.kind === "ACADEMIC" ? (
                value.academic?.map((a, i) => (
                  <p key={i}>
                    {a.course} · {a.period}
                    <br />
                    {a.institution}
                  </p>
                ))
              ) : w.kind === "ACHIEVEMENTS" ? (
                <AchievementGrid
                  achievements={
                    value.achievements?.filter((a) => a.earnedAt) ?? []
                  }
                />
              ) : w.content?.length ? (
                w.content.map((item, i) => (
                  <p key={i}>
                    {w.kind === "POSTS" && item.id ? (
                      <Link href={`/forum/${item.id}`}>{item.title}</Link>
                    ) : (
                      (item.name ?? item.title ?? item.game)
                    )}
                  </p>
                ))
              ) : (
                <p className="muted">As próximas atividades aparecerão aqui.</p>
              )}
            </article>
          ))}
      </div>
    </div>
  );
}
export function AchievementGrid({
  achievements,
}: {
  achievements: Achievement[];
}) {
  return (
    <div className="achievement-grid">
      {achievements.map((a) => {
        return (
          <AchievementDisclosure
            className={`achievement-card ${a.earnedAt ? "earned" : ""} ${achievementTierClass(a.tier)}`}
            key={a.code}
          >
            <summary
              className="achievement-card-summary"
              aria-label={`Ver detalhes da conquista ${a.name}`}
            >
              <span className="achievement-card-icon">
                <AchievementArt code={a.code} />
              </span>
              <span className="achievement-card-heading">
                <strong>{a.name}</strong>
                <small>
                  {a.tier} · {a.xp} XP
                </small>
              </span>
            </summary>
            <div className="achievement-card-details">
              <p>{a.description}</p>
              {a.earnedAt ? (
                <p>
                  Recebida em {new Date(a.earnedAt).toLocaleDateString("pt-BR")}
                </p>
              ) : (
                <>
                  <progress
                    max={a.requirement}
                    value={Math.min(a.requirement, a.progress)}
                  />
                  <small>
                    {Math.min(a.requirement, a.progress)}/{a.requirement}
                  </small>
                </>
              )}
            </div>
          </AchievementDisclosure>
        );
      })}
    </div>
  );
}
export function PublicShowcase({ userId }: { userId: string }) {
  const [value, setValue] = useState<Showcase>();
  useEffect(() => {
    let live = true;
    api<Showcase>(`/users/${userId}/showcase`)
      .then((s) => {
        if (live) setValue(s);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [userId]);
  return value ? <ShowcaseView value={value} /> : null;
}
