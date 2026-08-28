import { buildObjectKey, createUploadUrl } from "../../utils/objectStorage.js";

export const createReceiptUploadUrl = async ({ folder, fileName, contentType }) => {
  const key = buildObjectKey(folder, fileName);
  const uploadUrl = await createUploadUrl(key, contentType);

  // key is what the client sends back later (e.g. as a lot's
  // receiptKey) - uploadUrl is single-use and only good for the PUT.
  return { key, uploadUrl };
};
