// T18 (REQ-REG-01): target-company lookup provider. The boundary carries raw
// HTML only — parsing lives in src/modules/agent/target-company-registry.ts so
// it stays unit-testable without network access. Faults reuse LlmFailure so
// the worker's retry/pacing rules apply unchanged (rate_limited requeues
// without spending an attempt).
export interface RegistryProvider {
  readonly id: string;
  // Raw HTML of the search-results page for a company name.
  searchByName(name: string): Promise<string>;
  // Raw HTML of a company detail page. `path` is the site-relative path from
  // a search hit ("/0901053180-..."), or a bare tax code.
  fetchDetail(path: string): Promise<string>;
}
