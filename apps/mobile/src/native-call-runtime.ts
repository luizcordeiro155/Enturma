import { AudioSession, registerGlobals } from "@livekit/react-native";
import type { Room } from "livekit-client";

let initialized = false;
let clientPromise: Promise<typeof import("livekit-client")> | null = null;

async function livekit() {
  if (!initialized) {
    registerGlobals();
    initialized = true;
  }
  if (!clientPromise) clientPromise = import("livekit-client");
  return clientPromise;
}

export async function createRoom(
  onDisconnected?: () => void,
): Promise<Room> {
  const { Room, RoomEvent } = await livekit();
  const room = new Room({
    adaptiveStream: { pixelDensity: "screen" },
    dynacast: true,
  });
  if (onDisconnected) room.on(RoomEvent.Disconnected, onDisconnected);
  return room;
}

export async function observeDisconnect(
  room: Room,
  callback: () => void,
) {
  const { RoomEvent } = await livekit();
  room.on(RoomEvent.Disconnected, callback);
  return () => room.off(RoomEvent.Disconnected, callback);
}

export async function connectRoom(room: Room, url: string, token: string) {
  await livekit();
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
