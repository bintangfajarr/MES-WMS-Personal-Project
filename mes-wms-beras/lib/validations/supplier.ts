import { z } from "zod";

export const createSupplierSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  region: z.string().optional(),
});

export const editSupplierSchema = createSupplierSchema.partial().omit({ code: true });

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type EditSupplierInput = z.infer<typeof editSupplierSchema>;
