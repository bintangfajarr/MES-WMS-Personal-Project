"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, MapPin, Calendar, ClipboardCheck, ArrowRight, Loader2, Package, CheckCircle2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import ErrorState from "@/components/shared/ErrorState";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";

export default function DriverDashboardPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");

  const fetchDriverOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/wms/delivery-orders");
      const json = await res.json();
      if (json.success) {
        setOrders(json.data);
      } else {
        setError(json.error || "Gagal memuat tugas pengiriman");
      }
    } catch (e) {
      setError("Gagal menghubungkan ke server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverOrders();
  }, []);

  const handleUpdateStatus = async (id: string, action: "ship" | "delivered") => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/wms/delivery-orders/${id}/${action}`, {
        method: "PATCH",
      });
      const json = await res.json();
      setUpdatingId(null);

      if (json.success) {
        toast.success(
          action === "ship"
            ? "Perjalanan dimulai! Hati-hati di jalan."
            : "Pengiriman telah dikonfirmasi sampai!"
        );
        fetchDriverOrders();
      } else {
        toast.error(json.error || "Gagal memperbarui status pengiriman");
      }
    } catch (e) {
      setUpdatingId(null);
      toast.error("Terjadi kesalahan sistem");
    }
  };

  // Group orders into pending/completed tabs
  const pendingOrders = orders.filter((o) =>
    ["CONFIRMED", "PICKING", "READY_TO_SHIP", "SHIPPED"].includes(o.status)
  );
  const completedOrders = orders.filter((o) =>
    ["DELIVERED", "PARTIAL_RETURN"].includes(o.status)
  );

  const currentList = activeTab === "pending" ? pendingOrders : completedOrders;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 border border-slate-800 rounded-xl space-y-3">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
        <p className="text-sm text-slate-400">Sedang memuat daftar tugas...</p>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDriverOrders} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Pengiriman Supir"
        description="Pantau tugas pengantaran Anda, mulai rute perjalanan, dan konfirmasi barang tiba di lokasi pelanggan"
      />

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "pending"
              ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Truck className="w-4 h-4" /> Tugas Aktif ({pendingOrders.length})
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "completed"
              ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <ClipboardCheck className="w-4 h-4" /> Riwayat Selesai ({completedOrders.length})
        </button>
      </div>

      {/* List */}
      {currentList.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/20 border border-slate-800 rounded-xl text-slate-500 text-sm">
          Tidak ada tugas pengiriman dalam kategori ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentList.map((order) => {
            const totalSacks = order.items.reduce((sum: number, i: any) => sum + i.orderedQty, 0);
            return (
              <div
                key={order.id}
                onClick={() => router.push(`/wms/delivery/${order.id}`)}
                className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-slate-700 hover:bg-slate-850/50 cursor-pointer transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-emerald-400 font-bold text-sm">
                        {order.doNumber}
                      </span>
                      <p className="text-white font-bold text-sm mt-1">{order.customer?.name}</p>
                    </div>
                    <StatusBadge status={order.status} type="delivery" />
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                      <span>
                        {order.customer?.deliveryAddress}, {order.customer?.city}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>
                        Jadwal:{" "}
                        {format(new Date(order.deliveryDate), "dd MMM yyyy", {
                          locale: localeId,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Muatan: {totalSacks} Sak beras</span>
                    </div>
                  </div>
                </div>

                {/* Actions inside card */}
                <div className="flex gap-2 pt-3 border-t border-slate-800/80 items-center justify-between">
                  <span className="text-[10px] text-slate-500 hover:underline inline-flex items-center gap-1">
                    Lihat detail muatan <ArrowRight className="w-3 h-3" />
                  </span>

                  {order.status === "READY_TO_SHIP" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus(order.id, "ship");
                      }}
                      disabled={updatingId === order.id}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1 transition-colors"
                    >
                      {updatingId === order.id && <Loader2 className="w-3 animate-spin" />}
                      Mulai Perjalanan
                    </button>
                  )}

                  {order.status === "SHIPPED" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus(order.id, "delivered");
                      }}
                      disabled={updatingId === order.id}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-xs flex items-center gap-1 transition-colors"
                    >
                      {updatingId === order.id && <Loader2 className="w-3 animate-spin" />}
                      Konfirmasi Tiba
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
