import { afterEach, describe, expect, it } from "vitest";

import { checkMessageContent } from "@/modules/moderation/pipeline";
import { isExplicitFeeInquiry } from "@/modules/moderation/semantic";
import { fakeLlmModerationProvider } from "@/server/providers/llm/fake";

import passCorpus from "../../fixtures/moderation/pass.json";
import reviewCorpus from "../../fixtures/moderation/review.json";

const feeFixtures = reviewCorpus.filter((item) => item.category === "fee_inquiry");

afterEach(() => {
  fakeLlmModerationProvider.reset();
});

describe("semantic fee-intent judgment (REQ-MOD-03)", () => {
  it("honours an injected fixed verdict (explicit)", async () => {
    fakeLlmModerationProvider.setFixedVerdict("explicit_fee_inquiry");
    await expect(isExplicitFeeInquiry("任何文本都行", "zh-Hans")).resolves.toBe(true);
  });

  it("honours an injected fixed verdict (not explicit)", async () => {
    fakeLlmModerationProvider.setFixedVerdict("not_explicit");
    await expect(isExplicitFeeInquiry("你们律所收费多少", "zh-Hans")).resolves.toBe(false);
  });

  it("propagates provider errors so the pipeline can fail safe", async () => {
    fakeLlmModerationProvider.setFixedVerdict("explicit_fee_inquiry");
    fakeLlmModerationProvider.failNext();
    await expect(isExplicitFeeInquiry("test", "en")).rejects.toThrow();
  });

  it.each(feeFixtures.map((f) => [f.id, f.text, f.lang] as const))(
    "flags explicit fee inquiry fixture %s",
    async (_id, text, lang) => {
      await expect(isExplicitFeeInquiry(text, lang)).resolves.toBe(true);
    },
  );

  it.each(passCorpus.map((f) => [f.id, f.text, f.lang] as const))(
    "releases pass fixture %s (case amounts and vague cost are not retainer fees)",
    async (_id, text, lang) => {
      await expect(isExplicitFeeInquiry(text, lang)).resolves.toBe(false);
    },
  );
});

describe("full corpus evaluation (REQ-MOD-08 error separation)", () => {
  it("counts False Block and Missed Block separately; both are zero on the fixture set", async () => {
    const falseBlocks: string[] = [];
    for (const item of passCorpus) {
      const verdict = await checkMessageContent(item.text, item.lang);
      if (verdict.outcome !== "approve") falseBlocks.push(item.id);
    }
    const missedBlocks: string[] = [];
    for (const item of reviewCorpus) {
      const verdict = await checkMessageContent(item.text, item.lang);
      const shouldHold = item.category === "fee_inquiry";
      if (shouldHold && verdict.outcome !== "needs_review") missedBlocks.push(item.id);
      if (!shouldHold && verdict.outcome !== "approve") falseBlocks.push(item.id);
    }
    expect(falseBlocks).toEqual([]);
    expect(missedBlocks).toEqual([]);
  });

  it("publishes contact details and holds an explicit retainer-fee question", async () => {
    const contact = await checkMessageContent("加我微信：wxid_abc123def", "zh-Hans");
    expect(contact.outcome).toBe("approve");

    const fee = await checkMessageContent("这个案件你们律所收费多少？", "zh-Hans");
    expect(fee.outcome).toBe("needs_review");
    expect(fee.reason).toBe("semantic:fee_inquiry");
  });
});
