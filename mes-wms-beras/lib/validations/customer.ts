import { z } from "zod";

export const createCustomerSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["TOKO", "DISTRIBUTOR", "SUPERMARKET", "HORECA", "KOPERASI"]),
  deliveryAddress: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

export const editCustomerSchema = createCustomerSchema.partial().omit({ code: true });

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type EditCustomerInput = z.infer<typeof editCustomerSchema>;
