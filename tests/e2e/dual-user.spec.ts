import { expect, test } from "@playwright/test";

import { acceptInviteViaUi, activatedUserContext, runId, seedTriangle } from "./helpers";

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

// F04: one click sends one message. Rapid repeated activations while the
// first request is still in flight must not create duplicates — the button
// is disabled in flight and the submit handler guards re-entry. dispatchEvent
// is used because Playwright's click waits out the disabled state.
test("rapid repeated send clicks produce exactly one message", async ({ browser, request }) => {
  const id = runId();
  const triangle = await seedTriangle(request, id);
  const context = await activatedUserContext(
    browser,
    triangle.input.clientEmail,
    triangle.codeFor(triangle.input.clientEmail),
  );
  const page = await context.newPage();

  try {
    // F03: a signed-in user opening the root lands on the case list.
    await page.goto("/");
    await page.waitForURL(/\/cases$/);
    await expect(page.getByTestId("case-link")).toBeVisible();

    await page.goto(`/cases/${triangle.caseId}`);
    const text = `连点发送测试 ${id}`;
    await page.getByTestId("message-input").fill(text);
    const send = page.getByTestId("message-send");
    await send.dispatchEvent("click");
    await send.dispatchEvent("click");
    await send.dispatchEvent("click");
    // The message appears from the send flow itself (no extra click needed).
    await expect(page.getByTestId("message-list")).toContainText(text);
    await expect(page.getByTestId("message-item").filter({ hasText: text })).toHaveCount(1);
  } finally {
    await context.close();
  }
});
