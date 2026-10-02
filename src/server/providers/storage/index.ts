import type { StorageProvider } from "./interface";
import { MinioStorageProvider } from "./minio";

const globalForStorage = globalThis as unknown as { storageProvider?: StorageProvider };

// Only the MinIO implementation exists; an unknown selection fails loudly
// rather than silently switching storage backends.
export function getStorageProvider(): StorageProvider {
  const kind = process.env.STORAGE_PROVIDER ?? "minio";
  if (kind !== "minio") throw new Error(`unsupported STORAGE_PROVIDER: ${kind}`);
  globalForStorage.storageProvider ??= new MinioStorageProvider();
  return globalForStorage.storageProvider;
}
