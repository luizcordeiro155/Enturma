import { expect, test } from "vitest";
import { describeClient } from "./session-client";

const CHROME_WIN =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36";

test("names the platform and the browser of a session", () => {
  expect(describeClient(CHROME_WIN)).toEqual({ platform: "web", name: "Chrome no Windows" });
  expect(describeClient(`${CHROME_WIN} Edg/142.0.0.0`)).toEqual({
    platform: "web",
    name: "Edge no Windows",
  });
  expect(
    describeClient(
      "Mozilla/5.0 (Linux; Android 15; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0 Mobile Safari/537.36 EnturmaMobile/0.4.620",
    ),
  ).toEqual({ platform: "android", name: "Android" });
  expect(describeClient(`${CHROME_WIN} Electron/38.0.0 EnturmaDesktop/0.4.620`)).toEqual({
    platform: "desktop",
    name: "Windows",
  });
  expect(
    describeClient(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
    ),
  ).toEqual({ platform: "web", name: "Safari no iPhone" });
  expect(describeClient("Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0")).toEqual({
    platform: "web",
    name: "Firefox no Linux",
  });
  expect(describeClient(null)).toEqual({ platform: "web", name: "Navegador" });
});
