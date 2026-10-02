import { Client } from "minio";

import type { StorageProvider } from "./interface";

// MinIO (S3-compatible) private-bucket implementation. Configuration is read
// from process.env at first use so test setup can pin a disposable bucket.
export class MinioStorageProvider implements StorageProvider {
  private client: Client | null = null;
  private ensured: Promise<void> | null = null;

  private getClient(): { client: Client; bucket: string } {
    if (!this.client) {
      this.client = new Client({
        endPoint: process.env.MINIO_ENDPOINT ?? "localhost",
        port: Number(process.env.MINIO_PORT ?? "9000"),
        useSSL: process.env.MINIO_USE_SSL === "true",
        accessKey: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
        secretKey: process.env.MINIO_SECRET_KEY ?? "minioadmin",
      });
    }
    return { client: this.client, bucket: process.env.MINIO_BUCKET ?? "clc-dev-uploads" };
  }

  private async ensureBucket(): Promise<{ client: Client; bucket: string }> {
    const { client, bucket } = this.getClient();
    this.ensured ??= (async () => {
      if (!(await client.bucketExists(bucket))) await client.makeBucket(bucket);
    })();
    await this.ensured;
    return { client, bucket };
  }

  async putObject(key: string, data: Buffer): Promise<void> {
    const { client, bucket } = await this.ensureBucket();
    await client.putObject(bucket, key, data);
  }

  async getObject(key: string): Promise<Buffer> {
    const { client, bucket } = await this.ensureBucket();
    const stream = await client.getObject(bucket, key);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : (chunk as Buffer));
    }
    return Buffer.concat(chunks);
  }

  async copyObject(sourceKey: string, targetKey: string): Promise<void> {
    const { client, bucket } = await this.ensureBucket();
    await client.copyObject(bucket, targetKey, `/${bucket}/${sourceKey}`);
  }
}
