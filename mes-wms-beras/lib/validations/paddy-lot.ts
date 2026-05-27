import { z } from "zod";

export const createPaddyLotSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  varietyId: z.string().min(1, "Variety is required"),
  grossWeight: z.number().positive("Gross weight must be positive"),
  sackWeight: z.number().min(0, "Sack weight cannot be negative"),
  moistureContent: z.number().min(0).max(30, "Moisture content cannot exceed 30%"),
  dirtPercentage: z.number().min(0).max(100, "Dirt percentage cannot exceed 100%"),
  notes: z.string().optional().nullable(),
});

export const incomingQCSchema = z.object({
  moistureContent: z.number().min(0).max(30, "Moisture content cannot exceed 30%"),
  dirtPercentage: z.number().min(0).max(100, "Dirt percentage cannot exceed 100%"),
  colorAroma: z.enum(["NORMAL", "ABNORMAL"]),
  result: z.enum(["LULUS", "GAGAL"]),
  rejectionReason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreatePaddyLotInput = z.infer<typeof createPaddyLotSchema>;
export type IncomingQCInput = z.infer<typeof incomingQCSchema>;
