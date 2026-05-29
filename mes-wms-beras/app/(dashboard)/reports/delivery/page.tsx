"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Calendar,
  Download,
  Truck,
  CheckCircle,
  Clock,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { exportToCSV } from "@/lib/utils/export-csv";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function DeliveryReportPage() {
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(
    format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [data, setData] = useState<any>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reports/delivery?startDate=${startDate}&endDate=${endDate}`
      );
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Gagal memuat laporan pengiriman: " + result.error);
      }
    } catch (e) {
      console.error(e);
      toast.error("Gagal mengambil data dari server.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExport = () => {
    if (!data || data.deliveries.length === 0) {
      toast.error("Tidak ada data pengiriman untuk diekspor");
      return;
    }

    const exportData = data.deliveries.map((d: any) => ({
      "Nomor DO": d.doNumber,
      Pelanggan: d.customerName,
      Sopir: d.driverName,
      "Volume (Sak)": d.totalSacks,
      "Berat Bersih (kg)": d.totalWeightKg,
      "On-Time Status": d.isOnTime === true ? "Tepat Waktu" : d.isOnTime === false ? "Terlambat" : "Belum Sampai",
      "Jumlah Retur (Sak)": d.returnedQty,
      Status: d.status,
      "Rencana Pengiriman": format(new Date(d.deliveryDate), "dd/MM/yyyy"),
      "Tanggal Tiba": d.deliveredAt ? format(new Date(d.deliveredAt), "dd/MM/yyyy") : "—",
    }));

    exportToCSV(exportData, `Laporan-Logistik-DO-${startDate}-to-${endDate}`);
    toast.success("Data pengiriman berhasil diekspor");
  };

  // Group deliveries per customer to show in chart
  const getCustomerChartData = () => {
    if (!data || data.deliveries.length === 0) return [];
    const customerMap: Record<string, number> = {};
    data.deliveries.forEach((d: any) => {
      if (d.status !== "CANCELLED" && d.status !== "DRAFT") {
        customerMap[d.customerName] = (customerMap[d.customerName] || 0) + d.totalSacks;
      }
    });
    return Object.entries(customerMap).map(([name, sacks]) => ({
      name,
      sacks,
    }));
  };

  const customerChartData = getCustomerChartData();

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Laporan Pengiriman & Distribusi"
          description="Pemantauan kinerja SOP pengantaran barang jadi dan efisiensi logistik"
        />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl self-start md:self-auto text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar size={14} className="text-emerald-400" />
            <span>Periode:</span>
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded px-2.5 py-1 focus:border-emerald-500 focus:outline-none"
          />
          <span className="text-slate-500">—</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded px-2.5 py-1 focus:border-emerald-500 focus:outline-none"
          />
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition-all ml-1"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-slate-900/40 border border-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-80 bg-slate-900/40 border border-slate-800 rounded-xl animate-pulse" />
        </div>
      ) : !data ? (
        <div className="text-center py-10 text-slate-500 bg-slate-900/10 border border-slate-850 rounded-xl">
          Gagal memuat log pengiriman.
        </div>
      ) : (
        <>
          {/* KPI Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl flex items-center justify-between hover:border-slate-750 transition-all duration-200">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Delivery Order
                </span>
                <span className="text-2xl font-black text-white tracking-tight">
                  {data.summary.totalDeliveries} Order
                </span>
                <span className="block text-[10px] text-slate-400">Termasuk draft & pending</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-850 border border-slate-750 flex items-center justify-center text-slate-400 shrink-0">
                <Truck size={18} />
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl flex items-center justify-between hover:border-slate-750 transition-all duration-200">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Volume Terkirim
                </span>
                <span className="text-2xl font-black text-white tracking-tight">
                  {data.summary.totalSacksShipped.toLocaleString("id-ID")} Sak
                </span>
                <span className="block text-[10px] text-emerald-400 font-mono">
                  {(data.summary.totalWeightShippedKg / 1000).toFixed(1)} Tonase
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle size={18} />
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl flex items-center justify-between hover:border-slate-750 transition-all duration-200">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  On-Time Delivery (OTD)
                </span>
                <span className="text-2xl font-black text-white tracking-tight font-mono">
                  {data.summary.onTimeDeliveryRate.toFixed(1)}%
                </span>
                <span className="block text-[10px] text-slate-400">
                  Target: &gt;95% ketepatan waktu
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Clock size={18} />
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl flex items-center justify-between hover:border-slate-750 transition-all duration-200">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Sak Retur
                </span>
                <span className="text-2xl font-black text-white tracking-tight font-mono">
                  {data.summary.totalReturnedSacks.toLocaleString("id-ID")} Sak
                </span>
                <span className="block text-[10px] text-rose-400">
                  Dari {data.summary.returnTransactionsCount} insiden retur
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <RotateCcw size={18} />
              </div>
            </div>
          </div>

          {/* Row 2: Customer Delivery Volume Chart */}
          {customerChartData.length > 0 && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Volume Pengiriman per Pelanggan (Sak)</h3>
                <p className="text-xs text-slate-500">Distribusi alokasi logistik keluar ke outlet pelanggan utama</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-[260px] text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={customerChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}
                        itemStyle={{ fontSize: 11 }}
                      />
                      <Bar name="Volume (Sak)" dataKey="sacks" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-[260px] flex flex-col justify-center items-center text-xs relative">
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie
                        data={customerChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="sacks"
                      >
                        {customerChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {customerChartData.map((entry, index) => (
                      <span key={entry.name} className="flex items-center gap-1 text-[10px] text-slate-400">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        {entry.name} ({entry.sacks} Sak)
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Row 3: Deliveries Ledger Table */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Buku Register Surat Jalan Pengiriman (DO)</h3>
              <p className="text-xs text-slate-500">Status, jadwal, realisasi tiba, sopir, dan volume muatan per Surat Jalan</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/20">
                    <th className="py-2.5 px-3">Nomor DO</th>
                    <th className="py-2.5 px-3">Pelanggan</th>
                    <th className="py-2.5 px-3">Sopir Utama</th>
                    <th className="py-2.5 px-3 text-right">Muatan (Sak)</th>
                    <th className="py-2.5 px-3 text-right">Berat (Kg)</th>
                    <th className="py-2.5 px-3">Realisasi Tiba</th>
                    <th className="py-2.5 px-3">On-Time</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.deliveries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-500">
                        Tidak ada log pengantaran barang selama periode ini.
                      </td>
                    </tr>
                  ) : (
                    data.deliveries.map((d: any) => (
                      <tr
                        key={d.id}
                        className="border-b border-slate-850 hover:bg-slate-800/10 text-slate-300 transition-colors"
                      >
                        <td className="py-3 px-3 font-mono font-bold text-slate-200">
                          {d.doNumber}
                        </td>
                        <td className="py-3 px-3 font-semibold">{d.customerName}</td>
                        <td className="py-3 px-3 text-slate-400">{d.driverName}</td>
                        <td className="py-3 px-3 text-right font-mono text-white font-bold">
                          {d.totalSacks.toLocaleString("id-ID")}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-400">
                          {d.totalWeightKg.toLocaleString("id-ID")} kg
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          {d.deliveredAt
                            ? format(new Date(d.deliveredAt), "dd MMM yyyy HH:mm", { locale: localeId })
                            : "—"}
                        </td>
                        <td className="py-3 px-3">
                          {d.isOnTime === true ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                              TEPAT WAKTU
                            </span>
                          ) : d.isOnTime === false ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold">
                              TERLAMBAT
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={d.status} type="delivery" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
