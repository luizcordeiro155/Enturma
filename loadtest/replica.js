// Breaking-point test against a local replica of the production API (see loadtest-replica.yml).
// The request mix replays what a real browser session generates, measured on 16/11/2026 by
// counting API calls from one idle tab (3 min on /home) and one active tab (12 page visits).
import http from "k6/http";
import { WebSocket } from "k6/experimental/websockets";
import { check, sleep } from "k6";
import { SharedArray } from "k6/data";
import { Counter } from "k6/metrics";

const API = __ENV.API_URL || "http://localhost:8080";
const tokens = new SharedArray("tokens", () => JSON.parse(open("./tokens.json")));
const stages = (__ENV.STAGES || "50,100,200").split(",").map(Number);
const stageSeconds = Number(__ENV.STAGE_SECONDS || 45);
const sockets = Number(__ENV.SOCKETS || 0);
const socketOpen = new Counter("ws_opened");

// Weights = calls observed per route in the measured sessions (idle + active).
const MIX = [
  ["/api/v1/calls/private", 64],
  ["/api/v1/auth/session-view", 70],
  ["/api/v1/users/me", 57],
  ["/api/v1/notifications/desktop-push", 23],
  ["/api/v1/messages/pending-delivery", 17],
  ["/api/v1/planner/focus", 17],
  ["/api/v1/study/sessions/due", 14],
  ["/api/v1/social/capabilities", 13],
  ["/api/v1/users/me/experience", 11],
  ["/api/v1/learning/access", 11],
  ["/api/v1/notifications/inbox", 11],
  ["/api/v1/rides/mobility/state", 11],
  ["/api/v1/matches", 11],
  ["/api/v1/social/feed", 5],
  ["/api/v1/study-rooms", 4],
];
const TOTAL = MIX.reduce((s, [, w]) => s + w, 0);

const scenarios = {
  http: {
    executor: "ramping-arrival-rate",
    exec: "browse",
    startTime: sockets > 0 ? "75s" : "0s",
    startRate: stages[0],
    timeUnit: "1s",
    preAllocatedVUs: 200,
    maxVUs: 3000,
    stages: stages.flatMap((rate) => [
      { target: rate, duration: "10s" },
      { target: rate, duration: `${stageSeconds}s` },
    ]),
  },
};
if (sockets > 0)
  scenarios.sockets = {
    executor: "per-vu-iterations",
    exec: "listen",
    vus: sockets,
    iterations: 1,
    maxDuration: `${stages.length * (stageSeconds + 10) + 150}s`,
  };

export const options = {
  scenarios,
  discardResponseBodies: true,
  thresholds: {
    "http_req_failed{scenario:http}": [
      { threshold: `rate<${__ENV.FAIL_MAX || 0.05}`, abortOnFail: true, delayAbortEval: "15s" },
    ],
    "http_req_duration{scenario:http}": [
      { threshold: `p(95)<${__ENV.P95_MAX || 3000}`, abortOnFail: true, delayAbortEval: "15s" },
    ],
  },
};

function pick() {
  let r = Math.random() * TOTAL;
  for (const [route, w] of MIX) if ((r -= w) < 0) return route;
  return MIX[0][0];
}

export function browse() {
  const token = tokens[Math.floor(Math.random() * tokens.length)];
  const route = pick();
  const res = http.get(API + route, {
    headers: { Authorization: `Bearer ${token}` },
    tags: { name: route },
  });
  check(res, { ok: (r) => r.status >= 200 && r.status < 400 });
}

export function listen() {
  // Users come online over a minute; a simultaneous reconnect storm is measured separately.
  sleep(Math.random() * 60);
  const token = tokens[(__VU * 7) % tokens.length];
  const ws = new WebSocket(API.replace("http", "ws") + "/ws", null, {
    headers: { Origin: __ENV.APP_ORIGIN || "http://localhost:3000" },
  });
  ws.onopen = () => {
    socketOpen.add(1);
    ws.send(JSON.stringify({ token, scope: "academic" }));
  };
  ws.onerror = () => {};
  setTimeout(() => ws.close(), (stages.length * (stageSeconds + 10) + 80) * 1000);
}
