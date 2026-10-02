import {
  AudioSession,
  registerGlobals,
} from "@livekit/react-native";
import { Room, RoomEvent } from "livekit-client";

let initialized = false;

function ensureGlobals() {
  if (initialized) return;
  registerGlobals();
  initialized = true;
}

export async function createRoom(
  onDisconnected?: () => void,
): Promise<Room> {
  ensureGlobals();
  const room = new Room({
    adaptiveStream: { pixelDensity: "screen" },
    dynacast: true,
  });
  if (onDisconnected) room.on(RoomEvent.Disconnected, onDisconnected);
  return room;
}

export function observeDisconnect(room: Room, callback: () => void) {
  room.on(RoomEvent.Disconnected, callback);
  return () => room.off(RoomEvent.Disconnected, callback);
}

export async function connectRoom(room: Room, url: string, token: string) {
  ensureGlobals();
  await AudioSession.startAudioSession();
  try {
    await room.connect(url, token);
  } catch (error) {
    await AudioSession.stopAudioSession().catch(() => {});
    throw error;
  }
}

export async function disposeRoom(room: Room) {
  try {
    await room.disconnect();
  } finally {
    await AudioSession.stopAudioSession().catch(() => {});
  }
}
