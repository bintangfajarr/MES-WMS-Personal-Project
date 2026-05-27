import { z } from "zod";

export const createMachineSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["DRYER", "HUSKER", "POLISHER", "COLOR_SORTER", "CLASSIFIER", "PACKER"]),
  capacityKgPerBatch: z.number().positive().optional().nullable(),
  capacityKgPerHour: z.number().positive().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  lastMaintenanceDate: z.string().optional().nullable(),
  nextMaintenanceDate: z.string().optional().nullable(),
});

export const editMachineSchema = createMachineSchema.partial().omit({ code: true });

export const updateMachineStatusSchema = z.object({
  status: z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE", "BREAKDOWN"]),
});

export type CreateMachineInput = z.infer<typeof createMachineSchema>;
export type EditMachineInput = z.infer<typeof editMachineSchema>;
