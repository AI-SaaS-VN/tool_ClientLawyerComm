import { describe, expect, it } from "vitest";

import { uiText } from "@/modules/i18n/copy";
import { formatRecordTime } from "@/modules/i18n/record-time";
import { defaultScreenLang, langFromAcceptLanguage, screenLangForUser } from "@/modules/i18n/screen-lang";

describe("screen language", () => {
  it("defaults a client to Traditional Chinese and a lawyer to Vietnamese", () => {
    expect(defaultScreenLang("client")).toBe("zh-Hant");
    expect(defaultScreenLang("lawyer")).toBe("vi");
    expect(defaultScreenLang("coordinator")).toBe("zh-Hans");
  });

  it("keeps a stored preference", () => {
    expect(screenLangForUser({ preferredLang: "en", globalRole: "client" })).toBe("en");
    expect(screenLangForUser({ preferredLang: null, globalRole: "client" })).toBe("zh-Hant");
  });

  it("reads one language from Accept-Language", () => {
    expect(langFromAcceptLanguage("vi-VN,vi;q=0.9")).toBe("vi");
    expect(langFromAcceptLanguage("zh-TW,zh;q=0.9")).toBe("zh-Hant");
    expect(langFromAcceptLanguage("zh-CN,zh;q=0.9")).toBe("zh-Hans");
  });

  it("puts one language on a control", () => {
    expect(uiText("zh-Hant", "send")).toBe("發送");
    expect(uiText("vi", "send")).toBe("Gửi");
    expect(uiText("zh-Hant", "send")).not.toContain("/");
  });
});

describe("record time", () => {
  const instant = "2026-10-03T10:45:00.000Z";

  it("labels UTC+8 and UTC+7 for the same instant", () => {
    expect(formatRecordTime(instant, "Asia/Shanghai")).toBe("2026-10-03 18:45 UTC+8");
    expect(formatRecordTime(instant, "Asia/Ho_Chi_Minh")).toBe("2026-10-03 17:45 UTC+7");
  });
});
