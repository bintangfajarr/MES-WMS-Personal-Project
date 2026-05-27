import { cn } from "@/lib/utils";

type StatusType =
  | "paddyLot"
  | "workOrder"
  | "batch"
  | "delivery"
  | "machine"
  | "qc"
  | "user";

const statusColors: Record<string, Record<string, string>> = {
  paddyLot: {
    MENUNGGU_QC: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
    DITERIMA: "bg-green-500/15 text-green-400 border-green-500/25",
    DITOLAK: "bg-red-500/15 text-red-400 border-red-500/25",
    ANTRIAN_GILING: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    RESERVED: "bg-purple-500/15 text-purple-400 border-purple-500/25",
    SEDANG_DIGILING: "bg-orange-500/15 text-orange-400 border-orange-500/25",
    SELESAI: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  },
  workOrder: {
    DRAFT: "bg-slate-500/15 text-slate-400 border-slate-500/25",
    IN_PROGRESS: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    SELESAI: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    CANCELLED: "bg-red-500/15 text-red-400 border-red-500/25",
  },
  batch: {
    PRODUKSI: "bg-orange-500/15 text-orange-400 border-orange-500/25",
    DI_GUDANG: "bg-green-500/15 text-green-400 border-green-500/25",
    RESERVED: "bg-purple-500/15 text-purple-400 border-purple-500/25",
    SHIPPED: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    EXPIRED: "bg-red-500/15 text-red-400 border-red-500/25",
    QUARANTINE: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  },
  delivery: {
    DRAFT: "bg-slate-500/15 text-slate-400 border-slate-500/25",
    CONFIRMED: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    PICKING: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    READY_TO_SHIP: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
    SHIPPED: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
    DELIVERED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    PARTIAL_RETURN: "bg-orange-500/15 text-orange-400 border-orange-500/25",
    CANCELLED: "bg-red-500/15 text-red-400 border-red-500/25",
  },
  machine: {
    ACTIVE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    MAINTENANCE: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
    INACTIVE: "bg-slate-500/15 text-slate-400 border-slate-500/25",
    BREAKDOWN: "bg-red-500/15 text-red-400 border-red-500/25",
  },
  qc: {
    LULUS: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    GAGAL: "bg-red-500/15 text-red-400 border-red-500/25",
  },
  user: {
    ACTIVE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    INACTIVE: "bg-slate-500/15 text-slate-400 border-slate-500/25",
  },
};

const statusLabels: Record<string, string> = {
  // Paddy Lot
  MENUNGGU_QC: "Waiting QC",
  DITERIMA: "Accepted",
  DITOLAK: "Rejected",
  ANTRIAN_GILING: "Milling Queue",
  RESERVED: "Reserved",
  SEDANG_DIGILING: "Milling",
  SELESAI: "Completed",
  // Work Order
  DRAFT: "Draft",
  IN_PROGRESS: "In Progress",
  CANCELLED: "Cancelled",
  // Batch
  PRODUKSI: "Production",
  DI_GUDANG: "In Warehouse",
  SHIPPED: "Shipped",
  EXPIRED: "Expired",
  QUARANTINE: "Quarantine",
  // Delivery
  CONFIRMED: "Confirmed",
  PICKING: "Picking",
  READY_TO_SHIP: "Ready to Ship",
  DELIVERED: "Delivered",
  PARTIAL_RETURN: "Partial Return",
  // Machine
  ACTIVE: "Active",
  MAINTENANCE: "Maintenance",
  INACTIVE: "Inactive",
  BREAKDOWN: "Breakdown",
  // QC
  LULUS: "Passed",
  GAGAL: "Failed",
};

interface StatusBadgeProps {
  status: string;
  type: StatusType;
  className?: string;
}

export default function StatusBadge({
  status,
  type,
  className,
}: StatusBadgeProps) {
  const colorMap = statusColors[type] || {};
  const colors =
    colorMap[status] || "bg-slate-500/15 text-slate-400 border-slate-500/25";
  const label = statusLabels[status] || status;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border whitespace-nowrap",
        colors,
        className
      )}
    >
      {label}
    </span>
  );
}
