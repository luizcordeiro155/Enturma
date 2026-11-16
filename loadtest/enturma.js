// Production load test for Enturma: ramps request rate until latency or errors break.
// Run with: k6 run -e SHARDS=5 -e STAGES=10,25,50 loadtest/enturma.js
import http from "k6/http";
import { check } from "k6";
import { Trend } from "k6/metrics";

const WEB = __ENV.WEB || "https://enturma-flax.vercel.app";
const API = __ENV.API || "https://enturma-api.squareweb.app";
const SHARDS = Number(__ENV.SHARDS || 1);
const STAGE_SECONDS = Number(__ENV.STAGE_SECONDS || 60);
// Total requests per second across all shards, one value per stage.
const STAGES = (__ENV.STAGES || "10,25,50,100,200,400,800").split(",").map(Number);

const byName = {};
for (const n of ["api_me", "api_session", "bff_me", "api_explore", "web_home", "web_login", "api_health"])
  byName[n] = new Trend(`latency_${n}`, true);

export const options = {
  scenarios: {
    ramp: {
      executor: "ramping-arrival-rate",
      startRate: Math.max(1, Math.round(STAGES[0] / SHARDS / 2)),
      timeUnit: "1s",
      preAllocatedVUs: 100,
      maxVUs: 3000,
      stages: STAGES.flatMap((rate) => [
        { target: Math.max(1, Math.round(rate / SHARDS)), duration: "10s" },
        { target: Math.max(1, Math.round(rate / SHARDS)), duration: `${STAGE_SECONDS - 10}s` },
      ]),
    },
  },
  // Stop before the service is hurt for long: abort when most requests fail or take seconds.
  thresholds: {
    "http_req_failed{expected:yes}": [
      { threshold: `rate<${__ENV.FAIL_MAX || 0.5}`, abortOnFail: true, delayAbortEval: "20s" },
    ],
    "http_req_duration{expected:yes}": [
      { threshold: `p(95)<${__ENV.P95_MAX || 10000}`, abortOnFail: true, delayAbortEval: "20s" },
    ],
  },
  summaryTrendStats: ["avg", "med", "p(90)", "p(95)", "p(99)", "max"],
  discardResponseBodies: true,
  noCookiesReset: true,
};

// Each shard uses its own throwaway account (pending academic verification, no data) and erases it.
export function setup() {
  const id = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
  const response = http.post(
    `${API}/api/v1/auth/register`,
    JSON.stringify({
      name: "Teste de carga",
      username: `carga_${id}`,
      email: `carga-${id}@example.com`,
      password: `Carga-${id}-Senha-Longa`,
      device: "k6",
    }),
    { headers: { "Content-Type": "application/json" }, responseType: "text" },
  );
  if (response.status !== 201) throw new Error(`register failed ${response.status} ${response.body}`);
  return { token: JSON.parse(response.body).accessToken };
}

const mix = [
  ["api_me", 30],
  ["api_session", 15],
  ["bff_me", 15],
  ["api_explore", 5],
  ["web_home", 15],
  ["web_login", 15],
  ["api_health", 5],
];
const total = mix.reduce((sum, [, w]) => sum + w, 0);

function pick() {
  let r = Math.random() * total;
  for (const [name, w] of mix) if ((r -= w) < 0) return name;
  return mix[0][0];
}

export default function (data) {
  const name = pick();
  const bearer = { Authorization: `Bearer ${data.token}` };
  const tags = { name, expected: "yes" };
  let res;
  switch (name) {
    case "api_me":
      res = http.get(`${API}/api/v1/users/me`, { headers: bearer, tags });
      break;
    case "api_session":
      res = http.get(`${API}/api/v1/auth/session-view`, { headers: bearer, tags });
      break;
    case "bff_me":
      res = http.get(`${WEB}/api/backend/users/me`, {
        headers: { Cookie: `enturma_access=${data.token}` },
        tags,
      });
      break;
    case "api_explore":
      // Rate limited per person on purpose: 429 is the expected answer above 120 per minute.
      res = http.get(`${API}/api/v1/public/explore/forum`, { tags: { name, expected: "limited" } });
      break;
    case "web_home":
      res = http.get(`${WEB}/`, { tags });
      break;
    case "web_login":
      res = http.get(`${WEB}/login`, { tags });
      break;
    default:
      res = http.get(`${API}/actuator/health`, { tags });
  }
  byName[name].add(res.timings.duration);
  if (name === "api_explore") check(res, { "explore answered": (r) => r.status === 200 || r.status === 429 });
  else check(res, { [`${name} ok`]: (r) => r.status >= 200 && r.status < 400 });
}

export function teardown(data) {
  http.del(`${API}/api/v1/account/privacy/deletion/now`, null, {
    headers: { Authorization: `Bearer ${data.token}` },
  });
}
