import { z } from "zod";

// Create Delivery Order validation schema
export const createDeliveryOrderSchema = z.object({
  customerId: z.string().min(1, "Pelanggan wajib dipilih"),
  driverId: z.string().nullable().optional(),
  deliveryDate: z.string().min(1, "Tanggal pengiriman wajib diisi").transform((val) => new Date(val)),
  items: z
    .array(
      z.object({
        batchId: z.string().min(1, "Batch ID wajib diisi"),
        orderedQty: z
          .number()
          .int()
          .positive("Jumlah ordered harus lebih dari 0"),
        notes: z.string().optional(),
      })
    )
    .min(1, "Minimal 1 item untuk delivery order"),
  notes: z.string().optional(),
});

export type CreateDeliveryOrderInput = z.infer<typeof createDeliveryOrderSchema>;

// Delivery Return validation schema
export const deliveryReturnSchema = z.object({
  items: z
    .array(
      z.object({
        batchId: z.string().min(1, "Batch ID wajib diisi"),
        returnedQty: z
          .number()
          .int()
          .positive("Jumlah retur harus lebih dari 0"),
        reason: z.string().min(1, "Alasan retur wajib diisi"),
      })
    )
    .min(1, "Minimal 1 item untuk pencatatan retur"),
  notes: z.string().optional(),
});

export type DeliveryReturnInput = z.infer<typeof deliveryReturnSchema>;
