-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPR_PROD', 'OPR_WHS', 'DRIVER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('PREMIUM', 'MEDIUM', 'PATAH', 'BY_PRODUCT');

-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('TOKO', 'DISTRIBUTOR', 'SUPERMARKET', 'HORECA', 'KOPERASI');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "MachineType" AS ENUM ('DRYER', 'HUSKER', 'POLISHER', 'COLOR_SORTER', 'CLASSIFIER', 'PACKER');

-- CreateEnum
CREATE TYPE "MachineStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'INACTIVE', 'BREAKDOWN');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('RAW_MATERIAL', 'FINISHED_GOODS', 'QUARANTINE', 'BY_PRODUCT');

-- CreateEnum
CREATE TYPE "LocationStatus" AS ENUM ('KOSONG', 'TERISI', 'RESERVED');

-- CreateEnum
CREATE TYPE "PaddyLotStatus" AS ENUM ('MENUNGGU_QC', 'DITERIMA', 'DITOLAK', 'ANTRIAN_GILING', 'RESERVED', 'SEDANG_DIGILING', 'SELESAI');

-- CreateEnum
CREATE TYPE "QCResult" AS ENUM ('LULUS', 'GAGAL');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'SELESAI', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WorkOrderStepType" AS ENUM ('PENGERINGAN', 'PENGGILINGAN', 'PENYOSOHAN', 'SORTASI_GRADING', 'PENGEMASAN');

-- CreateEnum
CREATE TYPE "WorkOrderStepStatus" AS ENUM ('BELUM_MULAI', 'IN_PROGRESS', 'SELESAI', 'SKIPPED');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('PRODUKSI', 'DI_GUDANG', 'RESERVED', 'SHIPPED', 'EXPIRED', 'QUARANTINE');

-- CreateEnum
CREATE TYPE "DeliveryOrderStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'PICKING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'PARTIAL_RETURN', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DowntimeReason" AS ENUM ('BREAKDOWN', 'MAINTENANCE', 'SETUP', 'LAINNYA');

-- CreateEnum
CREATE TYPE "SoshLevel" AS ENUM ('TINGGI', 'SEDANG');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('STOK_PADI_RENDAH', 'STOK_BERAS_RENDAH', 'KADALUARSA_DEKAT', 'YIELD_RENDAH', 'HUSKING_YIELD_RENDAH', 'MESIN_MAINTENANCE', 'PADI_TERLAMA', 'DO_BELUM_KONFIRMASI');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paddy_varieties" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paddy_varieties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "region" TEXT,
    "status" "SupplierStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CustomerType" NOT NULL,
    "deliveryAddress" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ProductType" NOT NULL,
    "packagingVariants" JSONB NOT NULL,
    "pricePerKg" DECIMAL(12,2) NOT NULL,
    "minimumStock" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machines" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MachineType" NOT NULL,
    "capacityKgPerBatch" DECIMAL(10,2),
    "capacityKgPerHour" DECIMAL(10,2),
    "purchaseDate" TIMESTAMP(3),
    "lastMaintenanceDate" TIMESTAMP(3),
    "nextMaintenanceDate" TIMESTAMP(3),
    "status" "MachineStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_locations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LocationType" NOT NULL,
    "capacitySak" INTEGER NOT NULL DEFAULT 0,
    "status" "LocationStatus" NOT NULL DEFAULT 'KOSONG',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouse_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packaging_materials" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "minimumStock" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packaging_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paddy_lots" (
    "id" TEXT NOT NULL,
    "lotNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "varietyId" TEXT NOT NULL,
    "grossWeight" DECIMAL(10,2) NOT NULL,
    "sackWeight" DECIMAL(10,2) NOT NULL,
    "netWeight" DECIMAL(10,2) NOT NULL,
    "moistureContent" DECIMAL(5,2) NOT NULL,
    "dirtPercentage" DECIMAL(5,2) NOT NULL,
    "notes" TEXT,
    "status" "PaddyLotStatus" NOT NULL DEFAULT 'MENUNGGU_QC',
    "arrivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paddy_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incoming_qc" (
    "id" TEXT NOT NULL,
    "paddyLotId" TEXT NOT NULL,
    "moistureContent" DECIMAL(5,2) NOT NULL,
    "dirtPercentage" DECIMAL(5,2) NOT NULL,
    "colorAroma" TEXT NOT NULL,
    "result" "QCResult" NOT NULL,
    "rejectionReason" TEXT,
    "notes" TEXT,
    "inspectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incoming_qc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rm_stock_movements" (
    "id" TEXT NOT NULL,
    "paddyLotId" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "weightKg" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rm_stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_orders" (
    "id" TEXT NOT NULL,
    "woNumber" TEXT NOT NULL,
    "paddyLotId" TEXT NOT NULL,
    "targetProducts" JSONB NOT NULL,
    "estimatedOutput" DECIMAL(10,2) NOT NULL,
    "actualOutput" DECIMAL(10,2),
    "overallYield" DECIMAL(5,2),
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_steps" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "stepType" "WorkOrderStepType" NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "status" "WorkOrderStepStatus" NOT NULL DEFAULT 'BELUM_MULAI',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_order_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_logs" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "machineId" TEXT,
    "stepType" "WorkOrderStepType" NOT NULL,
    "operatorId" TEXT NOT NULL,
    "inputWeight" DECIMAL(10,2) NOT NULL,
    "outputWeight" DECIMAL(10,2) NOT NULL,
    "yield" DECIMAL(5,2),
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drying_logs" (
    "id" TEXT NOT NULL,
    "productionLogId" TEXT NOT NULL,
    "tempCelsius" DECIMAL(5,2) NOT NULL,
    "moistureIn" DECIMAL(5,2) NOT NULL,
    "moistureOut" DECIMAL(5,2) NOT NULL,
    "dryingLoss" DECIMAL(10,2) NOT NULL,
    "cycleNumber" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "drying_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "husking_logs" (
    "id" TEXT NOT NULL,
    "productionLogId" TEXT NOT NULL,
    "brownRiceOutput" DECIMAL(10,2) NOT NULL,
    "huskOutput" DECIMAL(10,2) NOT NULL,
    "huskingYield" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "husking_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polishing_logs" (
    "id" TEXT NOT NULL,
    "productionLogId" TEXT NOT NULL,
    "soshLevel" "SoshLevel" NOT NULL,
    "whiteRiceOutput" DECIMAL(10,2) NOT NULL,
    "branOutput" DECIMAL(10,2) NOT NULL,
    "polishingYield" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "polishing_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sorting_logs" (
    "id" TEXT NOT NULL,
    "productionLogId" TEXT NOT NULL,
    "wholeGrainOutput" DECIMAL(10,2) NOT NULL,
    "halfBrokenOutput" DECIMAL(10,2) NOT NULL,
    "quarterBrokenOutput" DECIMAL(10,2) NOT NULL,
    "rejectedOutput" DECIMAL(10,2) NOT NULL,
    "wholeGrainRatio" DECIMAL(5,2) NOT NULL,
    "gradingDecision" JSONB NOT NULL,

    CONSTRAINT "sorting_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packaging_logs" (
    "id" TEXT NOT NULL,
    "productionLogId" TEXT NOT NULL,
    "totalSakPremium" INTEGER NOT NULL DEFAULT 0,
    "totalSakMedium" INTEGER NOT NULL DEFAULT 0,
    "totalSakPatah" INTEGER NOT NULL DEFAULT 0,
    "totalWeightKg" DECIMAL(10,2) NOT NULL,
    "looseRemainder" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "packaging_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packaging_consumptions" (
    "id" TEXT NOT NULL,
    "packagingLogId" TEXT NOT NULL,
    "packagingMaterialId" TEXT NOT NULL,
    "quantityUsed" INTEGER NOT NULL,

    CONSTRAINT "packaging_consumptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "downtime_logs" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "reason" "DowntimeReason" NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "downtime_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finished_goods_batches" (
    "id" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "packagingSize" DECIMAL(5,2) NOT NULL,
    "totalSak" INTEGER NOT NULL,
    "totalWeightKg" DECIMAL(10,2) NOT NULL,
    "productionDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'PRODUKSI',
    "locationId" TEXT,
    "receivedToWarehouseAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finished_goods_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fg_stock_movements" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fg_stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_opnames" (
    "id" TEXT NOT NULL,
    "conductedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conductedBy" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_opnames_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_opname_items" (
    "id" TEXT NOT NULL,
    "stockOpnameId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "systemQty" INTEGER NOT NULL,
    "physicalQty" INTEGER NOT NULL,
    "variance" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "stock_opname_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_orders" (
    "id" TEXT NOT NULL,
    "doNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "driverId" TEXT,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "status" "DeliveryOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_order_items" (
    "id" TEXT NOT NULL,
    "deliveryOrderId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "orderedQty" INTEGER NOT NULL,
    "shippedQty" INTEGER,
    "notes" TEXT,

    CONSTRAINT "delivery_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_returns" (
    "id" TEXT NOT NULL,
    "deliveryOrderId" TEXT NOT NULL,
    "batchId" TEXT,
    "returnedQty" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "returnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "message" TEXT NOT NULL,
    "referenceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_dismissals" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "dismissedBy" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_dismissals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "paddy_varieties_code_key" ON "paddy_varieties"("code");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "customers_code_key" ON "customers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "machines_code_key" ON "machines"("code");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_locations_code_key" ON "warehouse_locations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "packaging_materials_code_key" ON "packaging_materials"("code");

-- CreateIndex
CREATE UNIQUE INDEX "paddy_lots_lotNumber_key" ON "paddy_lots"("lotNumber");

-- CreateIndex
CREATE INDEX "paddy_lots_status_idx" ON "paddy_lots"("status");

-- CreateIndex
CREATE INDEX "paddy_lots_supplierId_idx" ON "paddy_lots"("supplierId");

-- CreateIndex
CREATE INDEX "paddy_lots_arrivedAt_idx" ON "paddy_lots"("arrivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "incoming_qc_paddyLotId_key" ON "incoming_qc"("paddyLotId");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_woNumber_key" ON "work_orders"("woNumber");

-- CreateIndex
CREATE INDEX "work_orders_status_idx" ON "work_orders"("status");

-- CreateIndex
CREATE INDEX "work_orders_paddyLotId_idx" ON "work_orders"("paddyLotId");

-- CreateIndex
CREATE INDEX "work_orders_deadline_idx" ON "work_orders"("deadline");

-- CreateIndex
CREATE UNIQUE INDEX "work_order_steps_workOrderId_stepType_key" ON "work_order_steps"("workOrderId", "stepType");

-- CreateIndex
CREATE INDEX "production_logs_workOrderId_idx" ON "production_logs"("workOrderId");

-- CreateIndex
CREATE INDEX "production_logs_stepType_idx" ON "production_logs"("stepType");

-- CreateIndex
CREATE INDEX "production_logs_createdAt_idx" ON "production_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "drying_logs_productionLogId_key" ON "drying_logs"("productionLogId");

-- CreateIndex
CREATE UNIQUE INDEX "husking_logs_productionLogId_key" ON "husking_logs"("productionLogId");

-- CreateIndex
CREATE UNIQUE INDEX "polishing_logs_productionLogId_key" ON "polishing_logs"("productionLogId");

-- CreateIndex
CREATE UNIQUE INDEX "sorting_logs_productionLogId_key" ON "sorting_logs"("productionLogId");

-- CreateIndex
CREATE UNIQUE INDEX "packaging_logs_productionLogId_key" ON "packaging_logs"("productionLogId");

-- CreateIndex
CREATE UNIQUE INDEX "finished_goods_batches_batchNumber_key" ON "finished_goods_batches"("batchNumber");

-- CreateIndex
CREATE INDEX "finished_goods_batches_status_idx" ON "finished_goods_batches"("status");

-- CreateIndex
CREATE INDEX "finished_goods_batches_productId_idx" ON "finished_goods_batches"("productId");

-- CreateIndex
CREATE INDEX "finished_goods_batches_expiryDate_idx" ON "finished_goods_batches"("expiryDate");

-- CreateIndex
CREATE INDEX "finished_goods_batches_workOrderId_idx" ON "finished_goods_batches"("workOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_orders_doNumber_key" ON "delivery_orders"("doNumber");

-- CreateIndex
CREATE INDEX "delivery_orders_status_idx" ON "delivery_orders"("status");

-- CreateIndex
CREATE INDEX "delivery_orders_customerId_idx" ON "delivery_orders"("customerId");

-- CreateIndex
CREATE INDEX "delivery_orders_driverId_idx" ON "delivery_orders"("driverId");

-- CreateIndex
CREATE INDEX "delivery_orders_deliveryDate_idx" ON "delivery_orders"("deliveryDate");

-- CreateIndex
CREATE INDEX "alerts_type_idx" ON "alerts"("type");

-- CreateIndex
CREATE INDEX "alerts_isActive_idx" ON "alerts"("isActive");

-- AddForeignKey
ALTER TABLE "paddy_lots" ADD CONSTRAINT "paddy_lots_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paddy_lots" ADD CONSTRAINT "paddy_lots_varietyId_fkey" FOREIGN KEY ("varietyId") REFERENCES "paddy_varieties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incoming_qc" ADD CONSTRAINT "incoming_qc_paddyLotId_fkey" FOREIGN KEY ("paddyLotId") REFERENCES "paddy_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rm_stock_movements" ADD CONSTRAINT "rm_stock_movements_paddyLotId_fkey" FOREIGN KEY ("paddyLotId") REFERENCES "paddy_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_paddyLotId_fkey" FOREIGN KEY ("paddyLotId") REFERENCES "paddy_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_steps" ADD CONSTRAINT "work_order_steps_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_logs" ADD CONSTRAINT "production_logs_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_logs" ADD CONSTRAINT "production_logs_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_logs" ADD CONSTRAINT "production_logs_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drying_logs" ADD CONSTRAINT "drying_logs_productionLogId_fkey" FOREIGN KEY ("productionLogId") REFERENCES "production_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "husking_logs" ADD CONSTRAINT "husking_logs_productionLogId_fkey" FOREIGN KEY ("productionLogId") REFERENCES "production_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polishing_logs" ADD CONSTRAINT "polishing_logs_productionLogId_fkey" FOREIGN KEY ("productionLogId") REFERENCES "production_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sorting_logs" ADD CONSTRAINT "sorting_logs_productionLogId_fkey" FOREIGN KEY ("productionLogId") REFERENCES "production_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packaging_logs" ADD CONSTRAINT "packaging_logs_productionLogId_fkey" FOREIGN KEY ("productionLogId") REFERENCES "production_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packaging_consumptions" ADD CONSTRAINT "packaging_consumptions_packagingLogId_fkey" FOREIGN KEY ("packagingLogId") REFERENCES "packaging_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packaging_consumptions" ADD CONSTRAINT "packaging_consumptions_packagingMaterialId_fkey" FOREIGN KEY ("packagingMaterialId") REFERENCES "packaging_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "downtime_logs" ADD CONSTRAINT "downtime_logs_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finished_goods_batches" ADD CONSTRAINT "finished_goods_batches_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finished_goods_batches" ADD CONSTRAINT "finished_goods_batches_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finished_goods_batches" ADD CONSTRAINT "finished_goods_batches_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "warehouse_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fg_stock_movements" ADD CONSTRAINT "fg_stock_movements_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "finished_goods_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_opnames" ADD CONSTRAINT "stock_opnames_conductedBy_fkey" FOREIGN KEY ("conductedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_opname_items" ADD CONSTRAINT "stock_opname_items_stockOpnameId_fkey" FOREIGN KEY ("stockOpnameId") REFERENCES "stock_opnames"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_opname_items" ADD CONSTRAINT "stock_opname_items_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "finished_goods_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_orders" ADD CONSTRAINT "delivery_orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_orders" ADD CONSTRAINT "delivery_orders_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_orders" ADD CONSTRAINT "delivery_orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_order_items" ADD CONSTRAINT "delivery_order_items_deliveryOrderId_fkey" FOREIGN KEY ("deliveryOrderId") REFERENCES "delivery_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_order_items" ADD CONSTRAINT "delivery_order_items_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "finished_goods_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_returns" ADD CONSTRAINT "delivery_returns_deliveryOrderId_fkey" FOREIGN KEY ("deliveryOrderId") REFERENCES "delivery_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_dismissals" ADD CONSTRAINT "alert_dismissals_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "alerts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_dismissals" ADD CONSTRAINT "alert_dismissals_dismissedBy_fkey" FOREIGN KEY ("dismissedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
