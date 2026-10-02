import { expect, test } from "@playwright/test";

import { acceptInviteViaUi, runId, seedTriangle } from "./helpers";

// AC03 key path: Chinese client and Vietnamese lawyer in two separate
// browser contexts — activation, live delivery, automatic translation,
// manual click-to-translate, and a translated reply.
test("dual-browser zh/vi journey: send, auto translation, manual translate, reply", async ({
  browser,
  request,
}) => {
  const id = runId();
  const triangle = await seedTriangle(request, id);
  const { input } = triangle;

  const zhContext = await browser.newContext({ locale: "zh-CN" });
  const viContext = await browser.newContext({ locale: "vi" });
  const zhPage = await zhContext.newPage();
  const viPage = await viContext.newPage();

  try {
    await acceptInviteViaUi(zhPage, request, input.clientEmail, triangle.codeFor(input.clientEmail));
    await acceptInviteViaUi(viPage, request, input.lawyerEmail, triangle.codeFor(input.lawyerEmail));

    await zhPage.goto("/cases");
    await zhPage.getByTestId("case-link").click();
    await viPage.goto("/cases");
    await viPage.getByTestId("case-link").click();

    // The Chinese client sends a message; the Vietnamese lawyer's open page
    // receives it live (SSE refresh) with the automatic translation.
    const first = `你好，请确认收到委托材料。${id}`;
    await zhPage.getByTestId("message-input").fill(first);
    await zhPage.getByTestId("message-send").click();
    await expect(zhPage.getByTestId("message-list")).toContainText(first);
    await expect(viPage.getByTestId("message-list")).toContainText(`[vi] ${first}`);

    // Manual mode: a message that arrives after the switch shows the source
    // text with a translate button; clicking it produces the translation.
    await viPage.getByTestId("mode-manual").click();
    const second = `请补充第二条材料说明。${id}`;
    await zhPage.getByTestId("message-input").fill(second);
    await zhPage.getByTestId("message-send").click();
    const secondItem = viPage.getByTestId("message-item").filter({ hasText: second });
    await expect(secondItem).toBeVisible();
    await secondItem.getByTestId("translate-button").click();
    await expect(secondItem.getByTestId("translation-text")).toContainText(`[vi] ${second}`);

    // The lawyer replies in Vietnamese; the Chinese client sees the
    // automatic zh-Hans translation.
    const reply = `Tôi đã nhận được, cảm ơn. ${id}`;
    await viPage.getByTestId("message-input").fill(reply);
    await viPage.getByTestId("message-send").click();
    await expect(zhPage.getByTestId("message-list")).toContainText(`[zh-Hans] ${reply}`);
  } finally {
    await zhContext.close();
    await viContext.close();
  }
});
