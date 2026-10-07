let device: string | undefined;
/** Per-tab identity keeps an accepted call from opening every logged-in device's microphone. */
export function callDevice() {
  if (device) return device;
  try {
    device = sessionStorage.getItem("enturma-call-device") ?? undefined;
  } catch {}
  device ??= crypto.randomUUID();
  try {
    sessionStorage.setItem("enturma-call-device", device);
  } catch {}
  return device;
}
