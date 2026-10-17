import { LlmFailure } from "../llm/interface";

import type { RegistryProvider } from "./interface";

const BASE_URL = "https://masothue.com";
const TIMEOUT_MS = 30_000;
const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

// T18 (REQ-REG-01): the public masothue.com mirror of the Vietnam tax
// registration. The official registry (dangkyquamang.dkkd.gov.vn) sits behind
// a login/captcha wall; masothue carries the same data without credentials
// (verified 2026-10-17, see PLAN T18). Be polite: the worker paces calls.
export class MasothueRegistryProvider implements RegistryProvider {
  readonly id = "masothue";

  async searchByName(name: string): Promise<string> {
    const url = `${BASE_URL}/Search/?q=${encodeURIComponent(name)}&type=company`;
    return this.get(url);
  }

  async fetchDetail(path: string): Promise<string> {
    // A bare tax code is also a valid detail path on masothue.
    const url = path.startsWith("/") ? `${BASE_URL}${path}` : `${BASE_URL}/${path}`;
    return this.get(url);
  }

  private async get(url: string): Promise<string> {
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, "Accept-Language": "vi,en;q=0.8" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: "follow",
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "TimeoutError") {
        throw new LlmFailure("timeout");
      }
      throw new LlmFailure("server");
    }
    if (response.status === 429) throw new LlmFailure("rate_limited");
    if (!response.ok) throw new LlmFailure("server");
    return response.text();
  }
}
