"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  ArrowUp,
  ArrowDown,
  Star,
  LockKeyhole,
  Flame,
  CalendarDays,
  Brain,
  Trophy,
  MessageCircle,
  TrendingUp,
  MessagesSquare,
  GraduationCap,
  Users,
  Clock3,
  BookOpen,
  Compass,
  Sparkles,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api";
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
  content?: { name?: string; title?: string; game?: string; id?: string }[];
};
export type Showcase = {
  appearance: {
    secondaryColor: string;
    theme: string;
    effect: string;
    layout: string;
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
};

const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  Flame,
  Calendar: CalendarDays,
  Brain,
  Trophy,
  MessageCircle,
  TrendingUp,
  MessagesSquare,
  GraduationCap,
  Users,
  Clock: Clock3,
  BookOpen,
  Compass,
  Sparkles,
  Shield: ShieldCheck,
};

function achievementIcon(achievement: Achievement) {
  return ACHIEVEMENT_ICONS[achievement.icon ?? ""] ?? Award;
}

function achievementTierClass(tier?: string) {
  return `tier-${(tier ?? "BRONZE").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
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
        const Icon = achievementIcon(achievement);
        return (
          <details
            className={`profile-achievement-badge ${achievementTierClass(achievement.tier)}`}
            key={achievement.code}
          >
            <summary
              aria-label={`Conquista: ${achievement.name}`}
              data-tooltip={achievement.name}
            >
              <Icon size={14} strokeWidth={2.2} />
            </summary>
            <div className="profile-achievement-popover">
              <span className="profile-achievement-popover-icon">
                <Icon size={20} />
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
          </details>
        );
      })}
    </div>
  );
}

export function ShowcaseFields({
  value,
  onChange,
}: {
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
                  onChange={(e) => update(index, { visible: e.target.checked })}
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
                className="text-button"
                onClick={() =>
                  onChange({
                    ...value,
                    widgets: value.widgets.filter((_, i) => i !== index),
                  })
                }
              >
                Remover
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
      <fieldset className="showcase-fields">
        <legend>Insígnias em destaque · {value.badges?.length ?? 0}/4</legend>
        {value.achievements
          ?.filter((a) => a.earnedAt)
          .map((a) => (
            <label className="check-row" key={a.code}>
              <input
                type="checkbox"
                checked={value.badges?.some((b) => b.code === a.code) ?? false}
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
    </>
  );
}
export function ShowcaseView({
  value,
  showBadges = true,
  compact = false,
}: {
  value: Showcase;
  showBadges?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`profile-showcase${compact ? " profile-showcase-compact" : ""}`}>
      {showBadges ? (
        <div className="badge-row">
          {value.badges?.map((b) => {
            const a = value.achievements?.find((a) => a.code === b.code);
            if (!a) return null;
            const Icon = achievementIcon(a);
            return (
              <details
                className={`badge-detail ${achievementTierClass(a.tier)}`}
                key={b.code}
              >
                <summary>
                  <Icon size={20} />
                  {a.name}
                </summary>
                <div className="badge-description">
                  <strong>
                    {a.name} · {a.tier}
                  </strong>
                  <p>{a.description}</p>
                  <p>
                    {Math.min(a.requirement, a.progress)}/{a.requirement} · {a.xp}{" "}
                    XP
                  </p>
                  {a.earnedAt && (
                    <small>
                      Recebida em{" "}
                      {new Date(a.earnedAt).toLocaleDateString("pt-BR")}
                    </small>
                  )}
                </div>
              </details>
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
      <div className="showcase-grid">
        {value.widgets
          .filter((w) => w.visible)
          .map((w) => (
            <article
              key={w.kind}
              className={`showcase-widget ${w.favorite ? "favorite" : ""}`}
            >
              <h3>
                {w.favorite && <Star size={16} />} {WIDGET_NAMES[w.kind]}
              </h3>
              {w.kind === "GOAL" ? (
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
        const Icon = achievementIcon(a);
        return (
        <article
          className={`achievement-card ${a.earnedAt ? "earned" : ""} ${achievementTierClass(a.tier)}`}
          key={a.code}
          title={a.description}
        >
          <span className="achievement-card-icon">
            <Icon />
          </span>
          <div>
            <strong>{a.name}</strong>
            <p>{a.description}</p>
            <small>
              {a.tier} · {a.xp} XP
            </small>
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
        </article>
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
