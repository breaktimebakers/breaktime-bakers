import { z } from "zod";

export const areaIdParamSchema = z.object({
  id: z.string().min(1),
});

export const storeIdParamSchema = z.object({
  id: z.string().min(1),
});

export const createAreaSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150),
  city: z.string().trim().min(1, "City is required").max(100),
  pincode: z.string().trim().min(1, "Pincode is required").max(10),
});

export const updateAreaSchema = createAreaSchema;

export const createStoreSchema = z
  .object({
    dealerName: z.string().trim().min(1, "Dealer name is required").max(150),
    shopName: z.string().trim().max(150).optional(),
    dealerPhone: z.string().trim().max(20).optional(),
    storeType: z.enum(["Shop", "Canteen", "Other"]),
    address: z.string().trim().max(500).optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
  })
  // A location is meaningless with only one coordinate - every map
  // reader (client and server) treats "one set, one missing" the same
  // as "no location", so reject that state here rather than letting it
  // silently persist.
  .refine((data) => (data.lat === undefined) === (data.lng === undefined), {
    message: "Latitude and longitude must be provided together",
    path: ["lng"],
  });

export const updateStoreSchema = createStoreSchema;

export const updateStoreStatusSchema = z.object({
  isActive: z.boolean(),
});

export const bulkAssignStoresSchema = z.object({
  storeIds: z.array(z.string().min(1)).min(1, "Select at least one store"),
  areaId: z.string().min(1),
});

export const bulkUnassignStoresSchema = z.object({
  storeIds: z.array(z.string().min(1)).min(1, "Select at least one store"),
});
