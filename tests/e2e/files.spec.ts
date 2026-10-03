import { expect, test } from "@playwright/test";

import { activatedUserContext, runId, seedTriangle } from "./helpers";

// A normal attachment publishes immediately. The lawyer sees it and downloads
// it without a coordinator approval.
test("case-page attachment: ordinary upload is published and downloaded by the lawyer", async ({
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

    const ownItem = clientPage.getByTestId("file-item").filter({ hasText: fileName });
    await expect(ownItem).toBeVisible();
    await expect(ownItem).toContainText("已发布");

    await lawyerPage.goto(`/cases/${triangle.caseId}`);
    await expect(lawyerPage.getByTestId("mode-auto")).toBeVisible();
    await coordinatorPage.goto(`/cases/${triangle.caseId}`);
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
