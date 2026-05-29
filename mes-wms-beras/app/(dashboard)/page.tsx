"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Wheat,
  Package,
  Factory,
  Truck,
  AlertTriangle,
  RefreshCw,
  X,
  Boxes,
} from "lucide-react";
import { toast } from "sonner";

import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import StockSummaryCard from "@/components/dashboard/StockSummaryCard";
import ProductionChart from "@/components/dashboard/ProductionChart";
import YieldGaugeChart from "@/components/dashboard/YieldGaugeChart";
import ActiveWorkOrderList from "@/components/dashboard/ActiveWorkOrderList";
import MachineStatusGrid from "@/components/dashboard/MachineStatusGrid";
import AlertBanner from "@/components/shared/AlertBanner";

const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(30);

  // Fetch stats from consolidated API endpoint
  const fetchDashboardStats = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch("/api/reports/dashboard-stats");
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Gagal memuat statistik dashboard: " + result.error);
      }
    } catch (e) {
      console.error(e);
      toast.error("Error memuat data dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setTimeLeft(30); // Reset timer
    }
  }, []);

  // Set up auto-refresh polling
  useEffect(() => {
    fetchDashboardStats();

    const pollInterval = setInterval(() => {
      fetchDashboardStats(true);
    }, AUTO_REFRESH_INTERVAL);

    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => (prev > 1 ? prev - 1 : 30));
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(timerInterval);
    };
  }, [fetchDashboardStats]);

  // Handle alert dismissal with local optimistic state update and API sync
  const handleDismissAlert = async (alertId: string) => {
    try {
      // Optimistically filter alert out of state
      setData((prev: any) => ({
        ...prev,
        activeAlerts: prev.activeAlerts.filter((a: any) => a.id !== alertId),
      }));

      const res = await fetch(`/api/reports/alerts/${alertId}/dismiss`, {
        method: "POST",
      });
      const result = await res.json();

      if (result.success) {
        toast.success("Notifikasi berhasil diselesaikan");
      } else {
        toast.error("Gagal menyelesaikan notifikasi: " + result.error);
        // Rollback state if failed
        fetchDashboardStats(true);
      }
    } catch (e) {
      toast.error("Gagal terhubung ke server.");
      fetchDashboardStats(true);
    }
  };

  if (sessionStatus === "loading" || (loading && !data)) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-14 w-1/3 bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-8 w-24 bg-slate-800 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-[350px] bg-slate-800 rounded-xl animate-pulse" />
          <div className="h-[350px] bg-slate-800 rounded-xl animate-pulse" />
        </div>
        <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  // Fallback defaults if no data exists yet
  const stats = data || {
    paddyStockKg: 0,
    riceStockByProduct: [],
    activeWorkOrders: 0,
    pendingDeliveries: 0,
    activeAlerts: [],
    recentWorkOrders: [],
    machineStatuses: [],
    productionChartData: [],
  };

  // Map activeAlerts to support AlertBanner interface
  const bannerAlerts = (stats.activeAlerts || []).map((a: any) => {
    let severity = "WARNING";
    if (a.type === "STOK_PADI_RENDAH" || a.type === "STOK_BERAS_RENDAH" || a.type === "YIELD_RENDAH" || a.type === "MESIN_MAINTENANCE") {
      severity = "CRITICAL";
    } else if (a.type === "KADALUARSA_DEKAT" || a.type === "DO_BELUM_KONFIRMASI") {
      severity = "WARNING";
    } else {
      severity = "INFO";
    }
    return {
      id: a.id,
      type: a.type,
      severity,
      message: a.message
    };
  });

  // Calculate total sacks in finished goods
  const totalRiceSacks = stats.riceStockByProduct.reduce(
    (sum: number, p: any) => sum + p.totalSak,
    0
  );
  const totalRiceWeight = stats.riceStockByProduct.reduce(
    (sum: number, p: any) => sum + p.totalKg,
    0
  );

  // Compute 7-day average yield to feed into Gauge
  const recentYields = stats.productionChartData.filter((d: any) => d.yield > 0);
  const averageYield =
    recentYields.length > 0
      ? recentYields.reduce((sum: number, d: any) => sum + d.yield, 0) / recentYields.length
      : 0;

  return (
    <div className="space-y-6 relative pb-10">
      {/* Auto Refresh Progress Indicator */}
      <div className="absolute top-0 right-0 flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold bg-slate-900/60 border border-slate-800 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] animate-pulse" />
          LIVE UPDATES
        </span>
        <button
          onClick={() => fetchDashboardStats()}
          disabled={refreshing}
          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-slate-800 text-slate-400 hover:text-white transition-all disabled:opacity-50"
          title="Refresh Data"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Real-time Loading/Polling Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-950 z-50 overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all duration-1000 ease-linear shadow-[0_0_10px_#10b981]"
          style={{ width: `${(timeLeft / 30) * 100}%` }}
        />
      </div>

      <PageHeader
        title="Dashboard"
        description={`Selamat datang kembali, ${session?.user?.name || "Operator"}. Berikut adalah ikhtisar operasional pabrik hari ini.`}
      />

      {/* Top Alert Banner */}
      <AlertBanner alerts={bannerAlerts} onDismiss={handleDismissAlert} />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StockSummaryCard
          title="Stok Paddy (RM)"
          value={`${stats.paddyStockKg.toLocaleString("id-ID")} kg`}
          subtext="Bahan baku aktif di gudang"
          icon={<Wheat className="w-5 h-5" />}
          theme="amber"
        />
        <StockSummaryCard
          title="Stok Beras (FG)"
          value={`${totalRiceSacks.toLocaleString("id-ID")} Sak`}
          subtext={`${totalRiceWeight.toLocaleString("id-ID")} kg siap dikirim`}
          icon={<Package className="w-5 h-5" />}
          theme="emerald"
        />
        <StockSummaryCard
          title="Work Order Aktif"
          value={stats.activeWorkOrders}
          subtext="Sedang berjalan di produksi"
          icon={<Factory className="w-5 h-5" />}
          theme="blue"
        />
        <StockSummaryCard
          title="Pengiriman Pending"
          value={stats.pendingDeliveries}
          subtext="Menunggu proses WMS DO"
          icon={<Truck className="w-5 h-5" />}
          theme="indigo"
        />
      </div>

      {/* Core charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ProductionChart data={stats.productionChartData} />
        </div>
        <div>
          <YieldGaugeChart value={averageYield} />
        </div>
      </div>

      {/* Lower Section: Recent Work Orders vs Alert Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ActiveWorkOrderList workOrders={stats.recentWorkOrders} />
        </div>

        {/* Alert Center */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Alert System</h3>
                <p className="text-xs text-slate-500">Pemberitahuan & kendala aktif di lapangan</p>
              </div>
              {stats.activeAlerts.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold tracking-wider animate-pulse">
                  {stats.activeAlerts.length} BARU
                </span>
              )}
            </div>

            {/* List of active alerts */}
            <div className="space-y-3 mt-4 overflow-y-auto max-h-[220px] pr-1">
              {stats.activeAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-800/40 flex items-center justify-center">
                    <Boxes className="w-5 h-5 text-slate-600" />
                  </div>
                  <p className="text-xs font-semibold">Semua sistem berjalan normal.</p>
                </div>
              ) : (
                stats.activeAlerts.map((alert: any) => (
                  <div
                    key={alert.id}
                    className="relative flex items-start gap-3 bg-slate-950/50 border border-slate-850 p-3 rounded-lg hover:border-slate-800 transition-all duration-200 group"
                  >
                    <div className="w-6 h-6 rounded-md bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    </div>
                    <div className="space-y-0.5 flex-grow pr-5">
                      <p className="text-xs text-slate-300 font-medium leading-normal">
                        {alert.message}
                      </p>
                      <span className="block text-[9px] text-slate-500 font-bold font-mono">
                        {new Date(alert.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDismissAlert(alert.id)}
                      className="absolute top-2 right-2 p-0.5 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Selesaikan Notifikasi"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/60 flex justify-between items-center text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            <span>SINKRONISASI AKTIF</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              CONNECTED
            </span>
          </div>
        </div>
      </div>

      {/* Machine Status visualizer */}
      <MachineStatusGrid machines={stats.machineStatuses} />
    </div>
  );
}
