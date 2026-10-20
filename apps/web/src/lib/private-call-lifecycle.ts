export const PRIVATE_CALL_ACTIVE_STATES = new Set([
  "DIALING",
  "RINGING",
  "ACCEPTED",
  "CONNECTING",
  "CONNECTED",
]);

/** The standalone call page must retain the global private-call controller. */
export function privateCallsEnabled(path: string) {
  return /^\/(home|portfolio|subjects|learn|profile|settings|friends|notebooks|rooms|caronas|forum|onboarding|admin|calls)(\/|$)/.test(path);
}

export function deviceOwnsPrivateCall(
  call: {
    callerId: string;
    calleeId: string;
    callerDevice: string;
    calleeDevice?: string;
  },
  userId: string,
  deviceId: string,
) {
  if (call.callerId === userId) return call.callerDevice === deviceId;
  if (call.calleeId === userId) return call.calleeDevice === deviceId;
  return false;
}

/** A remounted page has no local LiveKit session; a call bound to the same
 * device is orphaned after a reload or app restart and may be safely ended.
 * Do not end a call that is actually running on the user's other device.
 */
export function isOrphanedLocalPrivateCall(
  call: {
    state: string;
    callerId: string;
    calleeId: string;
    callerDevice: string;
    calleeDevice?: string;
  },
  userId: string,
  deviceId: string,
  hasLocalMedia: boolean,
) {
  return (
    PRIVATE_CALL_ACTIVE_STATES.has(call.state) &&
    !hasLocalMedia &&
    deviceOwnsPrivateCall(call, userId, deviceId)
  );
}

export function isTerminalCallOperation(operation: string) {
  return operation === "end" || operation === "decline" || operation === "cancel";
}

/** Never hang up a call just because a document has no media yet.
 * Ringing and pending connections are valid states without LiveKit.
 */
export function shouldEndOnPageExit(
  call: { state: string; callerId: string; calleeId: string; callerDevice: string; calleeDevice?: string },
  userId: string,
  deviceId: string,
  hasConnectedMedia: boolean,
  bfcache: boolean,
) {
  return !bfcache && call.state === "CONNECTED" && hasConnectedMedia &&
    deviceOwnsPrivateCall(call, userId, deviceId);
}
