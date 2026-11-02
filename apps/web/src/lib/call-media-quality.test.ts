import { describe, expect, it } from "vitest";
import {
  cameraCapture,
  nextCameraCapture,
  microphoneCapture,
  screenShareOptions,
} from "./call-media-quality";
describe("call quality presets", () => {
  it("captures computer audio only with explicit opt-in", () => {
    expect(screenShareOptions("1080p", 30).capture.audio).toBe(false);
    expect(screenShareOptions("1080p", 30, true).capture.audio).toBe(true);
  });
  it("suppresses noise and echo by default", () => {
    expect(microphoneCapture().noiseSuppression).toBe(true);
    expect(microphoneCapture().echoCancellation).toBe(true);
    expect(microphoneCapture(false).noiseSuppression).toBe(false);
  });
  it("requests full HD camera capture", () => {
    expect(cameraCapture.resolution).toMatchObject({
      width: 1920,
      height: 1080,
      frameRate: 30,
    });
  });
  it("configures upload quality as well as screen capture", () => {
    const quality = screenShareOptions("1440p", 60);
    expect(quality.capture.resolution).toMatchObject({
      width: 2560,
      height: 1440,
      frameRate: 60,
    });
    expect(quality.publish.screenShareEncoding?.maxBitrate).toBeGreaterThan(
      6000000,
    );
  });
});

it("flips directly between front and rear on phones with several rear lenses", () => {
  const devices = [
    { deviceId: "wide", label: "Back wide" },
    { deviceId: "tele", label: "Back telephoto" },
    { deviceId: "selfie", label: "Front" },
  ];
  expect(nextCameraCapture({ deviceId: "wide", facingMode: "environment" }, devices)).toMatchObject({ facingMode: "user", deviceId: undefined });
  expect(nextCameraCapture({ deviceId: "selfie", facingMode: "user" }, devices)).toMatchObject({ facingMode: "environment", deviceId: undefined });
  expect(nextCameraCapture({ deviceId: "wide" }, devices).deviceId).toEqual({ exact: "tele" });
});
