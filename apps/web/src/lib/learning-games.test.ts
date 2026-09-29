import { describe, expect, it } from "vitest";
import {
  codeWordChallenges,
  evaluateWordGuess,
  normalizedCodewordAnswer,
  robotFrames,
} from "./learning-games";

describe("JavaScript learning engines", () => {
  it("accepts programmable robot instructions and blocks invalid syntax", () => {
    expect(robotFrames("DOWN;DOWN;DOWN;DOWN;RIGHT;RIGHT;RIGHT;RIGHT", 1).valid).toBe(true);
    expect(robotFrames("alert(1)", 1).valid).toBe(false);
  });

  it("enforces the expanded movement limit", () => {
    const tooLong = robotFrames("REPEAT 9 DOWN;REPEAT 9 RIGHT", 1);
    expect(tooLong.won).toBe(false);
    expect(tooLong.operations).toBeGreaterThan(12);
  });

  it("evaluates repeated letters like a Termo-style game", () => {
    expect(evaluateWordGuess("ARRAY", "ARRAY")).toEqual([
      "correct",
      "correct",
      "correct",
      "correct",
      "correct",
    ]);
    expect(evaluateWordGuess("CACHE", "STACK")).toHaveLength(5);
  });

  it("normalizes dueto and quarteto answers", () => {
    expect(normalizedCodewordAnswer(codeWordChallenges[1].words)).toBe("CACHE,STACK");
    expect(normalizedCodewordAnswer(codeWordChallenges[3].words)).toBe(
      "BOOLEAN,COMPILE,RUNTIME,POINTER",
    );
  });
});
