"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Truck,
  Calendar,
  User,
  FileText,
  Download,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Package,
  CheckCircle2,
  MapPin,
  ClipboardList,
  History,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DeliveryStatusTimeline from "@/components/wms/DeliveryStatusTimeline";
import StatusBadge from "@/components/shared/StatusBadge";
import ErrorState from "@/components/shared/ErrorState";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const inputCls =
  "w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all";

export default function DeliveryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [transitioning, setTransitioning] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Return form state
  const [returnItems, setReturnItems] = useState<
    Array<{ batchId: string; returnedQty: number; reason: string }>
  >([]);
  const [returnNotes, setReturnNotes] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const fetchOrderDetail = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/wms/delivery-orders/${id}`);
      const json = await res.json();
      if (json.success) {
        setOrder(json.data);
        // Initialize return items schema matching delivery items
        setReturnItems(
          json.data.items.map((i: any) => ({
            batchId: i.batchId,
            returnedQty: 0,
            reason: "Kemasan Rusak",
          }))
        );
      } else {
        setError(json.error || "Gagal memuat detail Delivery Order");
      }
    } catch (e) {
      setError("Gagal menghubungi server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrderDetail();
  }, [id]);

  const handleStatusTransition = async (action: "confirm" | "ready" | "ship" | "delivered") => {
    setTransitioning(true);
    try {
      const res = await fetch(`/api/wms/delivery-orders/${id}/${action}`, {
        method: "PATCH",
      });
      const json = await res.json();
      setTransitioning(false);

      if (json.success) {
        toast.success(`Delivery Order berhasil diupdate.`);
        fetchOrderDetail();
      } else {
        toast.error(json.error || "Gagal memperbarui status DO");
      }
    } catch (e) {
      setTransitioning(false);
      toast.error("Terjadi kesalahan sistem saat memperbarui status");
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeReturns = returnItems.filter((i) => i.returnedQty > 0);

    if (activeReturns.length === 0) {
      toast.error("Silakan tentukan minimal 1 item untuk diretur dengan jumlah > 0.");
      return;
    }

    setSubmittingReturn(true);
    try {
      const res = await fetch(`/api/wms/delivery-orders/${id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: activeReturns,
          notes: returnNotes || null,
        }),
      });

      const json = await res.json();
      setSubmittingReturn(false);

      if (json.success) {
        toast.success("Catatan retur berhasil disimpan!");
        setShowReturnModal(false);
        setReturnNotes("");
        fetchOrderDetail();
      } else {
        toast.error(json.error || "Gagal menyimpan data retur");
      }
    } catch (e) {
      setSubmittingReturn(false);
      toast.error("Gagal mengirim data retur.");
    }
  };

  const handleReturnQtyChange = (batchId: string, qty: number, max: number) => {
    setReturnItems((prev) =>
      prev.map((item) => {
        if (item.batchId !== batchId) return item;
        return { ...item, returnedQty: Math.min(max, Math.max(0, qty)) };
      })
    );
  };

  const handleReturnReasonChange = (batchId: string, reason: string) => {
    setReturnItems((prev) =>
      prev.map((item) => {
        if (item.batchId !== batchId) return item;
        return { ...item, reason };
      })
    );
  };

  const handleDownloadPDF = () => {
    window.open(`/api/wms/delivery-orders/${id}/surat-jalan`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 border border-slate-800 rounded-xl space-y-3">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
        <p className="text-sm text-slate-400">Sedang memuat data...</p>
      </div>
    );
  }

  if (error || !order) {
    return <ErrorState message={error || "Delivery Order tidak ditemukan"} onRetry={fetchOrderDetail} />;
  }

  const totalSacks = order.items.reduce((sum: number, item: any) => sum + item.orderedQty, 0);
  const totalWeight = order.items.reduce(
    (sum: number, item: any) => sum + item.orderedQty * Number(item.batch.packagingSize),
    0
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/wms/delivery")}
            className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-white">{order.doNumber}</h1>
              <StatusBadge status={order.status} type="delivery" />
            </div>
            <p className="text-xs text-slate-400">Dibuat oleh: {order.createdBy?.name || "Sistem"}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* Action: Surat Jalan Download */}
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors w-full sm:w-auto"
          >
            <Download className="w-4 h-4" /> Unduh Surat Jalan
          </button>

          {/* Contextual Status Transitions */}
          {order.status === "CONFIRMED" && (
            <button
              onClick={() => handleStatusTransition("confirm")}
              disabled={transitioning}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-white disabled:opacity-50 transition-colors w-full sm:w-auto"
            >
              {transitioning && <Loader2 className="w-4 h-4 animate-spin" />} Mulai Picking
            </button>
          )}

          {order.status === "PICKING" && (
            <button
              onClick={() => handleStatusTransition("ready")}
              disabled={transitioning}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-white disabled:opacity-50 transition-colors w-full sm:w-auto"
            >
              {transitioning && <Loader2 className="w-4 h-4 animate-spin" />} Selesai Picking
            </button>
          )}

          {order.status === "READY_TO_SHIP" && (
            <button
              onClick={() => handleStatusTransition("ship")}
              disabled={transitioning}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-500 hover:bg-indigo-400 text-white disabled:opacity-50 transition-colors w-full sm:w-auto"
            >
              {transitioning && <Loader2 className="w-4 h-4 animate-spin" />} Kirim Barang (Ship)
            </button>
          )}

          {order.status === "SHIPPED" && (
            <>
              <button
                onClick={() => setShowReturnModal(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-orange-600 hover:bg-orange-500 text-white transition-colors w-full sm:w-auto"
              >
                <AlertTriangle className="w-4 h-4" /> Catat Retur
              </button>
              <button
                onClick={() => handleStatusTransition("delivered")}
                disabled={transitioning}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-white disabled:opacity-50 transition-colors w-full sm:w-auto"
              >
                {transitioning && <Loader2 className="w-4 h-4 animate-spin" />} Konfirmasi Barang Tiba
              </button>
            </>
          )}

          {order.status === "DELIVERED" && (
            <button
              onClick={() => setShowReturnModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-orange-600 hover:bg-orange-500 text-white transition-colors w-full sm:w-auto"
            >
              <AlertTriangle className="w-4 h-4" /> Catat Retur
            </button>
          )}
        </div>
      </div>

      {/* Visual Timeline */}
      <DeliveryStatusTimeline currentStatus={order.status} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: General Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <ClipboardList className="w-4.5 h-4.5 text-emerald-400" /> Detail Informasi
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Pelanggan & Alamat</p>
                  <p className="text-white font-bold text-sm mt-0.5">{order.customer?.name}</p>
                  <p className="text-slate-300 mt-1 line-clamp-3">
                    {order.customer?.deliveryAddress}, {order.customer?.city}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Driver / Supir</p>
                  <p className="text-slate-200 mt-0.5">
                    {order.driver?.name || <span className="text-slate-600 italic">Belum Ditugaskan</span>}
                  </p>
                  {order.driver?.phone && <p className="text-slate-400 mt-0.5">No. Telp: {order.driver.phone}</p>}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Tanggal & Jadwal</p>
                  <p className="text-slate-200 mt-0.5">
                    Tanggal Kirim:{" "}
                    <span className="font-semibold text-white">
                      {format(new Date(order.deliveryDate), "dd MMMM yyyy", { locale: localeId })}
                    </span>
                  </p>
                  {order.shippedAt && (
                    <p className="text-slate-400 mt-1">
                      Waktu Keberangkatan: {format(new Date(order.shippedAt), "dd/MM/yyyy HH:mm")}
                    </p>
                  )}
                  {order.deliveredAt && (
                    <p className="text-emerald-400 mt-0.5">
                      Waktu Tiba: {format(new Date(order.deliveredAt), "dd/MM/yyyy HH:mm")}
                    </p>
                  )}
                </div>
              </div>

              {order.notes && (
                <div className="flex items-start gap-2.5 pt-3 border-t border-slate-800">
                  <FileText className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Catatan</p>
                    <p className="text-slate-300 mt-0.5 italic">{order.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Delivery Items and Return Logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Package className="w-4.5 h-4.5 text-emerald-400" /> Item Produk yang Dikirim
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/40 text-slate-400 border-b border-slate-800">
                    <th className="p-3">Produk</th>
                    <th className="p-3">Batch Number</th>
                    <th className="p-3 text-right">Kemasan</th>
                    <th className="p-3 text-right">Jumlah (Sak)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {order.items.map((item: any, index: number) => (
                    <tr key={item.id || index} className="hover:bg-slate-800/10">
                      <td className="p-3 font-semibold text-white">{item.batch.product?.name}</td>
                      <td className="p-3 font-mono text-emerald-400">{item.batch.batchNumber}</td>
                      <td className="p-3 text-right">{Number(item.batch.packagingSize)} kg</td>
                      <td className="p-3 text-right text-white font-bold">{item.orderedQty} sak</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Counters */}
            <div className="flex justify-end pt-2 border-t border-slate-850">
              <div className="text-right space-y-1 text-xs">
                <p className="text-slate-400">
                  Total Sacks: <span className="text-white font-bold">{totalSacks} Sak</span>
                </p>
                <p className="text-slate-400">
                  Total Berat: <span className="text-emerald-400 font-bold">{totalWeight.toLocaleString("id-ID")} kg</span>
                </p>
              </div>
            </div>
          </div>

          {/* Return History Card */}
          {order.returns && order.returns.length > 0 && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
                <History className="w-4.5 h-4.5 text-orange-400" /> Riwayat Retur
              </h3>

              <div className="space-y-3">
                {order.returns.map((ret: any, index: number) => {
                  // Find associated batch number from delivery items
                  const batchNum =
                    order.items.find((i: any) => i.batchId === ret.batchId)?.batch.batchNumber ||
                    "Batch";

                  return (
                    <div
                      key={ret.id || index}
                      className="bg-slate-950/20 border border-slate-800 rounded-lg p-3 text-xs flex justify-between items-start gap-4"
                    >
                      <div className="space-y-1">
                        <p className="font-mono text-emerald-400">{batchNum}</p>
                        <p className="text-slate-300">
                          Alasan: <span className="text-white font-medium">{ret.reason}</span>
                        </p>
                        {ret.notes && (
                          <p className="text-slate-500 italic">
                            &ldquo; {ret.notes} &rdquo;
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="inline-block bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold">
                          -{ret.returnedQty} Sak
                        </span>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {format(new Date(ret.returnedAt), "dd/MM/yyyy HH:mm")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Return Recording Drawer/Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full overflow-hidden shadow-xl">
            <div className="bg-slate-850 p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" /> Catat Retur Pengiriman
              </h3>
              <button
                onClick={() => setShowReturnModal(false)}
                className="text-slate-400 hover:text-white transition-colors font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="p-5 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Tentukan jumlah sak beras yang diretur dan alasannya. Stok yang diretur akan dikembalikan secara otomatis
                ke dalam batch asalnya.
              </p>

              <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1">
                {order.items.map((item: any) => {
                  const retVal = returnItems.find((i) => i.batchId === item.batchId);
                  return (
                    <div
                      key={item.id}
                      className="bg-slate-950/30 p-3 rounded-lg border border-slate-800/60 space-y-2.5 text-xs"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-slate-200">{item.batch.product?.name}</p>
                          <p className="font-mono text-[10px] text-emerald-400">{item.batch.batchNumber}</p>
                        </div>
                        <p className="text-slate-400">
                          Kirim: <span className="text-white font-medium">{item.orderedQty} sak</span>
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 items-center">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-medium uppercase">Jumlah Retur (Sak)</label>
                          <input
                            type="number"
                            min="0"
                            max={item.orderedQty}
                            value={retVal?.returnedQty || 0}
                            onChange={(e) =>
                              handleReturnQtyChange(item.batchId, parseInt(e.target.value, 10) || 0, item.orderedQty)
                            }
                            className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white font-bold focus:border-emerald-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-medium uppercase">Alasan Retur</label>
                          <select
                            value={retVal?.reason || "Kemasan Rusak"}
                            onChange={(e) => handleReturnReasonChange(item.batchId, e.target.value)}
                            className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
                          >
                            <option value="Kemasan Rusak">Kemasan Rusak</option>
                            <option value="Kualitas Bermasalah">Kualitas Bermasalah</option>
                            <option value="Timbangan Kurang">Timbangan Kurang</option>
                            <option value="Salah Kirim">Salah Kirim</option>
                            <option value="Lainnya">Lainnya</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Keterangan Tambahan</label>
                <textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  rows={2}
                  placeholder="Keterangan tambahan mengenai kondisi retur..."
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800 justify-end">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-white disabled:opacity-50 transition-colors"
                >
                  {submittingReturn && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Catat Retur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
