import { z } from "zod";

export const createWorkOrderSchema = z.object({
  paddyLotId: z.string().min(1, "Lot padi harus dipilih"),
  targetProducts: z.array(z.string()).min(1, "Minimal pilih satu target produk"),
  estimatedOutput: z.coerce.number().positive("Estimasi output harus lebih dari 0"),
  deadline: z.coerce.date().refine((val) => {
    return val > new Date();
  }, { message: "Deadline harus di masa depan" }),
  notes: z.string().optional(),
});

export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;
