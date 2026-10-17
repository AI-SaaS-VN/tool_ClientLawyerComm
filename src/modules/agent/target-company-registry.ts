// T18 (REQ-REG-01/02): target-company lookup against the public masothue.com
// mirror of the Vietnam tax registration. The official registry
// (dangkyquamang.dkkd.gov.vn) sits behind a login/captcha wall; masothue
// carries the same registration data without credentials. The source URL is
// always stored with the result so the coordinator can verify upstream.

import type { CaseRegistryLookup, User } from "@prisma/client";

import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { recordAudit } from "@/server/audit/log";
import { requireCaseMember, requireWritableCase } from "@/server/guards/case-guards";
import { LlmFailure } from "@/server/providers/llm/interface";
import { getRegistryProvider } from "@/server/providers/registry";

export interface RegistryCandidate {
  taxCode: string;
  name: string;
  path: string;
  representative: string | null;
  address: string | null;
}

export interface RegistryRecord {
  taxCode: string;
  nameVi: string;
  nameEn: string | null;
  shortName: string | null;
  status: string | null;
  address: string | null;
  legalRep: string | null;
  phone: string | null;
  activeSince: string | null;
  managedBy: string | null;
  companyType: string | null;
  mainIndustry: string | null;
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#039;": "'",
  "&nbsp;": " ",
};

export function stripHtml(html: string): string {
  let text = html.replace(/<[^>]*>/g, " ");
  for (const [entity, ch] of Object.entries(ENTITIES)) {
    text = text.split(entity).join(ch);
  }
  text = text.replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
  return text.replace(/\s+/g, " ").trim();
}

// --- Search results page ---------------------------------------------------

const LISTING_START = '<div class="tax-listing">';
const SEARCH_ITEM =
  /<h3><a href='(\/\d{10,13}[^']*)'[^>]*>([\s\S]*?)<\/a><\/h3>([\s\S]*?)(?=<h3>|$)/g;

export function parseMasothueSearchHtml(html: string): RegistryCandidate[] {
  const start = html.indexOf(LISTING_START);
  if (start === -1) return [];
  const end = html.indexOf('<div class="m-y-2">', start);
  const region = html.slice(start, end === -1 ? undefined : end);

  const candidates: RegistryCandidate[] = [];
  for (const match of region.matchAll(SEARCH_ITEM)) {
    const [, path, nameHtml, block] = match;
    const taxCode = /^\/(\d{10,13})/.exec(path!)?.[1];
    if (!taxCode) continue;
    const repMatch = /<em><a[^>]*>([\s\S]*?)<\/a><\/em>/.exec(block!);
    const representative = repMatch ? stripHtml(repMatch[1]!) || null : null;
    const addrMatch = /<address>([\s\S]*?)<\/address>/.exec(block!);
    const address = addrMatch ? stripHtml(addrMatch[1]!) || null : null;
    candidates.push({
      taxCode,
      name: stripHtml(nameHtml!),
      path: path!,
      representative,
      address,
    });
  }
  return candidates;
}

// --- Company detail page ---------------------------------------------------

// The detail table is a two-column label/value table. Labels are Vietnamese
// and stable across pages; rows we do not know are ignored.
const LABELS = {
  taxCode: "Mã số thuế",
  address: "Địa chỉ",
  taxAddress: "Địa chỉ Thuế",
  status: "Tình trạng",
  nameEn: "Tên quốc tế",
  shortName: "Tên viết tắt",
  legalRep: "Người đại diện",
  phone: "Điện thoại",
  activeSince: "Ngày hoạt động",
  managedBy: "Quản lý bởi",
  companyType: "Loại hình DN",
  mainIndustry: "Ngành nghề chính",
} as const;

// Value cells usually wrap the payload in <span class='copy'>…</span>; the
// rest of the cell is buttons and ad markup we must not keep.
function cellText(cell: string): string | null {
  const copy = /<span class='copy'[^>]*>([\s\S]*?)<\/span>/.exec(cell);
  const text = stripHtml(copy ? copy[1]! : cell);
  return text || null;
}

export function parseMasothueDetailHtml(html: string): RegistryRecord | null {
  const table = /<table class="table-taxinfo">([\s\S]*?)<\/table>/.exec(html);
  if (!table) return null;
  const body = table[1]!;

  const nameMatch = /<th[^>]*itemprop="name"[^>]*>([\s\S]*?)<\/th>/.exec(body);
  const fields: Partial<Record<keyof typeof LABELS, string>> = {};

  for (const row of body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...row[1]!.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)];
    if (cells.length < 2) continue;
    const label = stripHtml(cells[0]![1]!);
    const valueCell = cells[1]![1]!;
    for (const [key, vietnamese] of Object.entries(LABELS) as Array<
      [keyof typeof LABELS, string]
    >) {
      if (label !== vietnamese) continue;
      if (key === "legalRep") {
        const rep = /<span itemprop='name'><a[^>]*>([\s\S]*?)<\/a><\/span>/.exec(valueCell);
        fields[key] = rep ? stripHtml(rep[1]!) || undefined : cellText(valueCell) ?? undefined;
      } else {
        fields[key] = cellText(valueCell) ?? undefined;
      }
    }
  }

  if (!fields.taxCode || !nameMatch) return null;
  return {
    taxCode: fields.taxCode,
    nameVi: stripHtml(nameMatch[1]!),
    nameEn: fields.nameEn ?? null,
    shortName: fields.shortName ?? null,
    status: fields.status ?? null,
    address: fields.address ?? null,
    legalRep: fields.legalRep ?? null,
    phone: fields.phone ?? null,
    activeSince: fields.activeSince ?? null,
    managedBy: fields.managedBy ?? null,
    companyType: fields.companyType ?? null,
    mainIndustry: fields.mainIndustry ?? null,
  };
}

// --- Query handling --------------------------------------------------------

export function normalizeLookupName(name: string): string {
  return name.replace(/\s+/g, " ").trim();
}

// A bare tax code (10 digits, or 13 with an optional branch dash) skips the
// search step and goes straight to the detail page.
export function isTaxCodeQuery(query: string): boolean {
  const compact = query.trim();
  if (!/^[\d-]+$/.test(compact)) return false;
  const digits = compact.replace(/-/g, "");
  return digits.length === 10 || digits.length === 13;
}

// "(NỘP THAY)" rows are tax-filing agent shells, not the company itself.
const NOP_THAY = /\(\s*NỘP THAY\s*\)/i;

// REQ-REG-02: pick only among real candidates. Prefer an exact name match
// (case-insensitive); otherwise the first non-agent hit. Nothing usable means
// no result — never invent a company.
export function pickBestCandidate(
  candidates: RegistryCandidate[],
  query: string,
): RegistryCandidate | null {
  const eligible = candidates.filter((c) => !NOP_THAY.test(c.name));
  if (eligible.length === 0) return null;
  const wanted = normalizeLookupName(query).toLocaleLowerCase();
  const exact = eligible.find((c) => c.name.toLocaleLowerCase() === wanted);
  return exact ?? eligible[0]!;
}

// --- Coordinator note ------------------------------------------------------

// REQ-REG-01: only the coordinator reads the result; it is one Chinese note
// that always carries the source link. Rows with no data are omitted.
export function composeRegistryText(input: {
  record: RegistryRecord;
  sourceUrl: string;
  candidates: RegistryCandidate[];
}): string {
  const { record, sourceUrl, candidates } = input;
  const lines: string[] = ["目标公司工商查询结果", `公司名（越南语）：${record.nameVi}`];
  const optional: Array<[string, string | null]> = [
    ["英文名", record.nameEn],
    ["登记状态", record.status],
    ["法定代表人", record.legalRep],
    ["注册地址", record.address],
    ["电话", record.phone],
    ["成立日期", record.activeSince],
    ["主管机关", record.managedBy],
    ["企业类型", record.companyType],
    ["主营行业", record.mainIndustry],
  ];
  lines.push(`税号：${record.taxCode}`);
  for (const [label, value] of optional) {
    if (value) lines.push(`${label}：${value}`);
  }
  lines.push(
    `来源：${sourceUrl}（公开镜像数据，正式登记以越南国家企业登记网 dangkyquamang.dkkd.gov.vn 为准）`,
  );
  const others = candidates.filter((c) => c.taxCode !== record.taxCode);
  if (others.length > 0) {
    const list = others.map((c) => `${c.taxCode} ${c.name}`).join("；");
    lines.push(`其他候选公司（${others.length} 家）：${list}`);
  }
  return lines.join("\n");
}

// --- Worker trigger --------------------------------------------------------

export interface RegistryLookupState {
  status: string;
  queryName: string | null;
}

// Queue only a never-run lookup that has a coordinator-supplied name. A case
// without a name is skipped — the agent asks (REQ-BRIEF-02) instead of
// inventing one (REQ-REG-02).
export function shouldQueueLookup(lookup: RegistryLookupState): boolean {
  return lookup.status === "none" && !!lookup.queryName;
}


// --- Service (DB) ------------------------------------------------------------

export interface RegistryView {
  status: string;
  queryName: string | null;
  resultText: string | null;
  sourceUrl: string | null;
  lookedUpAt: Date | null;
  candidates: Array<{ taxCode: string; name: string }> | null;
}

function toRegistryView(row: CaseRegistryLookup | null): RegistryView {
  if (!row) {
    return {
      status: "none",
      queryName: null,
      resultText: null,
      sourceUrl: null,
      lookedUpAt: null,
      candidates: null,
    };
  }
  return {
    status: row.status,
    queryName: row.queryName,
    resultText: row.resultText,
    sourceUrl: row.sourceUrl,
    lookedUpAt: row.lookedUpAt,
    candidates: Array.isArray(row.candidates)
      ? (row.candidates as Array<{ taxCode: string; name: string }>)
      : null,
  };
}

async function requireCoordinatorMember(caseId: string, user: User) {
  const member = await requireCaseMember(caseId, user);
  if (member.memberRole !== "coordinator") throw new ApiError(403, "forbidden");
  return member;
}

// REQ-REG-01: the lookup result is for the coordinator only. Clients and
// lawyers get the same 404 as a missing case.
export async function getRegistryView(caseId: string, user: User): Promise<RegistryView> {
  try {
    await requireCoordinatorMember(caseId, user);
  } catch {
    throw new ApiError(404, "not_found");
  }
  const row = await prisma.caseRegistryLookup.findUnique({ where: { caseId } });
  return toRegistryView(row);
}

const MAX_QUERY_CHARS = 200;

// REQ-REG-02: the name comes from the coordinator (or a tax code). Setting it
// queues the lookup; changing it re-queues.
export async function setRegistryQuery(
  caseId: string,
  user: User,
  body: Record<string, unknown>,
): Promise<RegistryView> {
  try {
    await requireCoordinatorMember(caseId, user);
  } catch {
    throw new ApiError(404, "not_found");
  }
  await requireWritableCase(caseId);
  const raw = body.name;
  if (typeof raw !== "string") throw new ApiError(400, "query_required");
  const queryName = [...normalizeLookupName(raw)].slice(0, MAX_QUERY_CHARS).join("");
  if (queryName.length < 2) throw new ApiError(400, "query_required");
  const row = await prisma.caseRegistryLookup.upsert({
    where: { caseId },
    create: { caseId, queryName, status: "queued" },
    update: {
      queryName,
      status: "queued",
      attempts: 0,
      nextRetryAt: null,
    },
  });
  await recordAudit(prisma, {
    actorId: user.id,
    action: "registry.query",
    result: "success",
    targetType: "case",
    targetId: caseId,
    caseId,
    meta: { queryName },
  });
  return toRegistryView(row);
}

// Worker trigger (REQ-REG-01/02): queue never-run lookups that already carry a
// coordinator-supplied name. Cases without a name are skipped — never invent.
export async function queueRegistryLookups(): Promise<number> {
  const cases = await prisma.case.findMany({
    where: { status: "active" },
    select: { id: true },
  });
  let queued = 0;
  for (const kase of cases) {
    const lookup = await prisma.caseRegistryLookup.findUnique({ where: { caseId: kase.id } });
    if (!lookup || !shouldQueueLookup(lookup)) continue;
    await prisma.caseRegistryLookup.update({
      where: { caseId: kase.id },
      data: { status: "queued", nextRetryAt: null },
    });
    queued += 1;
  }
  return queued;
}

export async function findDueRegistryRows(now: Date): Promise<CaseRegistryLookup[]> {
  return prisma.caseRegistryLookup.findMany({
    where: {
      status: "queued",
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
    },
    orderBy: { createdAt: "asc" },
  });
}

const MASOTHUE_BASE = "https://masothue.com";

// One queued lookup: search (unless the query is a bare tax code), pick the
// best candidate, fetch and parse the detail page, and store the coordinator
// note. No candidate means no_match — the name is never invented (REQ-REG-02).
// Rate limiting waits two minutes without spending attempts; other faults
// retry with backoff up to three attempts, then failed.
export async function runRegistryLookupStep(row: CaseRegistryLookup): Promise<CaseRegistryLookup> {
  const claimed = await prisma.caseRegistryLookup.updateMany({
    where: { id: row.id, status: "queued" },
    data: { status: "processing" },
  });
  if (claimed.count === 0) {
    return prisma.caseRegistryLookup.findUniqueOrThrow({ where: { id: row.id } });
  }
  const current = await prisma.caseRegistryLookup.findUniqueOrThrow({ where: { id: row.id } });

  try {
    const query = current.queryName;
    if (!query) throw new LlmFailure("format");
    const provider = getRegistryProvider();

    let candidates: RegistryCandidate[] = [];
    let detailPath: string;
    if (isTaxCodeQuery(query)) {
      detailPath = `/${query.replace(/-/g, "")}`;
    } else {
      const searchHtml = await provider.searchByName(query);
      candidates = parseMasothueSearchHtml(searchHtml);
      const best = pickBestCandidate(candidates, query);
      if (!best) {
        return await prisma.caseRegistryLookup.update({
          where: { id: row.id },
          data: {
            status: "no_match",
            candidates: candidates.map((c) => ({ taxCode: c.taxCode, name: c.name })),
            lookedUpAt: new Date(),
            attempts: 0,
          },
        });
      }
      detailPath = best.path;
    }

    const detailHtml = await provider.fetchDetail(detailPath);
    const record = parseMasothueDetailHtml(detailHtml);
    if (!record) throw new LlmFailure("format");

    const sourceUrl = `${MASOTHUE_BASE}${detailPath}`;
    const resultText = composeRegistryText({ record, sourceUrl, candidates });
    return await prisma.caseRegistryLookup.update({
      where: { id: row.id },
      data: {
        status: "ready",
        taxCode: record.taxCode,
        nameVi: record.nameVi,
        nameEn: record.nameEn,
        statusText: record.status,
        address: record.address,
        legalRep: record.legalRep,
        mainIndustry: record.mainIndustry,
        sourceUrl,
        candidates: candidates.map((c) => ({ taxCode: c.taxCode, name: c.name })),
        resultText,
        lookedUpAt: new Date(),
        attempts: 0,
        nextRetryAt: null,
      },
    });
  } catch (error) {
    const kind = error instanceof LlmFailure ? error.kind : "unknown";
    console.error("registry_lookup_failed", {
      kind,
      attempts: current.attempts + 1,
      message: error instanceof Error ? error.message : String(error ?? ""),
    });
    if (kind === "rate_limited") {
      return prisma.caseRegistryLookup.update({
        where: { id: row.id },
        data: { status: "queued", nextRetryAt: new Date(Date.now() + 2 * 60_000) },
      });
    }
    const attempts = current.attempts + 1;
    if (attempts >= 3) {
      return prisma.caseRegistryLookup.update({
        where: { id: row.id },
        data: { status: "failed", attempts },
      });
    }
    return prisma.caseRegistryLookup.update({
      where: { id: row.id },
      data: {
        status: "queued",
        attempts,
        nextRetryAt: new Date(Date.now() + attempts * 60_000),
      },
    });
  }
}
