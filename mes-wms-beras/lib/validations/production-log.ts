import { z } from "zod";

export const dryingLogSchema = z.object({
  workOrderId: z.string().min(1, "Work Order ID is required"),
  machineId: z.string().min(1, "Machine ID is required"),
  inputWeight: z.coerce.number().positive("Input weight must be positive"),
  tempCelsius: z.coerce.number().positive("Temperature must be positive"),
  moistureIn: z.coerce.number().positive("Moisture in must be positive"),
  moistureOut: z.coerce.number().positive("Moisture out must be positive"),
  weightAfterDrying: z.coerce.number().positive("Weight after drying must be positive"),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  notes: z.string().optional(),
});

export const huskingLogSchema = z.object({
  workOrderId: z.string().min(1, "Work Order ID is required"),
  machineId: z.string().min(1, "Machine ID is required"),
  inputWeight: z.coerce.number().positive("Input weight must be positive"),
  brownRiceOutput: z.coerce.number().positive("Brown rice output must be positive"),
  huskOutput: z.coerce.number().nonnegative("Husk output must be nonnegative"),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  notes: z.string().optional(),
});

export const polishingLogSchema = z.object({
  workOrderId: z.string().min(1, "Work Order ID is required"),
  machineId: z.string().min(1, "Machine ID is required"),
  inputWeight: z.coerce.number().positive("Input weight must be positive"),
  soshLevel: z.enum(["TINGGI", "SEDANG"]),
  whiteRiceOutput: z.coerce.number().positive("White rice output must be positive"),
  branOutput: z.coerce.number().nonnegative("Bran output must be nonnegative"),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  notes: z.string().optional(),
});

export const sortingLogSchema = z.object({
  workOrderId: z.string().min(1, "Work Order ID is required"),
  inputWeight: z.coerce.number().positive("Input weight must be positive"),
  wholeGrainOutput: z.coerce.number().positive("Whole grain output must be positive"),
  halfBrokenOutput: z.coerce.number().nonnegative("Half broken output must be nonnegative"),
  quarterBrokenOutput: z.coerce.number().nonnegative("Quarter broken output must be nonnegative"),
  rejectedOutput: z.coerce.number().nonnegative("Rejected output must be nonnegative"),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  notes: z.string().optional(),
});

export const packagingLogSchema = z.object({
  workOrderId: z.string().min(1, "Work Order ID is required"),
  items: z.array(
    z.object({
      productId: z.string().min(1, "Product is required"),
      packagingSize: z.coerce.number().positive("Packaging size must be positive"),
      totalSak: z.coerce.number().int().positive("Total sacks must be a positive integer"),
    })
  ).min(1, "At least one packaging item is required"),
  materials: z.array(
    z.object({
      materialId: z.string().min(1, "Material is required"),
      qty: z.coerce.number().int().positive("Quantity must be a positive integer"),
    })
  ).min(1, "At least one packaging material is required"),
  notes: z.string().optional(),
});

export const downtimeLogSchema = z.object({
  machineId: z.string().min(1, "Machine ID is required"),
  reason: z.enum(["BREAKDOWN", "MAINTENANCE", "SETUP", "LAINNYA"]),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().nullable().optional(),
  notes: z.string().optional(),
});

export type DryingLogInput = z.infer<typeof dryingLogSchema>;
export type HuskingLogInput = z.infer<typeof huskingLogSchema>;
export type PolishingLogInput = z.infer<typeof polishingLogSchema>;
export type SortingLogInput = z.infer<typeof sortingLogSchema>;
export type PackagingLogInput = z.infer<typeof packagingLogSchema>;
export type DowntimeLogInput = z.infer<typeof downtimeLogSchema>;
