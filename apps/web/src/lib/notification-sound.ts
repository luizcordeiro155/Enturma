const preferenceKey = "enturma-notification-sound";
let context: AudioContext | undefined;
let lastPlayed = 0;
const delivered = new Set<string>();
export function notificationSoundEnabled() {
  try {
    return localStorage.getItem(preferenceKey) === "true";
  } catch {
    return false;
  }
}
export function setNotificationSoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem(preferenceKey, String(enabled));
  } catch {}
}
/** Invoke from a user gesture only. Never resume audio from a notification. */
export async function unlockNotificationSound() {
  if (typeof AudioContext === "undefined") return false;
  try {
    if (!context || context.state === "closed") context = new AudioContext();
    if (context.state === "suspended") await context.resume();
    return context.state === "running";
  } catch {
    return false;
  }
}
export function playNotificationSound(test = false, notificationId?: string) {
  if (!test && notificationId && delivered.has(notificationId)) return false;
  if (
    !context ||
    context.state !== "running" ||
    (!test && !notificationSoundEnabled())
  )
    return false;
  if (!test && notificationId) {
    delivered.add(notificationId);
    if (delivered.size > 200)
      delivered.delete(delivered.values().next().value!);
  }
  if (!test && Date.now() - lastPlayed < 1500) return false;
  lastPlayed = Date.now();
  // Original two-note chime, 320 ms, with a quiet envelope and no media download.
  [659.25, 880].forEach((frequency, index) => {
    const oscillator = context!.createOscillator();
    const gain = context!.createGain();
    const start = context!.currentTime + index * 0.09;
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.045, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
    oscillator.connect(gain).connect(context!.destination);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
    oscillator.start(start);
    oscillator.stop(start + 0.23);
  });
  return true;
}
