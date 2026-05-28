"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Calendar, User, ShoppingBag, Info, AlertCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import FIFOBatchSelector from "./FIFOBatchSelector";

interface DeliveryOrderFormProps {
  customers: any[];
  drivers: any[];
  products: any[];
}

interface SelectedItem {
  id: string; // local UI unique ID
  productId: string;
  productName: string;
  packagingSize: number;
  qtyRequested: number;
  batches: Array<{
    batchId: string;
    batchNumber: string;
    availableSak: number;
    suggestedSak: number;
    locationCode: string;
    expiryDate: string;
  }>;
}

const inputCls =
  "w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all";

export default function DeliveryOrderForm({ customers, drivers, products }: DeliveryOrderFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form states
  const [customerId, setCustomerId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");

  // Item builder states
  const [itemProductId, setItemProductId] = useState("");
  const [itemSize, setItemSize] = useState("");
  const [itemQty, setItemQty] = useState("");
  const [fetchingFIFO, setFetchingFIFO] = useState(false);

  // Added items list
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  // Get packaging sizes for the currently chosen product in the builder
  const chosenProduct = products.find((p) => p.id === itemProductId);
  const packagingVariants = chosenProduct
    ? typeof chosenProduct.packagingVariants === "string"
      ? JSON.parse(chosenProduct.packagingVariants)
      : chosenProduct.packagingVariants
    : [];

  const handleFetchFIFO = async () => {
    if (!itemProductId || !itemSize || !itemQty) {
      toast.error("Silakan pilih produk, ukuran, dan jumlah sak terlebih dahulu.");
      return;
    }

    const qty = parseInt(itemQty, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Jumlah sak harus berupa angka positif.");
      return;
    }

    setFetchingFIFO(true);
    try {
      const res = await fetch(
        `/api/wms/delivery-orders/fifo?productId=${itemProductId}&packagingSize=${itemSize}&requiredSak=${qty}`
      );
      const json = await res.json();
      setFetchingFIFO(false);

      if (json.success) {
        const suggestions = json.data;
        const totalSuggested = suggestions.reduce((sum: number, s: any) => sum + s.suggestedSak, 0);

        if (totalSuggested < qty) {
          toast.warning(
            `Stok tidak mencukupi untuk memenuhi ${qty} sak. Hanya ditemukan ${totalSuggested} sak.`
          );
        }

        const newId = Math.random().toString(36).substring(2, 9);
        const newItem: SelectedItem = {
          id: newId,
          productId: itemProductId,
          productName: chosenProduct?.name || "",
          packagingSize: parseFloat(itemSize),
          qtyRequested: qty,
          batches: suggestions,
        };

        setSelectedItems((prev) => [...prev, newItem]);
        // Reset builder inputs
        setItemProductId("");
        setItemSize("");
        setItemQty("");
        toast.success("Item berhasil ditambahkan dengan rekomendasi FIFO!");
      } else {
        toast.error(json.error || "Gagal mengambil rekomendasi FIFO.");
      }
    } catch (e) {
      setFetchingFIFO(false);
      console.error(e);
      toast.error("Terjadi kesalahan saat memproses data.");
    }
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateBatchQty = (itemId: string, batchId: string, newQty: number) => {
    setSelectedItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const updatedBatches = item.batches.map((b) => {
          if (b.batchId !== batchId) return b;
          return { ...b, suggestedSak: newQty };
        });

        // Re-calculate the actual total requested qty based on modified batch values
        const totalQty = updatedBatches.reduce((sum, b) => sum + b.suggestedSak, 0);

        return {
          ...item,
          batches: updatedBatches,
          qtyRequested: totalQty,
        };
      })
    );
  };

  // Submit the Delivery Order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId) {
      toast.error("Silakan pilih pelanggan.");
      return;
    }
    if (!deliveryDate) {
      toast.error("Silakan tentukan tanggal pengiriman.");
      return;
    }
    if (selectedItems.length === 0) {
      toast.error("Silakan tambahkan minimal 1 item produk untuk dikirim.");
      return;
    }

    // Flatten selected items' batches into back-end schema payload
    const itemsPayload: Array<{ batchId: string; orderedQty: number }> = [];
    selectedItems.forEach((item) => {
      item.batches.forEach((b) => {
        if (b.suggestedSak > 0) {
          itemsPayload.push({
            batchId: b.batchId,
            orderedQty: b.suggestedSak,
          });
        }
      });
    });

    if (itemsPayload.length === 0) {
      toast.error("Total jumlah sak yang dipilih harus lebih dari 0.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/wms/delivery-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          driverId: driverId || null,
          deliveryDate,
          notes: notes || null,
          items: itemsPayload,
        }),
      });

      const json = await res.json();
      setLoading(false);

      if (json.success) {
        toast.success("Delivery Order berhasil dibuat!");
        router.push(`/wms/delivery/${json.data.id}`);
      } else {
        toast.error(json.error || "Gagal membuat Delivery Order");
      }
    } catch (e) {
      setLoading(false);
      console.error(e);
      toast.error("Gagal mengirim data Delivery Order.");
    }
  };

  // Calculate overall summary
  const summaryTotalSacks = selectedItems.reduce(
    (sum, item) => sum + item.batches.reduce((sSum, b) => sSum + b.suggestedSak, 0),
    0
  );
  const summaryTotalWeight = selectedItems.reduce(
    (sum, item) =>
      sum +
      item.batches.reduce((sSum, b) => sSum + b.suggestedSak * item.packagingSize, 0),
    0
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Left: General Info Form */}
      <div className="xl:col-span-2 space-y-6">
        <form onSubmit={handleSubmit} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <FileText className="w-5 h-5 text-emerald-400" /> Informasi Pengiriman
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Pelanggan</label>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required className={inputCls}>
                <option value="">Pilih Pelanggan</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code}) - {c.city || ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Driver / Supir</label>
              <select value={driverId} onChange={(e) => setDriverId(e.target.value)} className={inputCls}>
                <option value="">Pilih Driver (Opsional)</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Tanggal Pengiriman</label>
              <div className="relative">
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Catatan Pengiriman</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Catatan tambahan untuk driver atau pelanggan..."
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Render Added Items */}
          <div className="space-y-4 pt-3 border-t border-slate-800">
            <h3 className="text-sm font-bold text-slate-200">Daftar Item Produk & Alokasi Batch</h3>

            {selectedItems.length === 0 ? (
              <div className="text-center py-8 bg-slate-950/20 border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
                Belum ada produk yang ditambahkan. Gunakan formulir di sebelah kanan untuk menambahkan produk.
              </div>
            ) : (
              <div className="space-y-4">
                {selectedItems.map((item) => {
                  const itemTotalSacks = item.batches.reduce((sum, b) => sum + b.suggestedSak, 0);
                  return (
                    <div key={item.id} className="bg-slate-950/40 border border-slate-800 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-semibold text-white">{item.productName}</h4>
                          <p className="text-xs text-slate-400">
                            Ukuran Kemasan: <span className="text-emerald-400 font-medium">{item.packagingSize} kg</span> | Total Sacks:{" "}
                            <span className="text-white font-medium">{itemTotalSacks} Sak</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-slate-500 hover:text-red-400 p-1 hover:bg-slate-800/50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Batches Table */}
                      <FIFOBatchSelector
                        batches={item.batches}
                        onUpdateQty={(batchId, newQty) =>
                          handleUpdateBatchQty(item.id, batchId, newQty)
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Kembali
            </button>
            <button
              type="submit"
              disabled={loading || selectedItems.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-white disabled:opacity-50 transition-colors"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Buat Delivery Order
            </button>
          </div>
        </form>
      </div>

      {/* Right: Add Item & FIFO Preview Block */}
      <div className="space-y-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Plus className="w-5 h-5 text-emerald-400" /> Tambah Produk
          </h2>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Pilih Produk</label>
              <select value={itemProductId} onChange={(e) => setItemProductId(e.target.value)} className={inputCls}>
                <option value="">Pilih Produk</option>
                {products
                  .filter((p) => p.isActive)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Ukuran Kemasan</label>
              <select
                value={itemSize}
                onChange={(e) => setItemSize(e.target.value)}
                disabled={!itemProductId}
                className={inputCls}
              >
                <option value="">Pilih Ukuran</option>
                {packagingVariants.map((variant: any, idx: number) => (
                  <option key={idx} value={variant.size}>
                    {variant.size} {variant.unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Jumlah Sak</label>
              <input
                type="number"
                min="1"
                value={itemQty}
                onChange={(e) => setItemQty(e.target.value)}
                placeholder="Jumlah sak yang dikirim"
                className={inputCls}
              />
            </div>

            <button
              type="button"
              onClick={handleFetchFIFO}
              disabled={fetchingFIFO || !itemProductId || !itemSize || !itemQty}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer mt-2"
            >
              {fetchingFIFO ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShoppingBag className="w-4 h-4" />
              )}
              Ambil & Sarankan FIFO
            </button>
          </div>
        </div>

        {/* Live Slip Preview */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[250px]">
          {/* Glassmorphic decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full blur-3xl" />

          <div className="space-y-4 relative z-10">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Info className="w-4 h-4 text-emerald-400" /> Ringkasan Delivery Order
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Total Item Produk:</span>
                <span className="font-semibold text-slate-200">{selectedItems.length} Produk</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Total Sacks:</span>
                <span className="font-semibold text-emerald-400">{summaryTotalSacks} Sak</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Estimasi Total Berat:</span>
                <span className="font-semibold text-emerald-400">
                  {summaryTotalWeight.toLocaleString("id-ID")} kg
                </span>
              </div>

              <hr className="border-slate-800" />

              <div className="flex gap-2 items-start bg-slate-850 p-3 rounded-lg text-xs text-slate-400 border border-slate-800/80">
                <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                <p>
                  Sistem merekomendasikan batch berdasarkan prinsip <span className="text-yellow-400 font-medium">FIFO (First Expired First Out)</span>.
                  Operator dapat mengubah jumlah sak per batch secara manual jika diperlukan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
