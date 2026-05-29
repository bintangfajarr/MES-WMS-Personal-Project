"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  TrendingUp,
  Calendar,
  Download,
  Percent,
  Activity,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
} from "recharts";

import PageHeader from "@/components/shared/PageHeader";
import { exportToCSV } from "@/lib/utils/export-csv";

export default function YieldReportPage() {
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
        `/api/reports/production?startDate=${startDate}&endDate=${endDate}`
      );
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Gagal memuat laporan: " + result.error);
      }
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat data dari server.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExport = () => {
    if (!data || data.workOrders.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const exportData = data.workOrders.map((wo: any) => ({
      "Nomor WO": wo.woNumber,
      "Padi Lot": wo.paddyLotNumber,
      Varietas: wo.paddyVariety,
      "Padi Masuk (kg)": wo.paddyInputKg,
      "Beras Jadi (kg)": wo.riceOutputKg,
      "Husking Yield (%)": wo.huskingYield,
      "Polishing Yield (%)": wo.polishingYield,
      "Overall Yield (%)": wo.overallYield,
      Tanggal: format(new Date(wo.completedAt), "dd/MM/yyyy"),
    }));

    exportToCSV(exportData, `Laporan-Yield-${startDate}-to-${endDate}`);
    toast.success("Laporan berhasil diekspor ke CSV");
  };

  const getChartData = () => {
    if (!data || data.workOrders.length === 0) return [];
    return [...data.workOrders]
      .reverse()
      .map((wo: any) => ({
        woNumber: wo.woNumber,
        overall: wo.overallYield,
        husking: wo.huskingYield,
        polishing: wo.polishingYield,
      }));
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Laporan Efisiensi Milling & Yield"
          description="Analisis performa hasil penggilingan padi menjadi beras per periode"
        />

        {/* Date Filters & Action */}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-900/40 border border-slate-800 rounded-xl animate-pulse" />
          ))}
          <div className="md:col-span-3 h-80 bg-slate-900/40 border border-slate-800 rounded-xl animate-pulse" />
        </div>
      ) : !data ? (
        <div className="text-center py-10 text-slate-500 bg-slate-900/10 border border-slate-850 rounded-xl">
          Gagal mengambil data.
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl flex items-center justify-between hover:border-slate-750 transition-all duration-200">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Rata-rata Husking Yield
                </span>
                <span className="text-2xl font-black text-white tracking-tight">
                  {data.summary.averageHuskingYield.toFixed(1)}%
                </span>
                <span className="block text-[10px] text-slate-400">Benchmark: 78% - 82%</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                <Activity size={18} />
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl flex items-center justify-between hover:border-slate-750 transition-all duration-200">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Rata-rata Polishing Yield
                </span>
                <span className="text-2xl font-black text-white tracking-tight">
                  {data.summary.averagePolishingYield.toFixed(1)}%
                </span>
                <span className="block text-[10px] text-slate-400">Benchmark: 95% - 98%</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Layers size={18} />
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl flex items-center justify-between hover:border-slate-750 transition-all duration-200">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Rata-rata Overall Yield
                </span>
                <span className="text-2xl font-black text-white tracking-tight">
                  {data.summary.averageOverallYield.toFixed(1)}%
                </span>
                <span className="block text-[10px] text-slate-400">Benchmark: 60% - 65%</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Percent size={18} />
              </div>
            </div>
          </div>

          {/* Line Chart */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <TrendingUp size={16} className="text-emerald-400" />
                Tren Yield Per Work Order
              </h3>
              <p className="text-xs text-slate-500">
                Grafik performa yield secara kronologis berdasarkan urutan penyelesaian WO
              </p>
            </div>
            <div className="h-[250px] w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="woNumber" stroke="#64748b" tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" tickLine={false} axisLine={false} domain={[50, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}
                    itemStyle={{ fontSize: 11 }}
                  />
                  <Line
                    type="monotone"
                    name="Overall Yield"
                    dataKey="overall"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", r: 3 }}
                  />
                  <Line
                    type="monotone"
                    name="Husking"
                    dataKey="husking"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    dot={{ fill: "#f59e0b", r: 2 }}
                  />
                  <Line
                    type="monotone"
                    name="Polishing"
                    dataKey="polishing"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    dot={{ fill: "#3b82f6", r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Rincian Performa Yield Work Order</h3>
              <p className="text-xs text-slate-500">Detil input, output, dan yield per langkah produksi</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/20">
                    <th className="py-2.5 px-3">Nomor WO</th>
                    <th className="py-2.5 px-3">Padi Lot</th>
                    <th className="py-2.5 px-3">Varietas</th>
                    <th className="py-2.5 px-3 text-right">Padi (kg)</th>
                    <th className="py-2.5 px-3 text-right">Beras Jadi (kg)</th>
                    <th className="py-2.5 px-3 text-right">Husking (%)</th>
                    <th className="py-2.5 px-3 text-right">Polishing (%)</th>
                    <th className="py-2.5 px-3 text-right">Overall Yield</th>
                    <th className="py-2.5 px-3">Tanggal Selesai</th>
                  </tr>
                </thead>
                <tbody>
                  {data.workOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-slate-500">
                        Tidak ada data produksi untuk periode ini.
                      </td>
                    </tr>
                  ) : (
                    data.workOrders.map((wo: any) => (
                      <tr
                        key={wo.id}
                        className="border-b border-slate-850 hover:bg-slate-800/10 text-slate-300 transition-colors"
                      >
                        <td className="py-3 px-3 font-mono font-bold text-slate-200">
                          {wo.woNumber}
                        </td>
                        <td className="py-3 px-3 font-semibold">{wo.paddyLotNumber}</td>
                        <td className="py-3 px-3 text-slate-400">{wo.paddyVariety}</td>
                        <td className="py-3 px-3 text-right font-mono">
                          {wo.paddyInputKg.toLocaleString("id-ID")}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-400 font-semibold">
                          {wo.riceOutputKg.toLocaleString("id-ID")}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-orange-400">
                          {wo.huskingYield.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-blue-400">
                          {wo.polishingYield.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-400 font-bold">
                          {wo.overallYield.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          {format(new Date(wo.completedAt), "dd MMM yyyy", { locale: localeId })}
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
