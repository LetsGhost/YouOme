import { env } from "../../../config/env";

export interface StorageConfig {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export const storageConfig: StorageConfig = {
  endpoint: env.GARAGE_ENDPOINT,
  region: env.GARAGE_REGION,
  bucket: env.GARAGE_BUCKET,
  accessKeyId: env.GARAGE_ACCESS_KEY_ID,
  secretAccessKey: env.GARAGE_SECRET_ACCESS_KEY,
};
