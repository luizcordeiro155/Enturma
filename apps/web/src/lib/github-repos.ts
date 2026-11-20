import {
  githubAddress,
  MAX_TECHNOLOGIES,
  type Project,
} from "./portfolio-projects";

/**
 * Public repository data, read straight from GitHub by the student's browser.
 * No account is connected and no token is sent: only what anyone can already see.
 */
export type GithubRepo = {
  fullName: string;
  name: string;
  description: string;
  url: string;
  homepage: string;
  language: string;
  topics: string[];
  stars: number;
  fork: boolean;
  archived: boolean;
  pushedAt: string;
};

export class GithubError extends Error {
  constructor(
    readonly reason: "missing" | "limited" | "offline",
    message: string,
  ) {
    super(message);
    this.name = "GithubError";
  }
}

type Fetcher = (url: string, init: RequestInit) => Promise<Response>;

const API = "https://api.github.com";
const LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;

/** "ana", "@ana", "github.com/ana" and a repository address all name the user "ana". */
export function githubLogin(input: string) {
  let text = input.trim().replace(/^@/, "");
  const address =
    /^(?:https?:\/\/)?(?:www\.)?([^/\s]+\.[^/\s]+)\/([^/\s?#]+)/i.exec(text);
  if (address) {
    if (address[1].toLowerCase() !== "github.com") return null;
    text = address[2];
  }
  return LOGIN.test(text) ? text : null;
}

async function ask(path: string, fetcher: Fetcher) {
  let response: Response;
  try {
    response = await fetcher(API + path, {
      headers: { Accept: "application/vnd.github+json" },
      credentials: "omit",
      cache: "no-store",
    });
  } catch {
    throw new GithubError(
      "offline",
      "Não foi possível falar com o GitHub agora. Confira a conexão e tente de novo.",
    );
  }
  if (response.ok) return response.json() as Promise<unknown>;
  if (response.status === 404)
    throw new GithubError(
      "missing",
      "Não encontramos esse usuário no GitHub. Confira como o nome está escrito.",
    );
  if (response.status === 403 || response.status === 429)
    throw new GithubError(
      "limited",
      "O GitHub limitou as consultas por agora. Tente de novo em alguns minutos.",
    );
  throw new GithubError(
    "offline",
    "O GitHub não respondeu como esperado. Tente de novo em instantes.",
  );
}

const web = (value: unknown) =>
  typeof value === "string" && /^https?:\/\/\S+$/i.test(value.trim())
    ? value.trim()
    : "";

function repo(row: Record<string, unknown>): GithubRepo {
  return {
    fullName: String(row.full_name ?? ""),
    name: String(row.name ?? ""),
    description: String(row.description ?? "").slice(0, 500),
    url: web(row.html_url),
    homepage: web(row.homepage),
    language: String(row.language ?? ""),
    topics: Array.isArray(row.topics) ? row.topics.map(String) : [],
    stars: Number(row.stargazers_count) || 0,
    fork: row.fork === true,
    archived: row.archived === true,
    pushedAt: String(row.pushed_at ?? ""),
  };
}

/** The public repositories this user owns, the most recently worked on first. */
export async function listRepos(login: string, fetcher: Fetcher = fetch) {
  const rows = await ask(
    `/users/${encodeURIComponent(login)}/repos?type=owner&sort=pushed&per_page=100`,
    fetcher,
  );
  return (Array.isArray(rows) ? rows : [])
    .map((row) => repo(row as Record<string, unknown>))
    .filter((entry) => entry.fullName && entry.url);
}

export async function readRepo(fullName: string, fetcher: Fetcher = fetch) {
  return repo(
    (await ask(`/repos/${fullName}`, fetcher)) as Record<string, unknown>,
  );
}

/** Languages by size, the largest first. Never fails: it only enriches a draft. */
export async function repoLanguages(
  fullName: string,
  fetcher: Fetcher = fetch,
) {
  try {
    const sizes = (await ask(
      `/repos/${fullName}/languages`,
      fetcher,
    )) as Record<string, number>;
    return Object.entries(sizes ?? {})
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .map(([name]) => name);
  } catch {
    return [];
  }
}

/** Languages first, then the repository's topics, without saying the same thing twice. */
export function repoTechnologies(source: GithubRepo, languages: string[]) {
  const seen = new Set<string>();
  const labels: string[] = [];
  const main = languages.length ? languages.slice(0, 6) : [source.language];
  for (const label of [...main, ...source.topics]) {
    const key = label.trim().toLowerCase();
    if (!key || seen.has(key) || label.length > 40) continue;
    seen.add(key);
    if (labels.length < MAX_TECHNOLOGIES) labels.push(label.trim());
  }
  return labels;
}

/** A draft from a repository. Nothing is saved until the student saves the portfolio. */
export function projectFromRepo(source: GithubRepo, languages: string[]) {
  const draft: Project = {
    id: crypto.randomUUID(),
    name: source.name.slice(0, 120),
    description: source.description,
    url: web(source.homepage),
    assets: [],
    kind: source.fork ? "OPEN_SOURCE" : "PERSONAL",
    technologies: repoTechnologies(source, languages),
    repoUrl: githubAddress(source.fullName),
    github: {
      fullName: source.fullName,
      stars: source.stars,
      fork: source.fork,
      updatedAt: source.pushedAt,
    },
  };
  return draft;
}
