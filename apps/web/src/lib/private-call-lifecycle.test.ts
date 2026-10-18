import { describe, expect, it } from "vitest";
import {
  deviceOwnsPrivateCall,
  isOrphanedLocalPrivateCall,
  isTerminalCallOperation,
  privateCallsEnabled,
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
  it("recognizes terminal controls", () => {
    expect(isTerminalCallOperation("end")).toBe(true);
    expect(isTerminalCallOperation("decline")).toBe(true);
    expect(isTerminalCallOperation("cancel")).toBe(true);
    expect(isTerminalCallOperation("accept")).toBe(false);
  });
});
