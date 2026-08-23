import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v7 as uuidv7 } from "uuid";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { env } from "../config/env.js";
import { rawMaterials } from "../modules/inventory/rawMaterial.schema.js";
import { materialLots } from "../modules/inventory/materialLot.schema.js";
import { vendors } from "../modules/inventory/vendor.schema.js";

// A tiny, genuinely valid one-page PDF ("Sample Purchase Receipt"),
// written by hand rather than pulled from a binary fixture - this lets
// the seed script stay a plain .js file with no extra asset to ship.
const SAMPLE_RECEIPT_PDF = Buffer.from(
  `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 150]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj
4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
5 0 obj<</Length 96>>
stream
BT /F1 14 Tf 20 110 Td (Break Times Bakery) Tj 0 -20 Td (Sample Purchase Receipt) Tj ET
endstream
endobj
xref
0 6
0000000000 65535 f
trailer<</Size 6/Root 1 0 R>>
startxref
0
%%EOF`,
  "utf-8",
);

const RECEIPT_KEY = "receipts/raw-materials/seed-sample-receipt.pdf";

const s3 = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const uploadSampleReceipt = async () => {
  await s3.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: RECEIPT_KEY,
      Body: SAMPLE_RECEIPT_PDF,
      ContentType: "application/pdf",
    }),
  );
  console.log(`Uploaded sample receipt to ${RECEIPT_KEY}`);
};

const materials = [
  {
    name: "Maida (Refined Flour)",
    unit: "kg",
    lowStockAt: 20,
    lots: [
      { qty: 100, rate: 42, vendor: "Sunrise Flour Mills", daysAgo: 25, withReceipt: true },
      { qty: 60, rate: 44, vendor: "Sunrise Flour Mills", daysAgo: 6, withReceipt: false },
    ],
  },
  {
    name: "Sugar",
    unit: "kg",
    lowStockAt: 15,
    lots: [
      { qty: 80, rate: 46, vendor: "Om Sweeteners", daysAgo: 18, withReceipt: true },
      { qty: 10, rate: 48, vendor: "Om Sweeteners", daysAgo: 2, withReceipt: false },
    ],
  },
  {
    name: "Butter",
    unit: "kg",
    lowStockAt: 10,
    lots: [{ qty: 8, rate: 520, vendor: "Amul Distributors", daysAgo: 4, withReceipt: true }],
  },
  {
    name: "Yeast",
    unit: "kg",
    lowStockAt: 3,
    lots: [{ qty: 5, rate: 380, vendor: "Baker's Supply Co", daysAgo: 10, withReceipt: false }],
  },
  {
    name: "Milk",
    unit: "litre",
    lowStockAt: 25,
    lots: [
      { qty: 40, rate: 58, vendor: "Local Dairy Co-op", daysAgo: 3, withReceipt: true },
      { qty: 20, rate: 58, vendor: "Local Dairy Co-op", daysAgo: 1, withReceipt: false },
    ],
  },
  {
    name: "Chocolate Chips",
    unit: "kg",
    lowStockAt: 8,
    lots: [{ qty: 12, rate: 640, vendor: "Cocoa House", daysAgo: 15, withReceipt: true }],
  },
];

const isoDaysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const upsertVendor = async (name) => {
  const existing = await db.select({ id: vendors.id }).from(vendors).where(eq(vendors.name, name));
  if (existing[0]) return existing[0].id;

  const id = uuidv7();
  await db.insert(vendors).values({ id, name });
  return id;
};

const run = async () => {
  await uploadSampleReceipt();

  for (const material of materials) {
    const existing = await db
      .select({ id: rawMaterials.id })
      .from(rawMaterials)
      .where(eq(rawMaterials.name, material.name));

    if (existing[0]) {
      console.log(`Skipping ${material.name}, already exists`);
      continue;
    }

    const materialId = uuidv7();
    await db.insert(rawMaterials).values({
      id: materialId,
      name: material.name,
      unit: material.unit,
      lowStockAt: material.lowStockAt,
    });

    for (const lot of material.lots) {
      const vendorId = await upsertVendor(lot.vendor);

      await db.insert(materialLots).values({
        id: uuidv7(),
        rawMaterialId: materialId,
        vendorId,
        originalQty: lot.qty,
        remainingQty: lot.qty,
        unitCost: lot.rate,
        purchaseDate: isoDaysAgo(lot.daysAgo),
        receiptKey: lot.withReceipt ? RECEIPT_KEY : null,
      });
    }

    console.log(`Created ${material.name} with ${material.lots.length} lot(s)`);
  }

  process.exit(0);
};

run().catch((err) => {
  console.error("Seeding failed", err);
  process.exit(1);
});
