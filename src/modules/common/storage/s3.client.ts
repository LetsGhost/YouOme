import { S3Client } from "@aws-sdk/client-s3";

import { storageConfig } from "./storage.config";

// forcePathStyle: Garage (like most self-hosted S3-compatible stores) is
// addressed as http://host:port/<bucket>/<key>, not the AWS-style
// <bucket>.host.com virtual-hosted addressing the SDK defaults to.
export const s3Client = new S3Client({
  endpoint: storageConfig.endpoint,
  region: storageConfig.region,
  forcePathStyle: true,
  credentials: {
    accessKeyId: storageConfig.accessKeyId,
    secretAccessKey: storageConfig.secretAccessKey,
  },
});
