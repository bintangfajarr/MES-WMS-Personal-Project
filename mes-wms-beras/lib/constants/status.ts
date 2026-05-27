// Display labels for all enum statuses
// Used in StatusBadge and other UI components

export const PADDY_LOT_STATUS_LABEL: Record<string, string> = {
  MENUNGGU_QC: "Awaiting QC",
  DITERIMA: "Accepted",
  DITOLAK: "Rejected",
  ANTRIAN_GILING: "Milling Queue",
  RESERVED: "Reserved",
  SEDANG_DIGILING: "Being Milled",
  SELESAI: "Completed",
};

export const WORK_ORDER_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  IN_PROGRESS: "In Progress",
  SELESAI: "Completed",
  CANCELLED: "Cancelled",
};

export const WORK_ORDER_STEP_TYPE_LABEL: Record<string, string> = {
  PENGERINGAN: "Drying",
  PENGGILINGAN: "Husking",
  PENYOSOHAN: "Polishing",
  SORTASI_GRADING: "Sorting & Grading",
  PENGEMASAN: "Packaging",
};

export const WORK_ORDER_STEP_STATUS_LABEL: Record<string, string> = {
  BELUM_MULAI: "Not Started",
  IN_PROGRESS: "In Progress",
  SELESAI: "Completed",
  SKIPPED: "Skipped",
};

export const BATCH_STATUS_LABEL: Record<string, string> = {
  PRODUKSI: "Production",
  DI_GUDANG: "In Warehouse",
  RESERVED: "Reserved",
  SHIPPED: "Shipped",
  EXPIRED: "Expired",
  QUARANTINE: "Quarantine",
};

export const DELIVERY_ORDER_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  CONFIRMED: "Confirmed",
  PICKING: "Picking",
  READY_TO_SHIP: "Ready to Ship",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  PARTIAL_RETURN: "Partial Return",
  CANCELLED: "Cancelled",
};

export const MACHINE_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  MAINTENANCE: "Maintenance",
  INACTIVE: "Inactive",
  BREAKDOWN: "Breakdown",
};

export const MACHINE_TYPE_LABEL: Record<string, string> = {
  DRYER: "Dryer",
  HUSKER: "Husker",
  POLISHER: "Polisher",
  COLOR_SORTER: "Color Sorter",
  CLASSIFIER: "Classifier",
  PACKER: "Packer",
};

export const LOCATION_TYPE_LABEL: Record<string, string> = {
  RAW_MATERIAL: "Raw Material",
  FINISHED_GOODS: "Finished Goods",
  QUARANTINE: "Quarantine",
  BY_PRODUCT: "By-Product",
};

export const LOCATION_STATUS_LABEL: Record<string, string> = {
  KOSONG: "Empty",
  TERISI: "Occupied",
  RESERVED: "Reserved",
};

export const QC_RESULT_LABEL: Record<string, string> = {
  LULUS: "Passed",
  GAGAL: "Failed",
};

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin / Manager",
  OPR_PROD: "Production Operator",
  OPR_WHS: "Warehouse Operator",
  DRIVER: "Driver / Delivery",
};

export const USER_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

export const PRODUCT_TYPE_LABEL: Record<string, string> = {
  PREMIUM: "Premium",
  MEDIUM: "Medium",
  PATAH: "Broken Rice",
  BY_PRODUCT: "By-Product",
};

export const CUSTOMER_TYPE_LABEL: Record<string, string> = {
  TOKO: "Retail Store",
  DISTRIBUTOR: "Distributor",
  SUPERMARKET: "Supermarket",
  HORECA: "Horeca",
  KOPERASI: "Cooperative",
};

export const DOWNTIME_REASON_LABEL: Record<string, string> = {
  BREAKDOWN: "Breakdown",
  MAINTENANCE: "Maintenance",
  SETUP: "Setup",
  LAINNYA: "Other",
};

export const SOSH_LEVEL_LABEL: Record<string, string> = {
  TINGGI: "High (Level 3)",
  SEDANG: "Medium (Level 2)",
};

export const ALERT_TYPE_LABEL: Record<string, string> = {
  STOK_PADI_RENDAH: "Low Paddy Stock",
  STOK_BERAS_RENDAH: "Low Rice Stock",
  KADALUARSA_DEKAT: "Near Expiry",
  YIELD_RENDAH: "Low Yield",
  HUSKING_YIELD_RENDAH: "Low Husking Yield",
  MESIN_MAINTENANCE: "Machine Maintenance Due",
  PADI_TERLAMA: "Paddy Too Long in Storage",
  DO_BELUM_KONFIRMASI: "Delivery Not Confirmed",
};

export const STOCK_MOVEMENT_TYPE_LABEL: Record<string, string> = {
  IN: "In",
  OUT: "Out",
  ADJUSTMENT: "Adjustment",
};
