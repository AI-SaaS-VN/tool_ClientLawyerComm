import { standInProvidersAllowed } from "../stand-in";

import { fakeRegistryProvider } from "./fake";
import type { RegistryProvider } from "./interface";
import { MasothueRegistryProvider } from "./masothue";

// T18 (REQ-REG): registry lookup runs through its own replaceable seam. Only
// "fake" (default, refused in production) and "masothue" are authorized.
export function getRegistryProvider(): RegistryProvider {
  const kind = process.env.REGISTRY_PROVIDER ?? "fake";
  if (kind === "fake") {
    if (!standInProvidersAllowed()) {
      throw new Error("fake registry provider is not allowed in production");
    }
    return fakeRegistryProvider;
  }
  if (kind === "masothue") {
    return new MasothueRegistryProvider();
  }
  throw new Error(`unsupported REGISTRY_PROVIDER: ${kind}`);
}
