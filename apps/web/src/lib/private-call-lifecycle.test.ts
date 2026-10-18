import { describe, expect, it } from "vitest";
import {
  deviceOwnsPrivateCall,
  isOrphanedLocalPrivateCall,
  isTerminalCallOperation,
  privateCallsEnabled,
  shouldEndOnPageExit,
} from "./private-call-lifecycle";

const call = {
  state: "CONNECTED",
  callerId: "alice",
  calleeId: "bob",
  callerDevice: "tab-a",
  calleeDevice: "tab-b",
};

describe("private call lifecycle", () => {
  it("keeps the call controller on standalone call routes", () => {
    expect(privateCallsEnabled("/friends")).toBe(true);
    expect(privateCallsEnabled("/calls/123")).toBe(true);
    expect(privateCallsEnabled("/login")).toBe(false);
  });
  it("recovers an orphan on this device but never drops another device's call", () => {
    expect(isOrphanedLocalPrivateCall(call, "alice", "tab-a", false)).toBe(true);
    expect(isOrphanedLocalPrivateCall(call, "bob", "tab-b", false)).toBe(true);
    expect(isOrphanedLocalPrivateCall(call, "alice", "tab-x", false)).toBe(false);
    expect(isOrphanedLocalPrivateCall(call, "alice", "tab-a", true)).toBe(false);
    expect(deviceOwnsPrivateCall(call, "stranger", "tab-a")).toBe(false);
  });
  it("never recovers someone else's incoming call before it is accepted", () => {
    const incoming = { ...call, state: "RINGING", calleeDevice: undefined };
    expect(isOrphanedLocalPrivateCall(incoming, "bob", "tab-b", false)).toBe(false);
  });
  it("keeps ringing and accepted calls alive before media connection", () => {
    for (const state of ["DIALING", "RINGING", "ACCEPTED", "CONNECTING"]) {
      expect(shouldEndOnPageExit({ ...call, state }, "alice", "tab-a", false, false)).toBe(false);
      expect(shouldEndOnPageExit({ ...call, state }, "alice", "tab-a", true, false)).toBe(false);
    }
    expect(shouldEndOnPageExit(call, "alice", "tab-a", false, false)).toBe(false);
    expect(shouldEndOnPageExit(call, "alice", "tab-a", true, true)).toBe(false);
    expect(shouldEndOnPageExit(call, "alice", "tab-x", true, false)).toBe(false);
    expect(shouldEndOnPageExit(call, "alice", "tab-a", true, false)).toBe(true);
  });
  it("recognizes terminal controls", () => {
    expect(isTerminalCallOperation("end")).toBe(true);
    expect(isTerminalCallOperation("decline")).toBe(true);
    expect(isTerminalCallOperation("cancel")).toBe(true);
    expect(isTerminalCallOperation("accept")).toBe(false);
  });
});
