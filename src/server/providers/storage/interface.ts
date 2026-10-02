// Private object storage seam (REQ-FILE-02): the bucket is private and
// object keys never leave the server — downloads are proxied through
// GET /api/files/:id/download with per-request authorization (REQ-FILE-06).
export interface StorageProvider {
  putObject(key: string, data: Buffer): Promise<void>;
  getObject(key: string): Promise<Buffer>;
  copyObject(sourceKey: string, targetKey: string): Promise<void>;
}
