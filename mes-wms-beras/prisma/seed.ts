import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // ============================================================
  // 1. Paddy Varieties (5 records)
  // ============================================================
  const varieties = [
    { code: "VAR-IR64", name: "IR64", description: "Most common variety in West Java" },
    { code: "VAR-CIH", name: "Ciherang", description: "Premium quality, popular" },
    { code: "VAR-PW", name: "Pandan Wangi", description: "Very premium quality, fragrant" },
    { code: "VAR-IR42", name: "IR42", description: "Medium quality" },
    { code: "VAR-LOK", name: "Lokal/Campuran", description: "Unidentified/mixed" },
  ];

  for (const v of varieties) {
    await prisma.paddyVariety.upsert({
      where: { code: v.code },
      update: {},
      create: v,
    });
  }
  console.log("✅ Paddy varieties seeded");

  // ============================================================
  // 2. Users (5 records)
  // ============================================================
  const users = [
    { name: "Ahmad Yusuf", email: "admin@berasnusantara.com", role: "ADMIN" as const, password: "Admin123!" },
    { name: "Budi Santoso", email: "budi@berasnusantara.com", role: "OPR_PROD" as const, password: "Operator1!" },
    { name: "Citra Dewi", email: "citra@berasnusantara.com", role: "OPR_PROD" as const, password: "Operator1!" },
    { name: "Dani Permana", email: "dani@berasnusantara.com", role: "OPR_WHS" as const, password: "Gudang123!" },
    { name: "Eko Prasetyo", email: "eko@berasnusantara.com", role: "DRIVER" as const, password: "Driver123!" },
  ];

  const userRecords: Record<string, string> = {};
  for (const u of users) {
    const hashedPassword = await hash(u.password, 12);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { name: u.name, email: u.email, role: u.role, password: hashedPassword },
    });
    userRecords[u.email] = user.id;
  }
  console.log("✅ Users seeded");

  // ============================================================
  // 3. Suppliers (5 records)
  // ============================================================
  const suppliers = [
    { code: "SUP-001", name: "Pak Hasan", address: "Ds. Sukamulya, Karawang", phone: "0812-1111-0001", region: "Karawang", city: "Karawang", province: "Jawa Barat" },
    { code: "SUP-002", name: "Bu Sari", address: "Ds. Cibuaya, Karawang", phone: "0812-1111-0002", region: "Karawang", city: "Karawang", province: "Jawa Barat" },
    { code: "SUP-003", name: "UD. Mitra Tani", address: "Jl. Raya Subang No.12", phone: "0812-1111-0003", region: "Subang", city: "Subang", province: "Jawa Barat" },
    { code: "SUP-004", name: "Pak Asep", address: "Ds. Loji, Purwakarta", phone: "0812-1111-0004", region: "Purwakarta", city: "Purwakarta", province: "Jawa Barat" },
    { code: "SUP-005", name: "CV. Gabah Jaya", address: "Jl. Industri No.5, Karawang", phone: "0812-1111-0005", region: "Karawang", city: "Karawang", province: "Jawa Barat" },
  ];

  const supplierRecords: Record<string, string> = {};
  for (const s of suppliers) {
    const supplier = await prisma.supplier.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
    supplierRecords[s.code] = supplier.id;
  }
  console.log("✅ Suppliers seeded");

  // ============================================================
  // 4. Customers (5 records)
  // ============================================================
  const customers = [
    { code: "CUST-001", name: "Toko Sembako Makmur", type: "TOKO" as const, deliveryAddress: "Jl. Pasar Baru No.10, Karawang", phone: "0813-2222-0001", city: "Karawang" },
    { code: "CUST-002", name: "UD. Beras Sejahtera", type: "DISTRIBUTOR" as const, deliveryAddress: "Jl. Raya Bekasi No.45", phone: "0813-2222-0002", city: "Bekasi" },
    { code: "CUST-003", name: "Supermarket Segar", type: "SUPERMARKET" as const, deliveryAddress: "Jl. Ahmad Yani No.88, Karawang", phone: "0813-2222-0003", city: "Karawang" },
    { code: "CUST-004", name: "Warung Nasi Pak Min", type: "HORECA" as const, deliveryAddress: "Jl. Koperasi No.3, Karawang", phone: "0813-2222-0004", city: "Karawang" },
    { code: "CUST-005", name: "Koperasi Warga RW05", type: "KOPERASI" as const, deliveryAddress: "Perum Griya Asri Blok A", phone: "0813-2222-0005", city: "Karawang" },
  ];

  for (const c of customers) {
    await prisma.customer.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }
  console.log("✅ Customers seeded");

  // ============================================================
  // 5. Products (3 records)
  // ============================================================
  const products = [
    {
      sku: "BERAS-PRE",
      name: "Beras Premium Nusantara",
      description: "Premium rice with ≥95% whole grain ratio",
      type: "PREMIUM" as const,
      packagingVariants: [{ size: 5, unit: "kg" }, { size: 10, unit: "kg" }, { size: 25, unit: "kg" }],
      pricePerKg: 14000,
      minimumStock: 100,
    },
    {
      sku: "BERAS-MED",
      name: "Beras Medium Nusantara",
      description: "Medium rice with 80-94% whole grain ratio",
      type: "MEDIUM" as const,
      packagingVariants: [{ size: 5, unit: "kg" }, { size: 10, unit: "kg" }, { size: 25, unit: "kg" }],
      pricePerKg: 11000,
      minimumStock: 200,
    },
    {
      sku: "BERAS-PAT",
      name: "Beras Patah Nusantara",
      description: "Broken rice with <80% whole grain ratio",
      type: "PATAH" as const,
      packagingVariants: [{ size: 10, unit: "kg" }, { size: 25, unit: "kg" }, { size: 50, unit: "kg" }],
      pricePerKg: 8000,
      minimumStock: 100,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
  }
  console.log("✅ Products seeded");

  // ============================================================
  // 6. Machines (8 records)
  // ============================================================
  const machines = [
    { code: "DRYER-01", name: "Dryer Utama", type: "DRYER" as const, capacityKgPerBatch: 5000, capacityKgPerHour: null },
    { code: "HUSKER-01", name: "Husker 1", type: "HUSKER" as const, capacityKgPerBatch: 2000, capacityKgPerHour: null },
    { code: "HUSKER-02", name: "Husker 2", type: "HUSKER" as const, capacityKgPerBatch: 2000, capacityKgPerHour: null },
    { code: "POLISHER-01", name: "Polisher 1", type: "POLISHER" as const, capacityKgPerBatch: 2000, capacityKgPerHour: null },
    { code: "POLISHER-02", name: "Polisher 2", type: "POLISHER" as const, capacityKgPerBatch: 2000, capacityKgPerHour: null },
    { code: "COLOR-SORTER-01", name: "Color Sorter", type: "COLOR_SORTER" as const, capacityKgPerBatch: null, capacityKgPerHour: 3000 },
    { code: "CLASSIFIER-01", name: "Classifier/Grader", type: "CLASSIFIER" as const, capacityKgPerBatch: null, capacityKgPerHour: 3000 },
    { code: "PACKER-01", name: "Mesin Packing", type: "PACKER" as const, capacityKgPerBatch: null, capacityKgPerHour: null },
  ];

  for (const m of machines) {
    await prisma.machine.upsert({
      where: { code: m.code },
      update: {},
      create: {
        ...m,
        status: "ACTIVE",
        lastMaintenanceDate: new Date("2024-01-01"),
        nextMaintenanceDate: new Date("2024-07-01"),
      },
    });
  }
  console.log("✅ Machines seeded");

  // ============================================================
  // 7. Warehouse Locations
  // ============================================================

  // Raw Material locations
  const rmLocations = [
    { code: "RM-A", name: "Area A - Quarantine (Pre-QC)", type: "QUARANTINE" as const, capacitySak: 200 },
    { code: "RM-B", name: "Area B - IR64 Storage", type: "RAW_MATERIAL" as const, capacitySak: 500 },
    { code: "RM-C", name: "Area C - Other Variety Storage", type: "RAW_MATERIAL" as const, capacitySak: 300 },
    { code: "RM-D", name: "Area D - Drying Area", type: "RAW_MATERIAL" as const, capacitySak: 200 },
  ];

  // Finished Goods locations
  const fgLocations: Array<{ code: string; name: string; type: "FINISHED_GOODS" | "QUARANTINE"; capacitySak: number }> = [];

  // Rak A (A-01 to A-10): Premium
  for (let i = 1; i <= 10; i++) {
    fgLocations.push({
      code: `A-${String(i).padStart(2, "0")}`,
      name: `Rack A-${String(i).padStart(2, "0")} (Premium)`,
      type: "FINISHED_GOODS",
      capacitySak: 100,
    });
  }

  // Rak B (B-01 to B-15): Medium
  for (let i = 1; i <= 15; i++) {
    fgLocations.push({
      code: `B-${String(i).padStart(2, "0")}`,
      name: `Rack B-${String(i).padStart(2, "0")} (Medium)`,
      type: "FINISHED_GOODS",
      capacitySak: 100,
    });
  }

  // Rak C (C-01 to C-10): Broken Rice
  for (let i = 1; i <= 10; i++) {
    fgLocations.push({
      code: `C-${String(i).padStart(2, "0")}`,
      name: `Rack C-${String(i).padStart(2, "0")} (Broken)`,
      type: "FINISHED_GOODS",
      capacitySak: 100,
    });
  }

  // Quarantine area
  fgLocations.push({
    code: "KAR",
    name: "Quarantine Zone - Problem Products",
    type: "QUARANTINE",
    capacitySak: 50,
  });

  const allLocations = [...rmLocations, ...fgLocations];
  for (const loc of allLocations) {
    await prisma.warehouseLocation.upsert({
      where: { code: loc.code },
      update: {},
      create: loc,
    });
  }
  console.log("✅ Warehouse locations seeded");

  // ============================================================
  // 8. Packaging Materials (7 records)
  // ============================================================
  const packagingMaterials = [
    { code: "PKG-KAR5", name: "Plastic bag 5kg", unit: "pcs", currentStock: 5000, minimumStock: 1000 },
    { code: "PKG-KAR10", name: "Plastic bag 10kg", unit: "pcs", currentStock: 3000, minimumStock: 500 },
    { code: "PKG-KAR25", name: "Plastic bag 25kg", unit: "pcs", currentStock: 2000, minimumStock: 300 },
    { code: "PKG-KAR50", name: "Gunny sack 50kg", unit: "pcs", currentStock: 1000, minimumStock: 200 },
    { code: "PKG-LBL-PRE", name: "Premium Rice Label", unit: "roll", currentStock: 50, minimumStock: 10 },
    { code: "PKG-LBL-MED", name: "Medium Rice Label", unit: "roll", currentStock: 50, minimumStock: 10 },
    { code: "PKG-LBL-PAT", name: "Broken Rice Label", unit: "roll", currentStock: 50, minimumStock: 10 },
  ];

  for (const pkg of packagingMaterials) {
    await prisma.packagingMaterial.upsert({
      where: { code: pkg.code },
      update: {},
      create: pkg,
    });
  }
  console.log("✅ Packaging materials seeded");

  // ============================================================
  // 9. Sample Paddy Lots (3 records)
  // ============================================================
  const varietyIR64 = await prisma.paddyVariety.findUnique({ where: { code: "VAR-IR64" } });
  const varietyCIH = await prisma.paddyVariety.findUnique({ where: { code: "VAR-CIH" } });
  const varietyLOK = await prisma.paddyVariety.findUnique({ where: { code: "VAR-LOK" } });

  const sampleLots = [
    {
      lotNumber: "LOT-20240101-001",
      supplierId: supplierRecords["SUP-001"],
      varietyId: varietyIR64!.id,
      grossWeight: 5200,
      sackWeight: 100,
      netWeight: 4840, // 5200 - 100 - (5200 * 5/100) = 4840
      moistureContent: 18,
      dirtPercentage: 5,
      status: "ANTRIAN_GILING" as const,
      arrivedAt: new Date("2024-01-01T08:00:00"),
    },
    {
      lotNumber: "LOT-20240101-002",
      supplierId: supplierRecords["SUP-003"],
      varietyId: varietyCIH!.id,
      grossWeight: 3100,
      sackWeight: 60,
      netWeight: 2885, // 3100 - 60 - (3100 * 5/100) = 2885
      moistureContent: 13.5,
      dirtPercentage: 5,
      status: "ANTRIAN_GILING" as const,
      arrivedAt: new Date("2024-01-01T10:00:00"),
    },
    {
      lotNumber: "LOT-20240102-001",
      supplierId: supplierRecords["SUP-002"],
      varietyId: varietyLOK!.id,
      grossWeight: 4200,
      sackWeight: 80,
      netWeight: 3910, // 4200 - 80 - (4200 * 5/100) = 3910
      moistureContent: 21,
      dirtPercentage: 5,
      status: "ANTRIAN_GILING" as const,
      arrivedAt: new Date("2024-01-02T08:00:00"),
    },
  ];

  const lotRecords: Record<string, string> = {};
  for (const lot of sampleLots) {
    const record = await prisma.paddyLot.upsert({
      where: { lotNumber: lot.lotNumber },
      update: {},
      create: lot,
    });
    lotRecords[lot.lotNumber] = record.id;
  }
  console.log("✅ Sample paddy lots seeded");

  // ============================================================
  // 10. Incoming QC for 2 of 3 lots (status LULUS)
  // ============================================================
  for (const lotNumber of ["LOT-20240101-001", "LOT-20240101-002"]) {
    const lotId = lotRecords[lotNumber];
    const existing = await prisma.incomingQC.findUnique({ where: { paddyLotId: lotId } });
    if (!existing) {
      await prisma.incomingQC.create({
        data: {
          paddyLotId: lotId,
          moistureContent: lotNumber === "LOT-20240101-001" ? 17.5 : 13.5,
          dirtPercentage: lotNumber === "LOT-20240101-001" ? 4.5 : 3.2,
          colorAroma: "NORMAL",
          result: "LULUS",
          notes: "QC passed — ready for milling queue",
          inspectedAt: new Date("2024-01-01T09:00:00"),
        },
      });
    }
  }
  console.log("✅ Incoming QC seeded");

  // ============================================================
  // 11. Sample Work Orders (2 records)
  // ============================================================
  const adminId = userRecords["admin@berasnusantara.com"];

  const workOrders = [
    {
      woNumber: "WO-20240101-001",
      paddyLotId: lotRecords["LOT-20240101-001"],
      targetProducts: ["PREMIUM", "MEDIUM"],
      estimatedOutput: 3100,
      deadline: new Date("2024-01-03"),
      status: "DRAFT" as const,
      createdById: adminId,
    },
    {
      woNumber: "WO-20240101-002",
      paddyLotId: lotRecords["LOT-20240101-002"],
      targetProducts: ["MEDIUM", "PATAH"],
      estimatedOutput: 1860,
      deadline: new Date("2024-01-03"),
      status: "DRAFT" as const,
      createdById: adminId,
    },
  ];

  const woRecords: Record<string, string> = {};
  for (const wo of workOrders) {
    const record = await prisma.workOrder.upsert({
      where: { woNumber: wo.woNumber },
      update: {},
      create: wo,
    });
    woRecords[wo.woNumber] = record.id;
  }
  console.log("✅ Work orders seeded");

  // ============================================================
  // 12. Work Order Steps (5 steps per WO)
  // ============================================================
  const stepTypes = [
    { stepType: "PENGERINGAN" as const, stepOrder: 1 },
    { stepType: "PENGGILINGAN" as const, stepOrder: 2 },
    { stepType: "PENYOSOHAN" as const, stepOrder: 3 },
    { stepType: "SORTASI_GRADING" as const, stepOrder: 4 },
    { stepType: "PENGEMASAN" as const, stepOrder: 5 },
  ];

  for (const woNumber of Object.keys(woRecords)) {
    const woId = woRecords[woNumber];
    for (const step of stepTypes) {
      const existing = await prisma.workOrderStep.findUnique({
        where: { workOrderId_stepType: { workOrderId: woId, stepType: step.stepType } },
      });
      if (!existing) {
        await prisma.workOrderStep.create({
          data: {
            workOrderId: woId,
            stepType: step.stepType,
            stepOrder: step.stepOrder,
            status: "BELUM_MULAI",
          },
        });
      }
    }
  }
  console.log("✅ Work order steps seeded");

  console.log("\n🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
