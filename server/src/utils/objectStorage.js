import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v7 as uuidv7 } from "uuid";
import { env } from "../config/env.js";

// R2 is S3-API-compatible, so the AWS SDK works against it as-is with a
// custom endpoint and "auto" region.
const client = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const UPLOAD_URL_TTL_SECONDS = 5 * 60; // time to actually PUT the file
const READ_URL_TTL_SECONDS = 15 * 60; // time a viewed receipt link stays valid

// The bucket is private - nothing is ever served from a stored key
// directly, only through a freshly-signed URL generated at request time.
export const buildObjectKey = (folder, fileName) => {
  const safeName = (fileName || "file").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
  return `${folder}/${uuidv7()}-${safeName}`;
};

export const createUploadUrl = (key, contentType) => {
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn: UPLOAD_URL_TTL_SECONDS });
};

export const createReadUrl = (key) => {
  if (!key) return null;

  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn: READ_URL_TTL_SECONDS });
};
