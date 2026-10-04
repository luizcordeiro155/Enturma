import type {
  APIRequestContext,
  BrowserContext,
} from "@playwright/test";

type Credentials = {
  accessToken: string;
  refreshToken: string;
};

const webUrl = process.env.E2E_WEB_URL ?? "http://localhost:3000";
const apiUrl = process.env.E2E_API_URL ?? "http://localhost:8080";

export async function authenticate(
  context: BrowserContext,
  credentials: Credentials,
) {
  await context.addCookies([
    {
      name: "enturma_access",
      value: credentials.accessToken,
      url: webUrl,
      httpOnly: true,
      sameSite: "Lax",
    },
    {
      name: "enturma_refresh",
      value: credentials.refreshToken,
      url: webUrl,
      httpOnly: true,
      sameSite: "Lax",
    },
    {
      name: "enturma_remember",
      value: "1",
      url: webUrl,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

export async function authenticateWithPassword(
  context: BrowserContext,
  request: APIRequestContext,
  email: string,
  password: string,
) {
  const response = await request.post(`${apiUrl}/api/v1/auth/login`, {
    data: { email, password, device: "E2E session" },
  });
  if (!response.ok())
    throw new Error(
      `E2E login API failed: ${response.status()} ${await response.text()}`,
    );
  await authenticate(context, await response.json());
}
