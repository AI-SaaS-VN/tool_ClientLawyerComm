import { describe, expect, it } from "vitest";

import {
  composeBriefText,
  isThinCase,
  parseQuestions,
  shouldPromptBrief,
} from "@/modules/agent/coordinator-brief";

// REQ-BRIEF-02: when published content is thin, the agent lists the missing
// facts and waits.
describe("isThinCase (REQ-BRIEF-02)", () => {
  it("fewer than five published messages is thin", () => {
    expect(isThinCase(0)).toBe(true);
    expect(isThinCase(4)).toBe(true);
    expect(isThinCase(5)).toBe(false);
    expect(isThinCase(12)).toBe(false);
  });
});

describe("parseQuestions", () => {
  it("parses numbered lines", () => {
    const out = "1. 对方公司的越南语法定名称是什么？\n2. 合同签订地在中国还是越南？";
    expect(parseQuestions(out)).toEqual([
      "对方公司的越南语法定名称是什么？",
      "合同签订地在中国还是越南？",
    ]);
  });

  it("parses 、and ) number marks and bullet lines", () => {
    expect(parseQuestions("1、第一个问题\n2) 第二个问题\n- 第三个问题")).toEqual([
      "第一个问题",
      "第二个问题",
      "第三个问题",
    ]);
  });

  it("skips blank and unprefixed lines and caps at five", () => {
    const out = "说明文字\n1. q1\n\n2. q2\n3. q3\n4. q4\n5. q5\n6. q6";
    expect(parseQuestions(out)).toEqual(["q1", "q2", "q3", "q4", "q5"]);
  });

  it("returns [] when nothing parses", () => {
    expect(parseQuestions("")).toEqual([]);
    expect(parseQuestions("没有编号的一段话。")).toEqual([]);
  });
});

describe("composeBriefText", () => {
  it("stores question then answer blocks", () => {
    expect(
      composeBriefText([
        { question: "对方公司的越南语法定名称是什么？", answer: "Công ty Aomaga" },
        { question: "签订地？", answer: "越南" },
      ]),
    ).toBe("对方公司的越南语法定名称是什么？\nCông ty Aomaga\n\n签订地？\n越南");
  });
});

// REQ-BRIEF-02/03: prompt while the case is new or new published content
// appeared; never after the brief is confirmed; never while a generation is
// queued or running.
describe("shouldPromptBrief", () => {
  const t1 = new Date("2026-10-16T01:00:00Z");
  const t2 = new Date("2026-10-16T02:00:00Z");

  it("a brand-new case prompts once", () => {
    expect(
      shouldPromptBrief(
        { questionsStatus: "none", questionsAt: null, lastContentAt: null, briefText: null },
        { latestContentAt: null },
      ),
    ).toBe(true);
  });

  it("new published content after the last prompt prompts again", () => {
    expect(
      shouldPromptBrief(
        { questionsStatus: "ready", questionsAt: t1, lastContentAt: t1, briefText: null },
        { latestContentAt: t2 },
      ),
    ).toBe(true);
  });

  it("no new content means no new prompt", () => {
    expect(
      shouldPromptBrief(
        { questionsStatus: "ready", questionsAt: t1, lastContentAt: t1, briefText: null },
        { latestContentAt: t1 },
      ),
    ).toBe(false);
  });

  it("a confirmed brief stops prompting", () => {
    expect(
      shouldPromptBrief(
        { questionsStatus: "ready", questionsAt: t1, lastContentAt: t1, briefText: "已确认" },
        { latestContentAt: t2 },
      ),
    ).toBe(false);
  });

  it("a queued or running generation is not doubled", () => {
    for (const status of ["queued", "processing"]) {
      expect(
        shouldPromptBrief(
          { questionsStatus: status, questionsAt: null, lastContentAt: null, briefText: null },
          { latestContentAt: t2 },
        ),
      ).toBe(false);
    }
  });
});
