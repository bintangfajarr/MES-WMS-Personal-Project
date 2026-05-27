import prisma from "@/lib/prisma";
import { THRESHOLDS } from "@/lib/constants/thresholds";
import { addDays } from "date-fns";

/**
 * Run all alert checks and create new alerts if conditions are met.
 * Called from API routes or after important operations.
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
  const lots = await prisma.paddyLot.findMany({
    where: { status: { in: ["ANTRIAN_GILING", "DITERIMA"] } },
    select: { netWeight: true },
  });
  const totalKg = lots.reduce((sum, l) => sum + Number(l.netWeight), 0);

  if (totalKg < THRESHOLDS.MIN_PADDY_STOCK_KG) {
    await upsertAlert(
      "STOK_PADI_RENDAH",
      `Paddy stock is only ${totalKg} kg (minimum ${THRESHOLDS.MIN_PADDY_STOCK_KG} kg)`
    );
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
      `Batch ${batch.batchNumber} will expire on ${batch.expiryDate.toLocaleDateString("en-US")}`,
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
      `Lot ${lot.lotNumber} has been in storage for more than ${THRESHOLDS.MAX_PADDY_STORAGE_DAYS} days without being milled`,
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
      `Machine ${machine.name} has passed its scheduled maintenance date`,
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
      `DO ${order.doNumber} has been shipped for >24 hours without delivery confirmation`,
      order.id
    );
  }
}

/**
 * Upsert alert — check if a similar alert already exists and is still active.
 * If not, create a new one. If it already exists, skip.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertAlert(type: any, message: string, referenceId?: string): Promise<void> {
  const existing = await prisma.alert.findFirst({
    where: { type, referenceId: referenceId || null, isActive: true },
  });
  if (!existing) {
    await prisma.alert.create({ data: { type, message, referenceId } });
  }
}
