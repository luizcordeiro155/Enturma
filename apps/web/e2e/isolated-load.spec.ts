import { test } from "./student-fixture";
import { expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";

test("bounded isolated load: public catalog and authenticated account reads", async ({
  request,
}, info) => {
  const origin = new URL(process.env.E2E_API_URL ?? "http://localhost:8080");
  if (!["127.0.0.1", "localhost"].includes(origin.hostname))
    throw Error("Load testing requires a loopback API, never production");
  // student-fixture also enforces loopback PostgreSQL /enturma_e2e before registration.
  const suffix = randomUUID().slice(0, 8);
  const registration = await request.post(
    `${origin.origin}/api/v1/auth/register`,
    {
      data: {
        name: "Load fixture",
        username: `load_${suffix}`,
        email: `load_${suffix}@example.test`,
        password: "Isolated-load-password-123",
        device: "Isolated load",
      },
    },
  );
  expect(registration.ok()).toBe(true);
  const token = (await registration.json()).accessToken as string;
  const phases = [];
  for (const concurrency of [1, 4, 12]) {
    const durations: number[] = [];
    const codes: Record<number, number> = {};
    let next = 0;
    const started = performance.now();
    await Promise.all(
      Array.from({ length: concurrency }, async () => {
        while (next < 48) {
          const index = next++;
          const then = performance.now();
          const response = await request.get(
            `${origin.origin}/api/v1${index % 2 ? "/me" : "/catalog/institutions"}`,
            { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 },
          );
          await response.body();
          durations.push(performance.now() - then);
          codes[response.status()] = (codes[response.status()] ?? 0) + 1;
          await response.dispose();
        }
      }),
    );
    durations.sort((a, b) => a - b);
    phases.push({
      concurrency,
      requests: durations.length,
      elapsedMs: Math.round(performance.now() - started),
      p50Ms: Math.round(durations[23]),
      p95Ms: Math.round(durations[45]),
      maxMs: Math.round(durations.at(-1)!),
      statusCodes: codes,
    });
  }
  await writeFile(
    info.outputPath("isolated-load.json"),
    JSON.stringify(
      {
        scope:
          "Ephemeral local CI. 144 reads, 1 synthetic account. Not a production capacity/SLA claim; no AI/media/provider load.",
        phases,
      },
      null,
      2,
    ),
  );
  for (const phase of phases) {
    expect(phase.statusCodes).toEqual({ 200: 48 });
    expect(phase.p95Ms).toBeLessThan(5000);
  }
});
