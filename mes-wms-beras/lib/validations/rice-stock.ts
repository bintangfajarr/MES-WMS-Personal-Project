import { z } from "zod";

// Inbound: receive a batch from production into the warehouse
export const inboundSchema = z.object({
  batchId: z.string().min(1, "Batch ID wajib diisi"),
  locationId: z.string().min(1, "Lokasi gudang wajib dipilih"),
  confirmedQty: z
    .number()
    .int()
    .positive("Jumlah konfirmasi harus lebih dari 0"),
  condition: z
    .string()
    .min(1, "Kondisi wajib diisi")
    .default("BAIK"),
  notes: z.string().optional(),
});

export type InboundInput = z.infer<typeof inboundSchema>;

// Stock Opname: physical stock count
export const stockOpnameSchema = z.object({
  items: z
    .array(
      z.object({
        batchId: z.string().min(1, "Batch ID wajib diisi"),
        physicalQty: z
          .number()
          .int()
          .min(0, "Jumlah fisik tidak boleh negatif"),
        notes: z.string().optional(),
      })
    )
    .min(1, "Minimal 1 item untuk stock opname"),
  notes: z.string().optional(),
});

export type StockOpnameInput = z.infer<typeof stockOpnameSchema>;
