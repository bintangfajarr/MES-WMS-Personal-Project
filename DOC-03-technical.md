# DOC-03 — Technical Document
## Sistem MES + WMS Pabrik Penggilingan Padi
### PT. Beras Nusantara

---

> **Prasyarat:** Baca DOC-01 (Business Process) dan DOC-02 (Requirements) sebelum dokumen ini.
> Dokumen ini mendefinisikan **bagaimana sistem dibangun** — ERD, Prisma schema lengkap, arsitektur, dan deployment.

---

## Daftar Isi

1. [Arsitektur Sistem](#1-arsitektur-sistem)
2. [Entity Relationship Diagram (ERD)](#2-entity-relationship-diagram-erd)
3. [Prisma Schema Lengkap](#3-prisma-schema-lengkap)
4. [Penjelasan Relasi Antar Tabel](#4-penjelasan-relasi-antar-tabel)
5. [Kalkulasi & Business Logic Utilities](#5-kalkulasi--business-logic-utilities)
6. [Deployment Architecture](#6-deployment-architecture)
7. [Environment Variables](#7-environment-variables)
8. [Database Indexing Strategy](#8-database-indexing-strategy)

---

## 1. Arsitektur Sistem

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT (Browser)                   │
│          React (Next.js App Router - RSC)            │
│     Tailwind CSS + shadcn/ui + Recharts              │
└────────────────────┬────────────────────────────────┘
                     │ HTTP / HTTPS
┌────────────────────▼────────────────────────────────┐
│               NEXT.JS SERVER                         │
│  ┌──────────────────┐   ┌────────────────────────┐  │
│  │   App Router      │   │   API Routes            │  │
│  │   (RSC Pages)     │   │   /api/**               │  │
│  └──────────────────┘   └────────────┬───────────┘  │
│                                       │              │
│  ┌────────────────────────────────────▼───────────┐  │
│  │              NextAuth.js                        │  │
│  │         (Session / JWT / RBAC)                  │  │
│  └────────────────────────────────────────────────┘  │
│                                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │              Prisma ORM                         │  │
│  │    (Query Builder + Migration + Type Safety)    │  │
│  └────────────────────┬───────────────────────────┘  │
└───────────────────────┼─────────────────────────────┘
                        │ TCP (Prisma connection pool)
┌───────────────────────▼─────────────────────────────┐
│               PostgreSQL 15                          │
│           (Railway Managed Database)                 │
└─────────────────────────────────────────────────────┘
```

### 1.2 Data Flow — Proses Produksi

```
[OPR_WHS: Catat Penerimaan Padi]
         │
         ▼
[API POST /wms/paddy-lots]
   → Create PaddyLot (status: MENUNGGU_QC)
         │
         ▼
[OPR_WHS: Submit QC]
         │
         ▼
[API POST /wms/paddy-lots/:id/qc]
   → Create IncomingQC
   → Update PaddyLot status → ANTRIAN_GILING
   → Update WarehouseStock (RM) += berat bersih
         │
         ▼
[ADMIN: Buat Work Order]
         │
         ▼
[API POST /mes/work-orders]
   → Create WorkOrder (status: DRAFT)
   → Update PaddyLot status → RESERVED
         │
         ▼
[OPR_PROD: Jalankan setiap step produksi]
         │
         ▼
[API POST /mes/production-logs/:step]
   → Create ProductionLog
   → Update WorkOrderStep status
   → Update WarehouseStock (RM) -= berat issued
   → Update MachineLog (jam operasi)
   → (Step terakhir: packaging)
         │
         ▼
[API POST /mes/production-logs/packaging]
   → Create FinishedGoodsBatch
   → Update WorkOrder status → SELESAI
   → Update PaddyLot status → SELESAI
         │
         ▼
[OPR_WHS: Terima produk ke gudang FG]
         │
         ▼
[API POST /wms/rice-stock/inbound]
   → Update FinishedGoodsBatch → assign lokasi
   → Update WarehouseStock (FG) += jumlah sak
         │
         ▼
[ADMIN: Buat Delivery Order]
         │
         ▼
[API POST /wms/delivery-orders]
   → Create DeliveryOrder
   → Create DeliveryOrderItems
   → Update FinishedGoodsBatch status → RESERVED
         │
         ▼
[DRIVER: Konfirmasi Terkirim]
         │
         ▼
[API PATCH /wms/delivery-orders/:id/delivered]
   → Update DeliveryOrder status → DELIVERED
   → Update FinishedGoodsBatch status → SHIPPED
   → Update WarehouseStock (FG) -= jumlah sak
```

### 1.3 Request Lifecycle (API Route)

```
HTTP Request
     │
     ▼
middleware.ts (cek session, redirect jika belum login)
     │
     ▼
API Route Handler (app/api/**/route.ts)
     │
     ├─ 1. getServerSession() → validasi auth & role
     │
     ├─ 2. Zod parse(request.body) → validasi input
     │
     ├─ 3. prisma.$transaction([...]) → business logic
     │
     └─ 4. Return NextResponse.json({ success, data })
```

---

## 2. Entity Relationship Diagram (ERD)

### 2.1 Gambaran Grup Tabel

```
┌─────────────────────────────────────────────────────────────────────┐
│  MASTER DATA                                                         │
│  User · Product · Supplier · Customer · Machine · WarehouseLocation  │
│  PackagingMaterial · PaddyVariety                                    │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
          ┌─────────────────────┼──────────────────────┐
          │                     │                       │
┌─────────▼──────────┐ ┌───────▼────────┐  ┌──────────▼──────────┐
│   WMS RAW MATERIAL │ │      MES        │  │   WMS FINISHED GOOD │
│   PaddyLot          │ │   WorkOrder     │  │  FinishedGoodsBatch  │
│   IncomingQC        │ │  WorkOrderStep  │  │  RiceStockMovement   │
│   RMStockMovement   │ │  ProductionLog  │  │  StockOpname         │
│                     │ │  DryingLog      │  │  StockOpnameItem     │
│                     │ │  HuskingLog     │  │  DeliveryOrder       │
│                     │ │  PolishingLog   │  │  DeliveryOrderItem   │
│                     │ │  SortingLog     │  │  DeliveryReturn      │
│                     │ │  PackagingLog   │  └─────────────────────┘
│                     │ │  MachineLog     │
│                     │ │  DowntimeLog    │
└─────────────────────┘ └────────────────┘

┌──────────────────────┐
│  SYSTEM              │
│  Alert               │
│  AlertDismissal      │
└──────────────────────┘
```

### 2.2 Relasi Kunci

```
User ──────────────────── (created_by) ──── WorkOrder
User ──────────────────── (driver_id) ────── DeliveryOrder
Supplier ─────────────────────────────────── PaddyLot
PaddyVariety ─────────────────────────────── PaddyLot
PaddyLot ─────────────────────────────────── WorkOrder
PaddyLot ─────────────────────────────────── IncomingQC
WorkOrder ────────────────────────────────── WorkOrderStep (1:N)
WorkOrder ────────────────────────────────── ProductionLog (1:N)
WorkOrder ────────────────────────────────── FinishedGoodsBatch (1:N)
ProductionLog ── (polymorphic via type) ──── DryingLog / HuskingLog / ...
Machine ──────────────────────────────────── ProductionLog
Machine ──────────────────────────────────── DowntimeLog
FinishedGoodsBatch ───────────────────────── DeliveryOrderItem
FinishedGoodsBatch ───────────────────────── WarehouseLocation
Customer ─────────────────────────────────── DeliveryOrder
Product ──────────────────────────────────── FinishedGoodsBatch
PackagingMaterial ────────────────────────── PackagingConsumption
```

---

## 3. Prisma Schema Lengkap

Simpan di `prisma/schema.prisma`.

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================
// ENUMS
// ============================================================

enum Role {
  ADMIN
  OPR_PROD
  OPR_WHS
  DRIVER
}

enum UserStatus {
  ACTIVE
  INACTIVE
}

enum ProductType {
  PREMIUM
  MEDIUM
  PATAH
  BY_PRODUCT
}

enum SupplierStatus {
  ACTIVE
  INACTIVE
}

enum CustomerType {
  TOKO
  DISTRIBUTOR
  SUPERMARKET
  HORECA
  KOPERASI
}

enum CustomerStatus {
  ACTIVE
  INACTIVE
}

enum MachineType {
  DRYER
  HUSKER
  POLISHER
  COLOR_SORTER
  CLASSIFIER
  PACKER
}

enum MachineStatus {
  ACTIVE
  MAINTENANCE
  INACTIVE
  BREAKDOWN
}

enum LocationType {
  RAW_MATERIAL
  FINISHED_GOODS
  QUARANTINE
  BY_PRODUCT
}

enum LocationStatus {
  KOSONG
  TERISI
  RESERVED
}

enum PaddyLotStatus {
  MENUNGGU_QC
  DITERIMA
  DITOLAK
  ANTRIAN_GILING
  RESERVED
  SEDANG_DIGILING
  SELESAI
}

enum QCResult {
  LULUS
  GAGAL
}

enum WorkOrderStatus {
  DRAFT
  IN_PROGRESS
  SELESAI
  CANCELLED
}

enum WorkOrderStepType {
  PENGERINGAN
  PENGGILINGAN
  PENYOSOHAN
  SORTASI_GRADING
  PENGEMASAN
}

enum WorkOrderStepStatus {
  BELUM_MULAI
  IN_PROGRESS
  SELESAI
  SKIPPED
}

enum BatchStatus {
  PRODUKSI
  DI_GUDANG
  RESERVED
  SHIPPED
  EXPIRED
  QUARANTINE
}

enum DeliveryOrderStatus {
  DRAFT
  CONFIRMED
  PICKING
  READY_TO_SHIP
  SHIPPED
  DELIVERED
  PARTIAL_RETURN
  CANCELLED
}

enum DowntimeReason {
  BREAKDOWN
  MAINTENANCE
  SETUP
  LAINNYA
}

enum SoshLevel {
  TINGGI
  SEDANG
}

enum AlertType {
  STOK_PADI_RENDAH
  STOK_BERAS_RENDAH
  KADALUARSA_DEKAT
  YIELD_RENDAH
  HUSKING_YIELD_RENDAH
  MESIN_MAINTENANCE
  PADI_TERLAMA
  DO_BELUM_KONFIRMASI
}

enum StockMovementType {
  IN
  OUT
  ADJUSTMENT
}

// ============================================================
// MASTER DATA
// ============================================================

model User {
  id        String     @id @default(cuid())
  name      String
  email     String     @unique
  password  String
  role      Role
  status    UserStatus @default(ACTIVE)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  // Relations
  workOrdersCreated  WorkOrder[]       @relation("WorkOrderCreatedBy")
  productionLogs     ProductionLog[]
  deliveryOrders     DeliveryOrder[]   @relation("DeliveryOrderDriver")
  deliveryCreated    DeliveryOrder[]   @relation("DeliveryOrderCreatedBy")
  alertDismissals    AlertDismissal[]
  stockOpnames       StockOpname[]

  @@map("users")
}

model PaddyVariety {
  id          String   @id @default(cuid())
  code        String   @unique // VAR-IR64, VAR-CIH, dll
  name        String
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  paddyLots PaddyLot[]

  @@map("paddy_varieties")
}

model Supplier {
  id        String         @id @default(cuid())
  code      String         @unique // SUP-001
  name      String
  address   String?
  city      String?
  province  String?
  phone     String?
  email     String?
  region    String?        // Wilayah asal padi
  status    SupplierStatus @default(ACTIVE)
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  paddyLots PaddyLot[]

  @@map("suppliers")
}

model Customer {
  id              String         @id @default(cuid())
  code            String         @unique // CUST-001
  name            String
  type            CustomerType
  deliveryAddress String?
  city            String?
  phone           String?
  email           String?
  status          CustomerStatus @default(ACTIVE)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  deliveryOrders DeliveryOrder[]

  @@map("customers")
}

model Product {
  id              String      @id @default(cuid())
  sku             String      @unique // BERAS-PRE, BERAS-MED, BERAS-PAT
  name            String
  description     String?
  type            ProductType
  packagingVariants Json      // Array: [{"size": 5, "unit": "kg"}, {"size": 10, "unit": "kg"}]
  pricePerKg      Decimal     @db.Decimal(12, 2)
  minimumStock    Int         @default(0) // dalam sak
  isActive        Boolean     @default(true)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  finishedGoodsBatches FinishedGoodsBatch[]

  @@map("products")
}

model Machine {
  id                    String        @id @default(cuid())
  code                  String        @unique // DRYER-01, HUSKER-01, dll
  name                  String
  type                  MachineType
  capacityKgPerBatch    Decimal?      @db.Decimal(10, 2)
  capacityKgPerHour     Decimal?      @db.Decimal(10, 2)
  purchaseDate          DateTime?
  lastMaintenanceDate   DateTime?
  nextMaintenanceDate   DateTime?
  status                MachineStatus @default(ACTIVE)
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt

  productionLogs ProductionLog[]
  downtimeLogs   DowntimeLog[]

  @@map("machines")
}

model WarehouseLocation {
  id           String         @id @default(cuid())
  code         String         @unique // A-01-03
  name         String
  type         LocationType
  capacitySak  Int            @default(0)
  status       LocationStatus @default(KOSONG)
  isActive     Boolean        @default(true)
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  finishedGoodsBatches FinishedGoodsBatch[]

  @@map("warehouse_locations")
}

model PackagingMaterial {
  id           String   @id @default(cuid())
  code         String   @unique // PKG-KAR5, PKG-LBL-PRE
  name         String
  unit         String   // pcs, roll
  currentStock Int      @default(0)
  minimumStock Int      @default(0)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  packagingConsumptions PackagingConsumption[]

  @@map("packaging_materials")
}

// ============================================================
// WMS — RAW MATERIAL (GUDANG PADI)
// ============================================================

model PaddyLot {
  id              String         @id @default(cuid())
  lotNumber       String         @unique // LOT-20240101-001
  supplierId      String
  varietyId       String
  grossWeight     Decimal        @db.Decimal(10, 2) // kg
  sackWeight      Decimal        @db.Decimal(10, 2) // kg
  netWeight       Decimal        @db.Decimal(10, 2) // kg (gross - sack - dirt)
  moistureContent Decimal        @db.Decimal(5, 2)  // %
  dirtPercentage  Decimal        @db.Decimal(5, 2)  // %
  notes           String?
  status          PaddyLotStatus @default(MENUNGGU_QC)
  arrivedAt       DateTime       @default(now())
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  // Relations
  supplier   Supplier     @relation(fields: [supplierId], references: [id])
  variety    PaddyVariety @relation(fields: [varietyId], references: [id])
  incomingQC IncomingQC?
  workOrders WorkOrder[]
  rmStockMovements RMStockMovement[]

  @@map("paddy_lots")
}

model IncomingQC {
  id              String   @id @default(cuid())
  paddyLotId      String   @unique
  moistureContent Decimal  @db.Decimal(5, 2)  // hasil re-check (bisa beda dari incoming)
  dirtPercentage  Decimal  @db.Decimal(5, 2)
  colorAroma      String   // NORMAL atau ABNORMAL
  result          QCResult
  rejectionReason String?
  notes           String?
  inspectedAt     DateTime @default(now())
  createdAt       DateTime @default(now())

  paddyLot PaddyLot @relation(fields: [paddyLotId], references: [id])

  @@map("incoming_qc")
}

model RMStockMovement {
  id          String            @id @default(cuid())
  paddyLotId  String
  type        StockMovementType
  weightKg    Decimal           @db.Decimal(10, 2)
  description String?
  reference   String?           // WO number atau lainnya
  createdAt   DateTime          @default(now())

  paddyLot PaddyLot @relation(fields: [paddyLotId], references: [id])

  @@map("rm_stock_movements")
}

// ============================================================
// MES — WORK ORDER & PRODUCTION
// ============================================================

model WorkOrder {
  id               String          @id @default(cuid())
  woNumber         String          @unique // WO-20240101-001
  paddyLotId       String
  targetProducts   Json            // Array: ["PREMIUM", "MEDIUM"]
  estimatedOutput  Decimal         @db.Decimal(10, 2) // kg
  actualOutput     Decimal?        @db.Decimal(10, 2) // kg (diisi setelah selesai)
  overallYield     Decimal?        @db.Decimal(5, 2)  // % (diisi setelah selesai)
  deadline         DateTime
  status           WorkOrderStatus @default(DRAFT)
  notes            String?
  createdById      String
  startedAt        DateTime?
  completedAt      DateTime?
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt

  // Relations
  paddyLot             PaddyLot             @relation(fields: [paddyLotId], references: [id])
  createdBy            User                 @relation("WorkOrderCreatedBy", fields: [createdById], references: [id])
  steps                WorkOrderStep[]
  productionLogs       ProductionLog[]
  finishedGoodsBatches FinishedGoodsBatch[]

  @@map("work_orders")
}

model WorkOrderStep {
  id          String              @id @default(cuid())
  workOrderId String
  stepType    WorkOrderStepType
  stepOrder   Int                 // 1=Pengeringan, 2=Husking, dst
  status      WorkOrderStepStatus @default(BELUM_MULAI)
  startedAt   DateTime?
  completedAt DateTime?
  notes       String?
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  workOrder WorkOrder @relation(fields: [workOrderId], references: [id])

  @@unique([workOrderId, stepType])
  @@map("work_order_steps")
}

// ProductionLog adalah parent record untuk setiap log produksi.
// Detail per step disimpan di tabel terpisah (DryingLog, HuskingLog, dll).
model ProductionLog {
  id          String            @id @default(cuid())
  workOrderId String
  machineId   String?
  stepType    WorkOrderStepType
  operatorId  String
  inputWeight Decimal           @db.Decimal(10, 2) // kg
  outputWeight Decimal          @db.Decimal(10, 2) // kg
  yield       Decimal?          @db.Decimal(5, 2)  // %
  startTime   DateTime
  endTime     DateTime
  notes       String?
  createdAt   DateTime          @default(now())

  // Relations
  workOrder  WorkOrder  @relation(fields: [workOrderId], references: [id])
  machine    Machine?   @relation(fields: [machineId], references: [id])
  operator   User       @relation(fields: [operatorId], references: [id])
  dryingLog  DryingLog?
  huskingLog HuskingLog?
  polishingLog PolishingLog?
  sortingLog SortingLog?
  packagingLog PackagingLog?

  @@map("production_logs")
}

model DryingLog {
  id              String  @id @default(cuid())
  productionLogId String  @unique
  tempCelsius     Decimal @db.Decimal(5, 2) // suhu dryer
  moistureIn      Decimal @db.Decimal(5, 2) // kadar air sebelum
  moistureOut     Decimal @db.Decimal(5, 2) // kadar air sesudah
  dryingLoss      Decimal @db.Decimal(10, 2)// kg
  cycleNumber     Int     @default(1)        // siklus ke-berapa

  productionLog ProductionLog @relation(fields: [productionLogId], references: [id])

  @@map("drying_logs")
}

model HuskingLog {
  id              String  @id @default(cuid())
  productionLogId String  @unique
  brownRiceOutput Decimal @db.Decimal(10, 2) // kg beras pecah kulit
  huskOutput      Decimal @db.Decimal(10, 2) // kg sekam
  huskingYield    Decimal @db.Decimal(5, 2)  // %

  productionLog ProductionLog @relation(fields: [productionLogId], references: [id])

  @@map("husking_logs")
}

model PolishingLog {
  id              String    @id @default(cuid())
  productionLogId String    @unique
  soshLevel       SoshLevel
  whiteRiceOutput Decimal   @db.Decimal(10, 2) // kg beras putih
  branOutput      Decimal   @db.Decimal(10, 2) // kg bekatul
  polishingYield  Decimal   @db.Decimal(5, 2)  // %

  productionLog ProductionLog @relation(fields: [productionLogId], references: [id])

  @@map("polishing_logs")
}

model SortingLog {
  id                 String  @id @default(cuid())
  productionLogId    String  @unique
  wholeGrainOutput   Decimal @db.Decimal(10, 2) // kg beras utuh
  halfBrokenOutput   Decimal @db.Decimal(10, 2) // kg patah 1/2
  quarterBrokenOutput Decimal @db.Decimal(10, 2)// kg patah 1/4 / menir
  rejectedOutput     Decimal @db.Decimal(10, 2) // kg rejected
  wholeGrainRatio    Decimal @db.Decimal(5, 2)  // %
  gradingDecision    Json    // {"PREMIUM": 2000, "MEDIUM": 800, "PATAH": 400} kg alokasi

  productionLog ProductionLog @relation(fields: [productionLogId], references: [id])

  @@map("sorting_logs")
}

model PackagingLog {
  id              String  @id @default(cuid())
  productionLogId String  @unique
  totalSakPremium Int     @default(0)
  totalSakMedium  Int     @default(0)
  totalSakPatah   Int     @default(0)
  totalWeightKg   Decimal @db.Decimal(10, 2)
  looseRemainder  Decimal @db.Decimal(10, 2) @default(0) // sisa beras tidak terkemas

  productionLog         ProductionLog          @relation(fields: [productionLogId], references: [id])
  packagingConsumptions PackagingConsumption[]

  @@map("packaging_logs")
}

model PackagingConsumption {
  id                  String  @id @default(cuid())
  packagingLogId      String
  packagingMaterialId String
  quantityUsed        Int

  packagingLog      PackagingLog      @relation(fields: [packagingLogId], references: [id])
  packagingMaterial PackagingMaterial @relation(fields: [packagingMaterialId], references: [id])

  @@map("packaging_consumptions")
}

model DowntimeLog {
  id        String         @id @default(cuid())
  machineId String
  reason    DowntimeReason
  startTime DateTime
  endTime   DateTime?
  duration  Int?           // menit (dihitung otomatis saat endTime diisi)
  notes     String?
  createdAt DateTime       @default(now())

  machine Machine @relation(fields: [machineId], references: [id])

  @@map("downtime_logs")
}

// ============================================================
// WMS — FINISHED GOODS (GUDANG BERAS)
// ============================================================

model FinishedGoodsBatch {
  id                  String      @id @default(cuid())
  batchNumber         String      @unique // BATCH-20240101-001
  workOrderId         String
  productId           String
  packagingSize       Decimal     @db.Decimal(5, 2)  // kg per sak
  totalSak            Int
  totalWeightKg       Decimal     @db.Decimal(10, 2)
  productionDate      DateTime
  expiryDate          DateTime
  status              BatchStatus @default(PRODUKSI)
  locationId          String?
  receivedToWarehouseAt DateTime?
  notes               String?
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt

  // Relations
  workOrder         WorkOrder         @relation(fields: [workOrderId], references: [id])
  product           Product           @relation(fields: [productId], references: [id])
  location          WarehouseLocation? @relation(fields: [locationId], references: [id])
  deliveryOrderItems DeliveryOrderItem[]
  fgStockMovements  FGStockMovement[]
  stockOpnameItems  StockOpnameItem[]

  @@map("finished_goods_batches")
}

model FGStockMovement {
  id          String            @id @default(cuid())
  batchId     String
  type        StockMovementType
  quantity    Int               // sak
  description String?
  reference   String?           // DO Number atau lainnya
  createdAt   DateTime          @default(now())

  batch FinishedGoodsBatch @relation(fields: [batchId], references: [id])

  @@map("fg_stock_movements")
}

model StockOpname {
  id          String   @id @default(cuid())
  conductedAt DateTime @default(now())
  conductedBy String
  isApproved  Boolean  @default(false)
  approvedBy  String?
  approvedAt  DateTime?
  notes       String?
  createdAt   DateTime @default(now())

  conductor User              @relation(fields: [conductedBy], references: [id])
  items     StockOpnameItem[]

  @@map("stock_opnames")
}

model StockOpnameItem {
  id           String  @id @default(cuid())
  stockOpnameId String
  batchId      String
  systemQty    Int     // jumlah menurut sistem
  physicalQty  Int     // jumlah hasil hitung fisik
  variance     Int     // physicalQty - systemQty
  notes        String?

  stockOpname StockOpname        @relation(fields: [stockOpnameId], references: [id])
  batch       FinishedGoodsBatch @relation(fields: [batchId], references: [id])

  @@map("stock_opname_items")
}

// ============================================================
// WMS — PENGIRIMAN (DELIVERY)
// ============================================================

model DeliveryOrder {
  id             String              @id @default(cuid())
  doNumber       String              @unique // DO-20240101-001
  customerId     String
  driverId       String?
  deliveryDate   DateTime
  status         DeliveryOrderStatus @default(DRAFT)
  notes          String?
  createdById    String
  shippedAt      DateTime?
  deliveredAt    DateTime?
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt

  // Relations
  customer    Customer            @relation(fields: [customerId], references: [id])
  driver      User?               @relation("DeliveryOrderDriver", fields: [driverId], references: [id])
  createdBy   User                @relation("DeliveryOrderCreatedBy", fields: [createdById], references: [id])
  items       DeliveryOrderItem[]
  returns     DeliveryReturn[]

  @@map("delivery_orders")
}

model DeliveryOrderItem {
  id               String  @id @default(cuid())
  deliveryOrderId  String
  batchId          String
  orderedQty       Int     // sak dipesan
  shippedQty       Int?    // sak terkirim (diisi saat delivered)
  notes            String?

  deliveryOrder DeliveryOrder      @relation(fields: [deliveryOrderId], references: [id])
  batch         FinishedGoodsBatch @relation(fields: [batchId], references: [id])

  @@map("delivery_order_items")
}

model DeliveryReturn {
  id              String   @id @default(cuid())
  deliveryOrderId String
  batchId         String?
  returnedQty     Int
  reason          String
  returnedAt      DateTime @default(now())
  notes           String?
  createdAt       DateTime @default(now())

  deliveryOrder DeliveryOrder @relation(fields: [deliveryOrderId], references: [id])

  @@map("delivery_returns")
}

// ============================================================
// SYSTEM — ALERTS
// ============================================================

model Alert {
  id          String    @id @default(cuid())
  type        AlertType
  message     String
  referenceId String?   // ID dari entity terkait (lotId, batchId, dll)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())

  dismissals AlertDismissal[]

  @@map("alerts")
}

model AlertDismissal {
  id          String   @id @default(cuid())
  alertId     String
  dismissedBy String
  dismissedAt DateTime @default(now())

  alert Alert @relation(fields: [alertId], references: [id])
  user  User  @relation(fields: [dismissedBy], references: [id])

  @@map("alert_dismissals")
}
```

---

## 4. Penjelasan Relasi Antar Tabel

### 4.1 PaddyLot → WorkOrder (One-to-Many)
Satu lot padi bisa menghasilkan **satu WorkOrder** pada satu waktu. (Business rule: lot tidak boleh diproses dalam dua WO sekaligus.) Namun relasi dibuat 1:N untuk fleksibilitas historis — jika lot pernah diproses, WO-nya masih tercatat.

### 4.2 WorkOrder → WorkOrderStep (One-to-Many)
Setiap WO punya 4–5 step (tergantung apakah pengeringan diperlukan). Step di-generate otomatis saat WO dibuat, dengan `stepOrder` dan status awal `BELUM_MULAI`.

### 4.3 ProductionLog → Detail Logs (One-to-One)
`ProductionLog` adalah record induk yang menyimpan data umum (mesin, operator, berat input/output, waktu). Detail spesifik per step (suhu dryer, husking yield, dll) disimpan di tabel terpisah dengan relasi 1:1. Pattern ini memudahkan query dan tetap type-safe.

### 4.4 WorkOrder → FinishedGoodsBatch (One-to-Many)
Satu WO bisa menghasilkan beberapa batch (misal: satu batch Beras Premium 5kg, satu batch Beras Premium 10kg, satu batch Beras Medium 10kg). Setiap kombinasi produk + ukuran kemasan = satu batch.

### 4.5 FinishedGoodsBatch → DeliveryOrderItem (One-to-Many)
Satu batch bisa dikirim dalam beberapa DO (pengiriman bertahap). Tapi total `shippedQty` tidak boleh melebihi `totalSak` di batch.

---

## 5. Kalkulasi & Business Logic Utilities

Simpan di `lib/utils/`. Semua fungsi harus di-export dan punya JSDoc.

### 5.1 `lib/utils/yield-calculator.ts`

```typescript
/**
 * Hitung Husking Yield (%)
 * Benchmark: 78–82%
 */
export function calculateHuskingYield(
  brownRiceOutput: number,
  paddyInput: number
): number {
  if (paddyInput === 0) return 0;
  return Number(((brownRiceOutput / paddyInput) * 100).toFixed(2));
}

/**
 * Hitung Polishing Yield (%)
 * Benchmark: 95–98%
 */
export function calculatePolishingYield(
  whiteRiceOutput: number,
  brownRiceInput: number
): number {
  if (brownRiceInput === 0) return 0;
  return Number(((whiteRiceOutput / brownRiceInput) * 100).toFixed(2));
}

/**
 * Hitung Overall Milling Yield (%)
 * Benchmark: 60–65%
 */
export function calculateOverallYield(
  totalFinishedGoodsKg: number,
  paddyInputKg: number
): number {
  if (paddyInputKg === 0) return 0;
  return Number(((totalFinishedGoodsKg / paddyInputKg) * 100).toFixed(2));
}

/**
 * Hitung Whole Grain Ratio (%)
 * Benchmark: ≥70%
 */
export function calculateWholeGrainRatio(
  wholeGrainKg: number,
  totalSortedKg: number
): number {
  if (totalSortedKg === 0) return 0;
  return Number(((wholeGrainKg / totalSortedKg) * 100).toFixed(2));
}

/**
 * Tentukan grade produk berdasarkan whole grain ratio
 */
export function determineGrade(wholeGrainRatio: number): "PREMIUM" | "MEDIUM" | "PATAH" {
  if (wholeGrainRatio >= 95) return "PREMIUM";
  if (wholeGrainRatio >= 80) return "MEDIUM";
  return "PATAH";
}

/**
 * Hitung OEE mesin (%)
 * OEE = Availability × Performance × Quality
 * Simplified: hanya Availability yang dihitung dari downtime
 */
export function calculateOEE(
  plannedTimeMinutes: number,
  downtimeMinutes: number
): number {
  if (plannedTimeMinutes === 0) return 0;
  const availability = (plannedTimeMinutes - downtimeMinutes) / plannedTimeMinutes;
  // Performance & Quality di-set 1.0 untuk simplifikasi
  return Number((availability * 100).toFixed(2));
}
```

### 5.2 `lib/utils/lot-number.ts`

```typescript
import { format } from "date-fns";
import prisma from "@/lib/prisma";

/**
 * Generate Lot Number unik dengan format LOT-YYYYMMDD-XXX
 * Thread-safe karena menggunakan database untuk cek keunikan
 */
export async function generateLotNumber(): Promise<string> {
  const today = format(new Date(), "yyyyMMdd");
  const prefix = `LOT-${today}-`;

  const lastLot = await prisma.paddyLot.findFirst({
    where: { lotNumber: { startsWith: prefix } },
    orderBy: { lotNumber: "desc" },
  });

  const nextSeq = lastLot
    ? parseInt(lastLot.lotNumber.split("-")[2]) + 1
    : 1;

  return `${prefix}${String(nextSeq).padStart(3, "0")}`;
}
```

### 5.3 `lib/utils/batch-number.ts`

```typescript
import { format } from "date-fns";
import prisma from "@/lib/prisma";

/**
 * Generate Batch Number unik dengan format BATCH-YYYYMMDD-XXX
 */
export async function generateBatchNumber(): Promise<string> {
  const today = format(new Date(), "yyyyMMdd");
  const prefix = `BATCH-${today}-`;

  const lastBatch = await prisma.finishedGoodsBatch.findFirst({
    where: { batchNumber: { startsWith: prefix } },
    orderBy: { batchNumber: "desc" },
  });

  const nextSeq = lastBatch
    ? parseInt(lastBatch.batchNumber.split("-")[2]) + 1
    : 1;

  return `${prefix}${String(nextSeq).padStart(3, "0")}`;
}
```

### 5.4 `lib/utils/do-number.ts`

```typescript
import { format } from "date-fns";
import prisma from "@/lib/prisma";

/**
 * Generate Delivery Order Number unik dengan format DO-YYYYMMDD-XXX
 */
export async function generateDONumber(): Promise<string> {
  const today = format(new Date(), "yyyyMMdd");
  const prefix = `DO-${today}-`;

  const lastDO = await prisma.deliveryOrder.findFirst({
    where: { doNumber: { startsWith: prefix } },
    orderBy: { doNumber: "desc" },
  });

  const nextSeq = lastDO
    ? parseInt(lastDO.doNumber.split("-")[2]) + 1
    : 1;

  return `${prefix}${String(nextSeq).padStart(3, "0")}`;
}
```

### 5.5 `lib/utils/wo-number.ts`

```typescript
import { format } from "date-fns";
import prisma from "@/lib/prisma";

/**
 * Generate Work Order Number unik dengan format WO-YYYYMMDD-XXX
 */
export async function generateWONumber(): Promise<string> {
  const today = format(new Date(), "yyyyMMdd");
  const prefix = `WO-${today}-`;

  const lastWO = await prisma.workOrder.findFirst({
    where: { woNumber: { startsWith: prefix } },
    orderBy: { woNumber: "desc" },
  });

  const nextSeq = lastWO
    ? parseInt(lastWO.woNumber.split("-")[2]) + 1
    : 1;

  return `${prefix}${String(nextSeq).padStart(3, "0")}`;
}
```

### 5.6 `lib/utils/net-weight.ts`

```typescript
/**
 * Hitung berat bersih padi
 * Berat bersih = Berat kotor - Berat karung - (Berat kotor × % kotoran / 100)
 */
export function calculateNetWeight(
  grossWeight: number,
  sackWeight: number,
  dirtPercentage: number
): number {
  const dirtWeight = (grossWeight * dirtPercentage) / 100;
  return Number((grossWeight - sackWeight - dirtWeight).toFixed(2));
}
```

### 5.7 `lib/constants/thresholds.ts`

```typescript
export const THRESHOLDS = {
  // Kadar air
  MAX_MOISTURE_FOR_MILLING: 14,    // % max sebelum giling
  MAX_MOISTURE_INCOMING: 22,       // % max untuk diterima
  MAX_DRYER_TEMP: 43,              // °C max suhu dryer

  // Kotoran
  MAX_DIRT_PERCENTAGE: 5,          // % max kotoran untuk diterima

  // Yield benchmarks
  MIN_HUSKING_YIELD: 75,           // % minimum husking yield
  TARGET_HUSKING_YIELD: 78,        // % target husking yield
  MIN_POLISHING_YIELD: 93,         // % minimum polishing yield
  TARGET_OVERALL_YIELD: 62,        // % target overall yield
  MIN_OVERALL_YIELD: 58,           // % alert jika di bawah ini

  // Grading
  PREMIUM_MIN_WHOLE_GRAIN: 95,     // % whole grain untuk Premium
  MEDIUM_MIN_WHOLE_GRAIN: 80,      // % whole grain untuk Medium

  // Stok minimum (sak)
  MIN_STOCK_PREMIUM: 100,
  MIN_STOCK_MEDIUM: 200,
  MIN_STOCK_PATAH: 100,
  MIN_PADDY_STOCK_KG: 5000,        // kg minimum stok padi

  // Kadaluarsa
  EXPIRY_MONTHS: 6,                // bulan shelf life beras
  EXPIRY_ALERT_DAYS: 30,           // hari sebelum kadaluarsa untuk alert

  // Operasional
  MAX_PADDY_STORAGE_DAYS: 7,       // hari maksimal padi di gudang
  DO_CONFIRMATION_HOURS: 24,       // jam sebelum DO alert belum dikonfirmasi
} as const;
```

### 5.8 `lib/utils/alert-checker.ts`

```typescript
import prisma from "@/lib/prisma";
import { THRESHOLDS } from "@/lib/constants/thresholds";
import { addDays, isAfter } from "date-fns";

/**
 * Jalankan semua pengecekan alert dan buat alert baru jika diperlukan.
 * Dipanggil dari API route atau cron job.
 */
export async function runAlertChecks(): Promise<void> {
  await Promise.all([
    checkPaddyStock(),
    checkExpiringBatches(),
    checkOldPaddyLots(),
    checkMachineMaintenance(),
    checkPendingDeliveries(),
  ]);
}

async function checkPaddyStock(): Promise<void> {
  // Hitung total stok padi (status ANTRIAN_GILING)
  const lots = await prisma.paddyLot.findMany({
    where: { status: { in: ["ANTRIAN_GILING", "DITERIMA"] } },
    select: { netWeight: true },
  });
  const totalKg = lots.reduce((sum, l) => sum + Number(l.netWeight), 0);

  if (totalKg < THRESHOLDS.MIN_PADDY_STOCK_KG) {
    await upsertAlert("STOK_PADI_RENDAH", `Stok padi hanya ${totalKg} kg (minimum ${THRESHOLDS.MIN_PADDY_STOCK_KG} kg)`);
  }
}

async function checkExpiringBatches(): Promise<void> {
  const alertDate = addDays(new Date(), THRESHOLDS.EXPIRY_ALERT_DAYS);
  const batches = await prisma.finishedGoodsBatch.findMany({
    where: {
      expiryDate: { lte: alertDate },
      status: { in: ["DI_GUDANG", "RESERVED"] },
    },
  });

  for (const batch of batches) {
    await upsertAlert(
      "KADALUARSA_DEKAT",
      `Batch ${batch.batchNumber} akan kadaluarsa pada ${batch.expiryDate.toLocaleDateString("id-ID")}`,
      batch.id
    );
  }
}

async function checkOldPaddyLots(): Promise<void> {
  const limitDate = addDays(new Date(), -THRESHOLDS.MAX_PADDY_STORAGE_DAYS);
  const lots = await prisma.paddyLot.findMany({
    where: {
      status: "ANTRIAN_GILING",
      arrivedAt: { lte: limitDate },
    },
  });

  for (const lot of lots) {
    await upsertAlert(
      "PADI_TERLAMA",
      `Lot ${lot.lotNumber} sudah lebih dari ${THRESHOLDS.MAX_PADDY_STORAGE_DAYS} hari belum digiling`,
      lot.id
    );
  }
}

async function checkMachineMaintenance(): Promise<void> {
  const today = new Date();
  const machines = await prisma.machine.findMany({
    where: {
      nextMaintenanceDate: { lte: today },
      status: "ACTIVE",
    },
  });

  for (const machine of machines) {
    await upsertAlert(
      "MESIN_MAINTENANCE",
      `Mesin ${machine.name} sudah melewati jadwal maintenance`,
      machine.id
    );
  }
}

async function checkPendingDeliveries(): Promise<void> {
  const limitDate = addDays(new Date(), -1);
  const orders = await prisma.deliveryOrder.findMany({
    where: {
      status: "SHIPPED",
      shippedAt: { lte: limitDate },
    },
  });

  for (const order of orders) {
    await upsertAlert(
      "DO_BELUM_KONFIRMASI",
      `DO ${order.doNumber} sudah >24 jam belum dikonfirmasi terkirim`,
      order.id
    );
  }
}

async function upsertAlert(type: any, message: string, referenceId?: string): Promise<void> {
  // Cek apakah alert sejenis sudah ada dan masih aktif
  const existing = await prisma.alert.findFirst({
    where: { type, referenceId: referenceId || null, isActive: true },
  });
  if (!existing) {
    await prisma.alert.create({ data: { type, message, referenceId } });
  }
}
```

---

## 6. Deployment Architecture

### 6.1 Railway Deployment

```
GitHub Repository (main branch)
         │
         │ Push / PR merge
         ▼
Railway CI/CD Pipeline
         │
         ├── Build: next build
         ├── Run: prisma migrate deploy
         └── Start: next start
         │
         ▼
Railway Services:
  ┌─────────────────────┐   ┌──────────────────────┐
  │   Next.js Service   │   │  PostgreSQL Service   │
  │   (Web Server)      │◄──│  (Managed DB)        │
  │   Port: 3000        │   │  Port: 5432          │
  └─────────────────────┘   └──────────────────────┘
         │
         ▼
Custom Domain (opsional): beras-nusantara.railway.app
```

### 6.2 Environment Setup di Railway

```
DATABASE_URL         → dari Railway PostgreSQL (auto-inject)
NEXTAUTH_URL         → https://your-app.railway.app
NEXTAUTH_SECRET      → generate dengan: openssl rand -base64 32
NODE_ENV             → production
```

### 6.3 `package.json` scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:seed": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts",
    "db:studio": "prisma studio",
    "postinstall": "prisma generate"
  }
}
```

### 6.4 `middleware.ts` (Auth Protection)

```typescript
// middleware.ts (di root project)
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

---

## 7. Environment Variables

### 7.1 `.env.example`

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/beras_nusantara"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="minimum-32-character-secret-key-here"

# App Config (opsional)
NEXT_PUBLIC_APP_NAME="PT. Beras Nusantara"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

### 7.2 `.gitignore` — pastikan file ini ada

```
.env
.env.local
.env.production
node_modules/
.next/
```

---

## 8. Database Indexing Strategy

Tambahkan index berikut di `schema.prisma` untuk performa optimal:

```prisma
model PaddyLot {
  // ... fields ...
  @@index([status])
  @@index([supplierId])
  @@index([arrivedAt])
}

model WorkOrder {
  // ... fields ...
  @@index([status])
  @@index([paddyLotId])
  @@index([deadline])
}

model ProductionLog {
  // ... fields ...
  @@index([workOrderId])
  @@index([stepType])
  @@index([createdAt])
}

model FinishedGoodsBatch {
  // ... fields ...
  @@index([status])
  @@index([productId])
  @@index([expiryDate])
  @@index([workOrderId])
}

model DeliveryOrder {
  // ... fields ...
  @@index([status])
  @@index([customerId])
  @@index([driverId])
  @@index([deliveryDate])
}

model Alert {
  // ... fields ...
  @@index([type])
  @@index([isActive])
}
```

---

## Catatan untuk AI Developer

1. **Jalankan ini pertama kali setelah clone:**
   ```bash
   npm install
   npx prisma generate
   npx prisma migrate dev --name init
   npm run db:seed
   npm run dev
   ```

2. **Urutan tabel saat seed** (karena ada foreign key constraint):
   ```
   1. PaddyVariety
   2. User
   3. Supplier
   4. Customer
   5. Product
   6. Machine
   7. WarehouseLocation
   8. PackagingMaterial
   9. PaddyLot (sample)
   10. IncomingQC (sample)
   11. WorkOrder (sample)
   12. WorkOrderStep (sample)
   ```

3. **Gunakan `prisma.$transaction()`** untuk operasi yang mengubah beberapa tabel sekaligus:
   - Penerimaan padi: create PaddyLot + create IncomingQC + update stok
   - Submit log produksi: create ProductionLog + create DetailLog + update WorkOrderStep + update MachineLog
   - Create DO: create DeliveryOrder + create DeliveryOrderItems + update batch status → RESERVED

4. **Jangan gunakan `prisma.raw()`** kecuali benar-benar diperlukan untuk query kompleks.

5. **Semua Decimal field** dari Prisma dikembalikan sebagai `Prisma.Decimal` — konversi ke `Number()` saat kalkulasi.

6. **Konsultasi DOC-04** untuk urutan pengerjaan task per modul.

---

*Versi: 1.0 | Dokumen ini adalah bagian dari seri DOC-01 s/d DOC-04*
*Lanjut ke DOC-04 untuk checklist task implementasi.*
