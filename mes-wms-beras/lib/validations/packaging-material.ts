import { z } from "zod";

export const createPackagingMaterialSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  unit: z.string().min(1, "Unit is required"),
  currentStock: z.number().int().min(0).default(0),
  minimumStock: z.number().int().min(0).default(0),
});

export const editPackagingMaterialSchema = createPackagingMaterialSchema
  .partial()
  .omit({ code: true });

export type CreatePackagingMaterialInput = z.infer<typeof createPackagingMaterialSchema>;
export type EditPackagingMaterialInput = z.infer<typeof editPackagingMaterialSchema>;
