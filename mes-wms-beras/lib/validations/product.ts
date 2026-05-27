import { z } from "zod";

export const createProductSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  type: z.enum(["PREMIUM", "MEDIUM", "PATAH", "BY_PRODUCT"]),
  packagingVariants: z.array(
    z.object({ size: z.number().positive(), unit: z.string() })
  ),
  pricePerKg: z.number().positive("Price must be positive"),
  minimumStock: z.number().int().min(0).default(0),
});

export const editProductSchema = createProductSchema.partial().omit({ sku: true });

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type EditProductInput = z.infer<typeof editProductSchema>;
