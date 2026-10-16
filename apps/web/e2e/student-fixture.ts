import { test as base } from "@playwright/test";
import pg from "pg";

/** Only feature suites opt into this fixture. Academic/auth tests use unmodified Playwright. */
export const test = base.extend({
  request: async ({ request }, runFixture) => {
    const backend = new URL(process.env.E2E_API_URL ?? "http://localhost:8080");
    const connection = process.env.E2E_DATABASE_URL;
    if (!connection)
      throw new Error("Feature E2E requires an isolated E2E_DATABASE_URL");
    const address = new URL(connection);
    if (
      !["localhost", "127.0.0.1"].includes(address.hostname) ||
      address.pathname !== "/enturma_e2e" ||
      !["localhost", "127.0.0.1"].includes(backend.hostname)
    )
      throw new Error("Student fixtures are restricted to local enturma_e2e");
    const db = new pg.Client({ connectionString: connection });
    await db.connect();
    try {
      await runFixture(
        new Proxy(request, {
          get(target, name) {
            if (name === "post")
              return async (...args: Parameters<typeof request.post>) => {
                const result = await target.post(...args);
                const url = new URL(args[0], backend);
                if (
                  result.ok() &&
                  url.origin === backend.origin &&
                  url.pathname === "/api/v1/auth/register"
                ) {
                  const email = (args[1]?.data as { email?: string })?.email;
                  if (!email)
                    throw new Error(
                      "Student fixture requires explicit account email",
                    );
                  const updated = await db.query(
                    "UPDATE academic_identity SET status='STUDENT_VERIFIED',method='TEST_FIXTURE',confidence='TEST_FIXTURE' WHERE user_id=(SELECT id FROM app_user WHERE email=lower($1)) AND status='PENDING'",
                    [email],
                  );
                  if (updated.rowCount !== 1)
                    throw new Error(
                      "Student fixture did not approve exactly one new test account",
                    );
                }
                return result;
              };
            const value = Reflect.get(target, name);
            return typeof value === "function" ? value.bind(target) : value;
          },
        }),
      );
    } finally {
      await db.end();
    }
  },
});
