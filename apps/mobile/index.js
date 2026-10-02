/* Enturma Mobile bootstrap.
 *
 * Keep startup free of optional realtime/call native modules. Those are loaded
 * only when the user explicitly starts a call, so a device-specific WebRTC
 * problem can never prevent the rest of Enturma from opening.
 */
require("expo-router/entry");
