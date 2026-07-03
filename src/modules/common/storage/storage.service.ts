import { Readable } from "stream";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

import { s3Client } from "./s3.client";
import { storageConfig } from "./storage.config";

export interface StoredObject {
  body: Readable;
  contentType?: string;
  contentLength?: number;
}

export class StorageService {
  async uploadObject(key: string, body: Buffer, contentType: string): Promise<void> {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: storageConfig.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ContentLength: body.length,
      })
    );
  }

  async deleteObject(key: string): Promise<void> {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: storageConfig.bucket,
        Key: key,
      })
    );
  }

  async getObject(key: string): Promise<StoredObject> {
    const result = await s3Client.send(
      new GetObjectCommand({
        Bucket: storageConfig.bucket,
        Key: key,
      })
    );

    return {
      body: result.Body as Readable,
      contentType: result.ContentType,
      contentLength: result.ContentLength,
    };
  }
}

export const storageService = new StorageService();
