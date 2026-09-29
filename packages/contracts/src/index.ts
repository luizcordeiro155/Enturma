export interface AcademicEntry {
  id: string;
  kind: string;
  parentId: string | null;
  name: string;
  sourceUrl: string;
  sourceName: string;
  status: string;
}
export interface Profile {
  id: string;
  name: string;
  username: string;
  email: string;
  emailVerified: boolean;
  role: string;
  enrollment: { periodId: string; periodName: string; shift: string } | null;
  subjects: AcademicEntry[];
}
export interface Room {
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
  members?: { userId: string; name: string; role: string }[];
}
export interface Message {
  id: string;
  userId: string;
  name: string;
  body: string;
  createdAt: string;
  deletedAt: string | null;
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
      headers: { "Content-Type": "application/json", ...options.headers },
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
