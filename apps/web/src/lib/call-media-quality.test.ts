import { describe, expect, it } from "vitest";
import { cameraCapture, microphoneCapture, screenShareOptions } from "./call-media-quality";
describe("call quality presets", () => {
 it("suppresses noise and echo by default", () => { expect(microphoneCapture().noiseSuppression).toBe(true); expect(microphoneCapture().echoCancellation).toBe(true); expect(microphoneCapture(false).noiseSuppression).toBe(false); });
 it("requests full HD camera capture", () => { expect(cameraCapture.resolution).toMatchObject({ width:1920,height:1080,frameRate:30 }); });
 it("configures upload quality as well as screen capture", () => { const quality = screenShareOptions("1440p",60); expect(quality.capture.resolution).toMatchObject({width:2560,height:1440,frameRate:60}); expect(quality.publish.screenShareEncoding?.maxBitrate).toBeGreaterThan(6000000); });
});
