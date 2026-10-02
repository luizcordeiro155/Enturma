/* Enturma Mobile bootstrap.
 *
 * Native realtime dependencies must be initialized before Expo Router loads
 * any route that imports LiveKit. Keeping this entry tiny also lets the app
 * continue opening if realtime initialization fails on a specific device.
 */

if (typeof globalThis.DOMException === "undefined") {
  globalThis.DOMException = class DOMException extends Error {
    constructor(message = "", name = "Error") {
      super(message);
      this.name = name;
    }
  };
}

try {
  const { registerGlobals } = require("@livekit/react-native");
  registerGlobals();
} catch (error) {
  globalThis.__ENTURMA_LIVEKIT_BOOT_ERROR__ =
    error instanceof Error ? error.message : String(error);
}

require("expo-router/entry");
