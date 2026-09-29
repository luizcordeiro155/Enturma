import { describe, expect, it } from "vitest";
import { robotFrames, wordFeedback } from "./learning-games";

describe("JavaScript learning engines", () => {
  it("executes direct movement code on the first algorithm level", () => {
    const code = `
      down();
      down();
      down();
      down();
      right();
      right();
      right();
      right();
    `;
    expect(robotFrames(code, 1).won).toBe(true);
  });

  it("requires repeat from level 2 onward", () => {
    const direct = "down();down();down();down();right();right();right();right();";
    expect(robotFrames(direct, 2).won).toBe(false);
    expect(robotFrames(direct, 2).error).toContain("repeat");
    const compact = 'repeat(4){down();}repeat(4){right();}';
    expect(robotFrames(compact, 2).won).toBe(true);
  });

  it("supports decision loops without evaluating arbitrary JavaScript", () => {
    const code =
      'while(canMove("D")){down();}while(canMove("R")){right();}';
    expect(robotFrames(code, 3).won).toBe(true);
    expect(robotFrames("alert(1)", 1).won).toBe(false);
  });

  it("requires repetition and decision logic in the final level", () => {
    const code =
      'repeat(2){down();}while(canMove("R")){right();}repeat(3){down();}';
    expect(robotFrames(code, 4).won).toBe(true);
  });

  it("scores repeated letters in programmer word guesses correctly", () => {
    expect(wordFeedback("QUEUE", "QUERY")).toEqual([
      { letter: "Q", state: "exact" },
      { letter: "U", state: "exact" },
      { letter: "E", state: "exact" },
      { letter: "U", state: "absent" },
      { letter: "E", state: "absent" },
    ]);
    expect(wordFeedback("STACK", "CACHE")).toEqual([
      { letter: "S", state: "absent" },
      { letter: "T", state: "absent" },
      { letter: "A", state: "present" },
      { letter: "C", state: "present" },
      { letter: "K", state: "absent" },
    ]);
  });
});
