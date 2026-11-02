// Render the real component outside Playwright's JSX instrumentation.
import { createServer } from "vite";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
const server = await createServer({
  configFile: false,
  server: { middlewareMode: true },
  resolve: { alias: { "@": resolve("src") } },
  logLevel: "silent",
});
try {
  const { ScreenShareDialog } = await server.ssrLoadModule(
    "/src/components/screen-share-dialog.tsx",
  );
  const noop = () => {};
  process.stdout.write(
    renderToStaticMarkup(
      createElement(ScreenShareDialog, {
        resolution: "1440p",
        fps: 60,
        audio: false,
        noiseSuppression: true,
        sharing: false,
        busy: false,
        error: "",
        onResolution: noop,
        onFps: noop,
        onAudio: noop,
        onNoiseSuppression: noop,
        onClose: noop,
        onShare: noop,
      }),
    ),
  );
} finally {
  await server.close();
}
