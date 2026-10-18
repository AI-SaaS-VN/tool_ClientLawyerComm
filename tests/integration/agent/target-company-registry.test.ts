import { beforeEach, describe, expect, it } from "vitest";

import { GET as getRegistry, POST as postRegistry } from "@/app/api/cases/[id]/registry/route";
import { prisma } from "@/lib/db";
import { resetTranslationPacingForTests, runNotificationWorkerOnce } from "@/server/jobs/worker";
import { fakeEmailProvider } from "@/server/providers/email/fake";

import {
  addMember,
  cookieHeader,
  createVerifiedUser,
  getRequest,
  postJson,
  resetDatabase,
  seedCaseWithCoordinator,
  sessionCookieFor,
} from "../helpers";

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

async function seedTriangle() {
  const { kase, coordinator, cookie: coordinatorCookie } =
    await seedCaseWithCoordinator("Registry Case");
  const { user: client } = await createVerifiedUser("client", "client-reg@example.com");
  await addMember(kase.id, client.id, "client");
  const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-reg@example.com");
  await addMember(kase.id, lawyer.id, "lawyer");
  const clientCookie = await sessionCookieFor(client.id);
  const lawyerCookie = await sessionCookieFor(lawyer.id);
  return { kase, coordinator, coordinatorCookie, client, clientCookie, lawyer, lawyerCookie };
}

describe("target company registry lookup (REQ-REG-01~02)", () => {
  beforeEach(async () => {
    await resetDatabase();
    resetTranslationPacingForTests();
  });

  it("the coordinator sets the name; the worker looks it up; only the coordinator reads the result", async () => {
    const { kase, coordinatorCookie } = await seedTriangle();

    const setRes = await postRegistry(
      postJson(
        `/api/cases/${kase.id}/registry`,
        { name: "Cong ty Sample Viet Nam" },
        cookieHeader(coordinatorCookie),
      ),
      params(kase.id),
    );
    expect(setRes.status).toBe(200);

    await runNotificationWorkerOnce({ translationMinIntervalMs: 0 });

    const row = await prisma.caseRegistryLookup.findUniqueOrThrow({ where: { caseId: kase.id } });
    expect(row.status).toBe("ready");
    expect(row.taxCode).toBe("0000000001");
    expect(row.resultText).toContain("0000000001");
    expect(row.sourceUrl).toContain("masothue.com");
    expect(row.lookedUpAt).not.toBeNull();

    const viewRes = await getRegistry(
      getRequest(`/api/cases/${kase.id}/registry`, cookieHeader(coordinatorCookie)),
      params(kase.id),
    );
    expect(viewRes.status).toBe(200);
    const { registry } = (await viewRes.json()) as { registry: { resultText: string } };
    expect(registry.resultText).toContain("CONG TY TNHH SAMPLE (VIET NAM)");

    // The result is not a case-chat message and nothing was emailed (REQ-REG-01).
    expect(await prisma.message.count({ where: { caseId: kase.id } })).toBe(0);
    expect(fakeEmailProvider.outbox).toHaveLength(0);

    // Setting the query is auditable (REQ-OPS-01).
    const audit = await prisma.auditLog.findFirstOrThrow({
      where: { caseId: kase.id, action: "registry.query" },
    });
    expect(audit.result).toBe("success");
  });

  it("clients and lawyers get a plain 404 for both read and set (REQ-REG-01)", async () => {
    const { kase, clientCookie, lawyerCookie } = await seedTriangle();
    for (const cookie of [clientCookie, lawyerCookie]) {
      const res = await getRegistry(
        getRequest(`/api/cases/${kase.id}/registry`, cookieHeader(cookie)),
        params(kase.id),
      );
      expect(res.status).toBe(404);
      const post = await postRegistry(
        postJson(`/api/cases/${kase.id}/registry`, { name: "Aomaga" }, cookieHeader(cookie)),
        params(kase.id),
      );
      expect(post.status).toBe(404);
    }
  });

  it("a case without a name is never looked up (REQ-REG-02)", async () => {
    const { kase } = await seedTriangle();
    await runNotificationWorkerOnce({ translationMinIntervalMs: 0 });
    const row = await prisma.caseRegistryLookup.findUnique({ where: { caseId: kase.id } });
    expect(row === null || row.status === "none").toBe(true);
  });

  it("a name with no matching company ends as no_match, not invented (REQ-REG-02)", async () => {
    const { kase, coordinatorCookie } = await seedTriangle();
    await postRegistry(
      postJson(
        `/api/cases/${kase.id}/registry`,
        { name: "zzz-no-such-company" },
        cookieHeader(coordinatorCookie),
      ),
      params(kase.id),
    );
    await runNotificationWorkerOnce({ translationMinIntervalMs: 0 });
    const row = await prisma.caseRegistryLookup.findUniqueOrThrow({ where: { caseId: kase.id } });
    expect(row.status).toBe("no_match");
    expect(row.resultText).toBeNull();
  });

  it("the coordinator records a manual entry when the source is unreachable (REQ-REG-01 v0.18)", async () => {
    const { kase, coordinatorCookie } = await seedTriangle();
    const text = "税号：0901053180\n登记状态：正常经营\n法定代表人：HUNG, KUO-YI";
    const res = await postRegistry(
      postJson(
        `/api/cases/${kase.id}/registry`,
        { text, sourceUrl: "https://masothue.com/0901053180-example" },
        cookieHeader(coordinatorCookie),
      ),
      params(kase.id),
    );
    expect(res.status).toBe(200);

    const row = await prisma.caseRegistryLookup.findUniqueOrThrow({ where: { caseId: kase.id } });
    expect(row.status).toBe("ready");
    expect(row.resultText).toBe(text);
    expect(row.sourceUrl).toBe("https://masothue.com/0901053180-example");
    expect(row.lookedUpAt).not.toBeNull();

    // A manual entry is settled: the worker never re-queues or overwrites it.
    await runNotificationWorkerOnce({ translationMinIntervalMs: 0 });
    const after = await prisma.caseRegistryLookup.findUniqueOrThrow({ where: { caseId: kase.id } });
    expect(after.resultText).toBe(text);

    // Not a case-chat message, nothing emailed (REQ-REG-01).
    expect(await prisma.message.count({ where: { caseId: kase.id } })).toBe(0);
    expect(fakeEmailProvider.outbox).toHaveLength(0);

    const audit = await prisma.auditLog.findFirstOrThrow({
      where: { caseId: kase.id, action: "registry.manual" },
    });
    expect(audit.result).toBe("success");
  });

  it("manual entry requires text and a sane optional source URL", async () => {
    const { kase, coordinatorCookie } = await seedTriangle();
    for (const body of [
      { text: " " },
      { text: "税号：0901053180", sourceUrl: "not-a-url" },
    ]) {
      const res = await postRegistry(
        postJson(`/api/cases/${kase.id}/registry`, body, cookieHeader(coordinatorCookie)),
        params(kase.id),
      );
      expect(res.status).toBe(400);
    }
    expect(await prisma.caseRegistryLookup.count({ where: { caseId: kase.id } })).toBe(0);
  });

  it("clients and lawyers cannot record a manual entry (REQ-REG-01)", async () => {
    const { kase, clientCookie, lawyerCookie } = await seedTriangle();
    for (const cookie of [clientCookie, lawyerCookie]) {
      const res = await postRegistry(
        postJson(
          `/api/cases/${kase.id}/registry`,
          { text: "手工录入" },
          cookieHeader(cookie),
        ),
        params(kase.id),
      );
      expect(res.status).toBe(404);
    }
  });

  it("a bare tax code goes straight to the detail page", async () => {
    const { kase, coordinatorCookie } = await seedTriangle();
    await postRegistry(
      postJson(
        `/api/cases/${kase.id}/registry`,
        { name: "0000000001" },
        cookieHeader(coordinatorCookie),
      ),
      params(kase.id),
    );
    await runNotificationWorkerOnce({ translationMinIntervalMs: 0 });
    const row = await prisma.caseRegistryLookup.findUniqueOrThrow({ where: { caseId: kase.id } });
    expect(row.status).toBe("ready");
    expect(row.taxCode).toBe("0000000001");
  });

  it("setting the query again re-queues the lookup", async () => {
    const { kase, coordinatorCookie } = await seedTriangle();
    for (const name of ["Cong ty Sample Viet Nam", "Sample Viet Nam"]) {
      await postRegistry(
        postJson(`/api/cases/${kase.id}/registry`, { name }, cookieHeader(coordinatorCookie)),
        params(kase.id),
      );
      await runNotificationWorkerOnce({ translationMinIntervalMs: 0 });
    }
    const row = await prisma.caseRegistryLookup.findUniqueOrThrow({ where: { caseId: kase.id } });
    expect(row.status).toBe("ready");
    expect(row.queryName).toBe("Sample Viet Nam");
  });
});
