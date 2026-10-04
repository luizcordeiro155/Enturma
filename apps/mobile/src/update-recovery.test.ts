import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(
  resolve(process.cwd(), "../../deploy/android-download/install-web-shell.cjs"),
  "utf8",
);

describe("Android update recovery", () => {
  it("reuses pending/running downloads and completed APKs", () => {
    expect(source).toContain("DownloadManager.STATUS_PENDING");
    expect(source).toContain("DownloadManager.STATUS_RUNNING");
    expect(source).toContain("DownloadManager.STATUS_PAUSED");
    expect(source).toContain("DownloadManager.STATUS_SUCCESSFUL");
    expect(source).toContain("openDownloadedInstaller(downloaded, previousId, true)");
  });

  it("recovers after permission flow, app pause and process restart without polling", () => {
    expect(source).toContain("pendingUpdateUrl = downloadUrl");
    expect(source).toContain("override fun onResume()");
    expect(source).toContain("maybeOpenCompletedUpdate()");
    expect(source).toContain("EnturmaDownloadCompleteReceiver");
    expect(source).not.toContain("fun watchUpdateDownload(downloadId: Long)");
  });

  it("allows a failed download to fall through into a clean second attempt", () => {
    expect(source).toContain("updateDownloadId = manager.enqueue");
    expect(source).toContain("PREF_DOWNLOAD_BASE_VERSION");
    expect(source).toContain("PREF_INSTALL_PROMPTED_ID");
  });
});
