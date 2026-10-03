import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db";
import { requestLoginOtp, verifyLoginOtp } from "@/modules/auth/service";
import { createSession } from "@/modules/auth/session";
import { createCase } from "@/modules/cases/service";
import { downloadFile, uploadFile } from "@/modules/files/service";
import { sendMessage } from "@/modules/messages/service";
import { decideReviewTask } from "@/modules/review/service";
import { fakeEmailProvider } from "@/server/providers/email/fake";

import { addMember, createVerifiedUser, extractOtp, resetDatabase } from "../../integration/helpers";

const MESSAGE_BODY = "机密正文-fictitious-log-scan-112233";
const USER_EMAIL = "logscan-client@example.com";

describe("routine logs carry no sensitive content (REQ-OPS-02)", () => {
  const captured: string[] = [];
  let spies: Array<{ mockRestore(): void }> = [];

  beforeEach(async () => {
    await resetDatabase();
    captured.length = 0;
    spies = (["log", "info", "warn", "error"] as const).map((method) =>
      vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
        captured.push(args.map((arg) => String(arg)).join(" "));
      }),
    );
  });

  afterEach(() => {
    for (const spy of spies) spy.mockRestore();
    spies = [];
  });

  it("OTP request/verify, login, message send, review decision, and download log IDs/statuses only", async () => {
    const { user: coordinator } = await createVerifiedUser(
      "coordinator",
      "logscan-coord@example.com",
    );
    const { user: client } = await createVerifiedUser("client", USER_EMAIL);
    const kase = await createCase(coordinator, {
      title: "Log Scan Case",
      clientOrgName: "Fictitious Org",
    });
    await addMember(kase.id, client.id, "client");

    // OTP request + verify + session creation (the login flow).
    await requestLoginOtp(USER_EMAIL);
    const otp = extractOtp(fakeEmailProvider.outbox.at(-1)!.text);
    await verifyLoginOtp({ email: USER_EMAIL, code: otp });
    const session = await createSession(client.id);

    // Message send.
    const { view: message } = await sendMessage(
      kase.id,
      client,
      { sourceText: MESSAGE_BODY },
      new Headers({ "idempotency-key": "log-1" }),
    );

    // Review decision (file approve path).
    const form = new FormData();
    form.set(
      "file",
      new File([new Uint8Array(Buffer.from("%PDF-1.4 fictitious"))], "你们律所收费多少.pdf"),
    );
    const uploaded = await uploadFile(kase.id, client, form);
    const task = await prisma.reviewTask.findFirstOrThrow({
      where: { targetId: uploaded.id },
    });
    await decideReviewTask(task.id, coordinator, "approve", {});

    // Authorized download.
    await downloadFile(uploaded.id, coordinator);
    void message;

    const output = captured.join("\n");
    expect(output).not.toContain(otp);
    expect(output).not.toContain(MESSAGE_BODY);
    expect(output).not.toContain(USER_EMAIL);
    expect(output).not.toContain("logscan-coord@example.com");
    expect(output).not.toContain(session.token);
  });
});
