import { describe, expect, it } from "vitest";

import {
  attachmentRowState,
  planAttachmentDirection,
} from "@/modules/files/attachment-translation";

// REQ-ATT-02: the direction follows the extracted text — Chinese becomes
// Vietnamese, Vietnamese becomes Traditional Chinese.
describe("planAttachmentDirection (REQ-ATT-02)", () => {
  it("Simplified Chinese source text is translated to Vietnamese", () => {
    expect(planAttachmentDirection("甲方与乙方于见面时在合同末页签字。交货地为胡志明市。")).toEqual({
      sourceLang: "zh-Hans",
      targetLang: "vi",
    });
  });

  it("Traditional Chinese source text is also translated to Vietnamese", () => {
    expect(planAttachmentDirection("甲方與乙方於見面時在合同末頁簽字。")).toEqual({
      sourceLang: "zh-Hans",
      targetLang: "vi",
    });
  });

  it("Vietnamese source text is translated to Traditional Chinese", () => {
    expect(
      planAttachmentDirection(
        "Bên A và bên B ký vào trang cuối hợp đồng khi gặp mặt. Nơi giao hàng là Thành phố Hồ Chí Minh.",
      ),
    ).toEqual({ sourceLang: "vi", targetLang: "zh-Hant" });
  });

  it("text that is neither Chinese nor Vietnamese yields no page", () => {
    expect(planAttachmentDirection("The parties signed the contract on page one.")).toBeNull();
  });
});

// The file row shows 打开附件翻译 only for a ready page; extraction failure
// is written on the row instead (REQ-ATT-04).
describe("attachmentRowState (REQ-ATT-01/04)", () => {
  it("maps the stored page status to the row control", () => {
    expect(attachmentRowState(null)).toBe("none");
    expect(attachmentRowState(undefined)).toBe("none");
    expect(attachmentRowState("pending")).toBe("pending");
    expect(attachmentRowState("processing")).toBe("pending");
    expect(attachmentRowState("ready")).toBe("ready");
    expect(attachmentRowState("no_text")).toBe("unavailable");
    expect(attachmentRowState("failed")).toBe("unavailable");
  });
});
