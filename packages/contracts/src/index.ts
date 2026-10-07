export interface AcademicEntry {
  id: string;
  kind: string;
  parentId: string | null;
  name: string;
  sourceUrl: string;
  sourceName: string;
  status: string;
  workloadHours?: number;
  modality?: string;
  shift?: string;
  curriculumVersion?: string;
  hasCurriculum?: boolean;
  attributes?: {
    note?: string;
    organization?: string;
    catalogNote?: string;
    learningArea?: string;
    workloadHours?: number;
  };
}
export interface CatalogPage {
  items: AcademicEntry[];
  page: number;
  pageSize: number;
  hasMore?: boolean;
}
export async function catalogOptions(
  fetchCatalog: (path: string, options?: RequestInit) => Promise<unknown>,
  query: string,
  options?: RequestInit,
): Promise<CatalogPage> {
  try {
    return (await fetchCatalog(
      `/catalog/onboarding/options?${query}`,
      options,
    )) as CatalogPage;
  } catch (error) {
    if (!(error instanceof ApiError) || ![404, 500].includes(error.status))
      throw error;
    const params = new URLSearchParams(query);
    if (params.get("search")?.trim().toUpperCase() === "ADS")
      params.set("search", "Análise e Desenvolvimento de Sistemas");
    const items = (await fetchCatalog(
      `/academics?${params}`,
      options,
    )) as AcademicEntry[];
    return { items, page: Number(params.get("page") ?? 0), pageSize: 30 };
  }
}
export const academicLabels: Record<string, string> = {
  PRESENTIAL: "Presencial",
  REMOTE: "EAD",
  HYBRID: "Semipresencial",
  MORNING: "Manhã",
  EVENING: "Noite",
  AFTERNOON: "Tarde",
  FULL_TIME: "Integral",
  VARIABLE: "Variável",
};
export interface IdentityStyle {
  hasAvatar?: boolean;
  accentColor?: string;
  profileDetails?: {
    pronouns?: string;
    statusText?: string;
    decoration?: string;
    nameFont?: string;
    website?: string;
    interests?: string;
  };
}
export interface Profile extends IdentityStyle {
  id: string;
  name: string;
  username: string;
  email: string;
  emailVerified: boolean;
  role: string;
  bio?: string | null;
  accentColor?: string;
  hasAvatar?: boolean;
  hasBanner?: boolean;
  enrollment: { periodId: string; periodName: string; shift: string } | null;
  subjects: AcademicEntry[];
}
export type RoomSystemEvent = {
  id: string;
  kind: string;
  message: string;
  name?: string;
  username?: string;
  userId?: string;
  hasAvatar?: boolean;
  createdAt: string;
  subjectName?: string;
  topicText?: string;
  endsAt?: string;
  hostName?: string;
};
export interface Room {
  lifecycle?: "QUICK" | "MULTIDAY";
  topicText?: string;
  entriesLocked?: boolean;
  systemEvents?: RoomSystemEvent[];
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  hostId: string;
  status: string;
  endsAt: string;
  maxParticipants: number;
  participants: number;
  reused?: boolean;
  joinedAt?: string;
  leftAt?: string | null;
  hasEarlierHistory?: boolean;
  members?: (IdentityStyle & {
    userId: string;
    name: string;
    role: string;
    online?: boolean;
    inCall?: boolean;
    camera?: boolean;
    screen?: boolean;
    joinedAt?: string;
    leftAt?: string | null;
  })[];
}
export interface MessageReaction {
  emoji: string;
  count: number;
  mine: boolean;
}
export interface Message extends IdentityStyle {
  reactions?: MessageReaction[];
  id: string;
  userId: string;
  name: string;
  body: string | null;
  createdAt: string;
  editedAt?: string | null;
  deletedAt: string | null;
  replyTo?: string | null;
  attachmentId?: string | null;
  attachmentName?: string | null;
  attachmentMime?: string | null;
  attachmentSize?: number | null;
}
export interface RoomArtifact {
  id: string;
  kind: string;
  title: string;
  content?: string;
  createdAt: string;
}
export interface ExperiencePreference {
  theme: "LIGHT" | "DARK" | "SYSTEM";
  fontScale: number;
  highContrast: boolean;
  reducedMotion: boolean;
  enhancedFocus: boolean;
}
export interface Credentials {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userId: string;
}
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function request<T>(
  base: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    response = await fetch(`${base}${path}`, {
      ...options,
      signal: options.signal ?? controller.signal,
      headers: {
        ...(typeof FormData !== "undefined" && options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      0,
      "Não foi possível conectar. Confira sua internet e tente novamente.",
    );
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      error.message ?? "Não foi possível concluir esta ação.",
    );
  }
  const body = await response.text();
  return body ? (JSON.parse(body) as T) : (undefined as T);
}
