import { z } from "zod";

export const createLocationSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["RAW_MATERIAL", "FINISHED_GOODS", "QUARANTINE", "BY_PRODUCT"]),
  capacitySak: z.number().int().min(0).default(0),
});

export const editLocationSchema = createLocationSchema.partial().omit({ code: true });

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type EditLocationInput = z.infer<typeof editLocationSchema>;
