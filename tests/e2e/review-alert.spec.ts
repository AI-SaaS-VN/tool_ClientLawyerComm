import { expect, test } from "@playwright/test";

import {
  activatedUserContext,
  outbox,
  runId,
  runWorkerOnce,
  seedTriangle,
  waitForEmail,
} from "./helpers";

// AC05/AC12 key path: a deterministic rule (email address) holds the
// message, the coordinator is alerted (explicit worker pass into the fake
// outbox), the review queue shows the task, approval publishes it, and the
// other party then sees it.
test("rule-blocked message → review alert → coordinator approves → visible to recipient", async ({
  browser,
  request,
}) => {
  const id = runId();
  const triangle = await seedTriangle(request, id);
  const { input } = triangle;

  const clientContext = await activatedUserContext(
    browser,
    input.clientEmail,
    triangle.codeFor(input.clientEmail),
  );
  const coordinatorContext = await activatedUserContext(
    browser,
    input.coordinatorEmail,
    triangle.codeFor(input.coordinatorEmail),
  );
  const lawyerContext = await activatedUserContext(
    browser,
    input.lawyerEmail,
    triangle.codeFor(input.lawyerEmail),
  );
  const clientPage = await clientContext.newPage();
  const coordinatorPage = await coordinatorContext.newPage();
  const lawyerPage = await lawyerContext.newPage();

  try {
    // The lawyer watches the case before the message exists.
    await lawyerPage.goto(`/cases/${triangle.caseId}`);
    await expect(lawyerPage.getByTestId("mode-auto")).toBeVisible();

    // An explicit retainer-fee question is held. Ordinary text is not.
    const held = `这个案件你们律所收费多少？${id}`;
    await clientPage.goto(`/cases/${triangle.caseId}`);
    await clientPage.getByTestId("message-input").fill(held);
    await clientPage.getByTestId("message-send").click();
    await expect(clientPage.getByTestId("message-list")).toContainText("pending_review");
    await expect(lawyerPage.getByTestId("message-list")).not.toContainText(held);

    // The explicitly driven worker pass mails the review alert to the
    // coordinator — neutral wording, a task reference, no "@" anywhere.
    await runWorkerOnce(request);
    const alert = await waitForEmail(
      request,
      input.coordinatorEmail,
      (entry) => entry.text.includes("/review"),
      "review alert",
    );
    expect(alert.text).not.toContain("@");
    expect(alert.text).not.toContain(held);

    // The coordinator's review queue shows the held message; approving it
    // publishes through the pipeline.
    await coordinatorPage.goto("/review");
    const task = coordinatorPage.getByTestId("review-task").filter({ hasText: input.title });
    await expect(task).toBeVisible();
    await expect(task).toContainText(held);
    await task.getByTestId("review-approve").click();
    await expect(coordinatorPage.getByTestId("review-empty")).toBeVisible();

    // After approval the message is visible to the other party (live
    // refresh) and the author no longer sees it as pending.
    await expect(lawyerPage.getByTestId("message-list")).toContainText(held);
    await expect(lawyerPage.getByTestId("message-list")).toContainText(`[vi] ${held}`);
    await expect(clientPage.getByTestId("message-list")).not.toContainText("pending_review");

    // The completed review cancels its queued alerts: another pass sends
    // nothing more to anyone in this case.
    await runWorkerOnce(request);
    const coordinatorMails = (await outbox(request, input.coordinatorEmail)).filter((entry) =>
      entry.text.includes("/review"),
    );
    expect(coordinatorMails).toHaveLength(1);
  } finally {
    await clientContext.close();
    await coordinatorContext.close();
    await lawyerContext.close();
  }
});
