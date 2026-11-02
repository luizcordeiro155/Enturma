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
  const { VoiceCallControls } = await server.ssrLoadModule(
    "/src/components/voice-call-controls.tsx",
  );
  const noop = () => {};
  process.stdout.write(
    renderToStaticMarkup(
      createElement(VoiceCallControls, {
        deafened: true,
        muted: true,
        camera: true,
        cameraSwitchBusy: false,
        canSwitchCamera: true,
        mobile: process.argv.includes("--mobile"),
        screen: false,
        screenSettingsOpen: false,
        screenSupported: true,
        screenBusy: false,
        onDeafen: noop,
        onMicrophone: noop,
        onCamera: noop,
        onSwitchCamera: noop,
        onSettings: noop,
        onShare: noop,
        onLeave: noop,
      }),
    ),
  );
} finally {
  await server.close();
}
