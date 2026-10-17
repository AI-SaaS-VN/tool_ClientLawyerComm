import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  composeRegistryText,
  isTaxCodeQuery,
  normalizeLookupName,
  parseMasothueDetailHtml,
  parseMasothueSearchHtml,
  pickBestCandidate,
  shouldQueueLookup,
} from "@/modules/agent/target-company-registry";

const FIXTURES = path.join(__dirname, "..", "..", "fixtures", "masothue");
const detailHtml = readFileSync(path.join(FIXTURES, "aomaga-detail.html"), "utf-8");
const searchHtml = readFileSync(path.join(FIXTURES, "aomaga-search.html"), "utf-8");
const emptyHtml = readFileSync(path.join(FIXTURES, "search-empty.html"), "utf-8");

// REQ-REG-01: the lookup provider parses the public masothue.com mirror of the
// Vietnam tax registration. These fixtures are trimmed copies of the real
// pages fetched 2026-10-17 (the pilot defendant and a no-hit search).
describe("parseMasothueSearchHtml (REQ-REG-01)", () => {
  it("parses every candidate with tax code, name, path, representative, address", () => {
    const candidates = parseMasothueSearchHtml(searchHtml);
    expect(candidates).toHaveLength(4);
    expect(candidates[0]).toEqual({
      taxCode: "0901053180",
      name: "CÔNG TY TNHH ĐIỆN TỬ AOMAGA (VIỆT NAM)",
      path: "/0901053180-cong-ty-tnhh-dien-tu-aomaga-viet-nam",
      representative: "HUNG, KUO-YI",
      address:
        "Lô TT, đường TS5, Khu công nghiệp Tiên Sơn, Phường Từ Sơn, Tỉnh Bắc Ninh, Việt Nam",
    });
    expect(candidates[3]!.taxCode).toBe("2301226653");
    expect(candidates[3]!.name).toBe("CÔNG TY TNHH ĐIỆN TỬ AOMAGA (VIỆT NAM) (NỘP THAY)");
  });

  it("keeps a candidate whose representative cell is empty", () => {
    const candidates = parseMasothueSearchHtml(searchHtml);
    const dup = candidates.find((c) => c.taxCode === "2301417351");
    expect(dup?.representative).toBeNull();
  });

  it("returns [] when the listing has no entries", () => {
    expect(parseMasothueSearchHtml(emptyHtml)).toEqual([]);
  });
});

describe("parseMasothueDetailHtml (REQ-REG-01)", () => {
  it("extracts the registry fields from the taxinfo table", () => {
    const record = parseMasothueDetailHtml(detailHtml);
    expect(record).toEqual({
      taxCode: "0901053180",
      nameVi: "CÔNG TY TNHH ĐIỆN TỬ AOMAGA (VIỆT NAM)",
      nameEn: "AOMAGA (VIET NAM) ELECTRONIC COMPANY LIMITED",
      shortName: "AOMAGA (VIET NAM).,LTD",
      status: "Chờ xác minh tình trạng hoạt động tại địa chỉ đã đăng ký",
      address:
        "Lô TT, đường TS5, Khu công nghiệp Tiên Sơn, Phường Từ Sơn, Tỉnh Bắc Ninh, Việt Nam",
      legalRep: "HUNG, KUO-YI",
      phone: "02213768985",
      activeSince: "2019-03-19",
      managedBy: "Thuế thành phố Bắc Ninh",
      companyType: "Công ty trách nhiệm hữu hạn ngoài NN",
      mainIndustry: "Sản xuất dây cáp, sợi cáp quang học",
    });
  });

  it("returns null when the page has no taxinfo table", () => {
    expect(parseMasothueDetailHtml("<html><body>not a company page</body></html>")).toBeNull();
  });
});

// The coordinator types either a company name or a plain tax code; a tax code
// skips the search step.
describe("isTaxCodeQuery / normalizeLookupName", () => {
  it("accepts 10 or 13 digit codes, with or without dashes", () => {
    expect(isTaxCodeQuery("0901053180")).toBe(true);
    expect(isTaxCodeQuery("0901053180-001")).toBe(true);
    expect(isTaxCodeQuery("aomaga")).toBe(false);
    expect(isTaxCodeQuery("090105318")).toBe(false);
  });

  it("trims and collapses whitespace", () => {
    expect(normalizeLookupName("  Công ty   Aomaga \n")).toBe("Công ty Aomaga");
  });
});

// REQ-REG-02: never invent — pick only from real candidates; "(NỘP THAY)"
// rows are tax-filing agents, not the company itself.
describe("pickBestCandidate (REQ-REG-02)", () => {
  const candidates = parseMasothueSearchHtml(searchHtml);

  it("prefers an exact name match over the first hit", () => {
    const best = pickBestCandidate(candidates, "Công ty TNHH Đồng Kỹ Thuật Aomaga Việt Nam");
    expect(best?.taxCode).toBe("2301195331");
  });

  it("skips NỘP THAY agent rows", () => {
    const best = pickBestCandidate(candidates, "aomaga");
    expect(best?.taxCode).toBe("0901053180");
  });

  it("returns null when only NỘP THAY rows remain", () => {
    const only = candidates.filter((c) => c.taxCode === "2301226653");
    expect(pickBestCandidate(only, "aomaga")).toBeNull();
  });

  it("returns null for an empty result list", () => {
    expect(pickBestCandidate([], "aomaga")).toBeNull();
  });
});

// REQ-REG-01: the coordinator reads one Chinese note that always carries the
// source link back to the registry mirror.
describe("composeRegistryText", () => {
  it("includes every stored field, the source URL, and other candidates", () => {
    const record = parseMasothueDetailHtml(detailHtml)!;
    const candidates = parseMasothueSearchHtml(searchHtml);
    const text = composeRegistryText({
      record,
      sourceUrl: "https://masothue.com/0901053180-cong-ty-tnhh-dien-tu-aomaga-viet-nam",
      candidates,
    });
    expect(text).toContain("0901053180");
    expect(text).toContain("CÔNG TY TNHH ĐIỆN TỬ AOMAGA (VIỆT NAM)");
    expect(text).toContain("AOMAGA (VIET NAM) ELECTRONIC COMPANY LIMITED");
    expect(text).toContain("Chờ xác minh tình trạng hoạt động tại địa chỉ đã đăng ký");
    expect(text).toContain("HUNG, KUO-YI");
    expect(text).toContain("https://masothue.com/0901053180-cong-ty-tnhh-dien-tu-aomaga-viet-nam");
    expect(text).toContain("2301195331");
  });
});

// Worker trigger: queue only when a coordinator-supplied name exists and no
// lookup is queued, running, or already settled. No name → never invent one.
describe("shouldQueueLookup (REQ-REG-01/02)", () => {
  it("queues a named lookup that has never run", () => {
    expect(shouldQueueLookup({ status: "none", queryName: "Aomaga" })).toBe(true);
  });

  it("never queues without a coordinator-supplied name", () => {
    expect(shouldQueueLookup({ status: "none", queryName: null })).toBe(false);
  });

  it("never doubles a queued or running lookup", () => {
    for (const status of ["queued", "processing"]) {
      expect(shouldQueueLookup({ status, queryName: "Aomaga" })).toBe(false);
    }
  });

  it("never re-runs a settled lookup on its own", () => {
    for (const status of ["ready", "failed", "no_match"]) {
      expect(shouldQueueLookup({ status, queryName: "Aomaga" })).toBe(false);
    }
  });
});
