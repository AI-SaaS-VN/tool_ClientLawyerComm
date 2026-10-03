import { expect, test } from "@playwright/test";

import { activatedUserContext, runId, seedTriangle } from "./helpers";

// AC06 key path with the F01 case-page control: the client uploads an
// attachment on the case page, sees it as pending while the lawyer does not
// see it at all, the coordinator approves from the review queue, and the
// lawyer then sees the published file and downloads it.
test("case-page attachment: upload → pending visibility → approve → published download", async ({
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

  // Real PNG magic bytes: type detection never trusts the extension.
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.from(`fictitious-e2e-payload-${id}`, "utf8"),
  ]);
  const fileName = `委托材料-${id}.png`;

  try {
    await clientPage.goto(`/cases/${triangle.caseId}`);
    await clientPage.getByTestId("file-input").setInputFiles({
      name: fileName,
      mimeType: "image/png",
      buffer: png,
    });
    await clientPage.getByTestId("file-upload").click();

    // The uploader sees their own file with its pending-review status.
    const ownItem = clientPage.getByTestId("file-item").filter({ hasText: fileName });
    await expect(ownItem).toBeVisible();
    await expect(ownItem).toContainText("待审核");

    // The lawyer neither lists nor downloads the pending file.
    await lawyerPage.goto(`/cases/${triangle.caseId}`);
    await expect(lawyerPage.getByTestId("mode-auto")).toBeVisible();
    await expect(lawyerPage.getByTestId("file-item").filter({ hasText: fileName })).toHaveCount(0);

    // The coordinator approves the file target from the review queue.
    await coordinatorPage.goto("/review");
    const task = coordinatorPage.getByTestId("review-task").filter({ hasText: fileName });
    await expect(task).toBeVisible();
    await task.getByTestId("review-approve").click();
    await expect(coordinatorPage.getByTestId("review-empty")).toBeVisible();

    // Now published: both parties see it with a download link, and the
    // lawyer's download returns the stored bytes through the authorized proxy.
    await lawyerPage.reload();
    const publishedItem = lawyerPage.getByTestId("file-item").filter({ hasText: fileName });
    await expect(publishedItem).toBeVisible();
    await expect(publishedItem).toContainText("已发布");
    const href = await publishedItem.getByTestId("file-download").getAttribute("href");
    expect(href).toMatch(/^\/api\/files\/.+\/download$/);
    const download = await lawyerContext.request.get(href!);
    expect(download.status()).toBe(200);
    expect(Buffer.from(await download.body()).equals(png)).toBe(true);

    await clientPage.reload();
    await expect(clientPage.getByTestId("file-item").filter({ hasText: fileName })).toContainText(
      "已发布",
    );
  } finally {
    await clientContext.close();
    await coordinatorContext.close();
    await lawyerContext.close();
  }
});
