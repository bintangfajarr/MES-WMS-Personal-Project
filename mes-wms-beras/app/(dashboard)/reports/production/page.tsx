"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Calendar,
  Download,
  Factory,
  Boxes,
  Layers,
  Scale,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Legend,
} from "recharts";

import PageHeader from "@/components/shared/PageHeader";
import { exportToCSV } from "@/lib/utils/export-csv";

export default function ProductionReportPage() {
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
        toast.error("Gagal memuat laporan produksi: " + result.error);
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

    const exportData = data.workOrders.map((wo: any) => {
      const productSummary = wo.batches
        .map((b: any) => `${b.name}: ${b.sacks} Sak (${b.weightKg} kg)`)
        .join(" | ");

      return {
        "Nomor WO": wo.woNumber,
        "Padi Lot": wo.paddyLotNumber,
        Varietas: wo.paddyVariety,
        "Padi Masuk (kg)": wo.paddyInputKg,
        "Beras Jadi (kg)": wo.riceOutputKg,
        "Overall Yield (%)": wo.overallYield,
        "Batch Beras Dihasilkan": productSummary,
        Tanggal: format(new Date(wo.completedAt), "dd/MM/yyyy"),
      };
    });

    exportToCSV(exportData, `Laporan-Produksi-${startDate}-to-${endDate}`);
    toast.success("Laporan berhasil diekspor ke CSV");
  };

  const getProductGridStyle = (sku: string) => {
    if (sku.toUpperCase().includes("PREM")) return "border-emerald-500/20 bg-emerald-500/5 text-emerald-400";
    if (sku.toUpperCase().includes("MED")) return "border-blue-500/20 bg-blue-500/5 text-blue-400";
    return "border-slate-800 bg-slate-900/40 text-slate-400";
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Laporan Volume & Hasil Produksi"
          description="Rincian hasil produk akhir beras premium, medium, dan patah per periode"
        />

        {/* Date Filter & Export */}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 bg-slate-900/40 border border-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-80 bg-slate-900/40 border border-slate-800 rounded-xl animate-pulse" />
        </div>
      ) : !data ? (
        <div className="text-center py-10 text-slate-500 bg-slate-900/10 border border-slate-850 rounded-xl">
          Gagal memuat data dari server.
        </div>
      ) : (
        <>
          {/* Output Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.productSummary.length === 0 ? (
              <div className="col-span-3 text-center py-6 text-slate-500 bg-slate-900/30 border border-slate-800 rounded-xl text-xs">
                Tidak ada output produksi tercatat untuk periode ini.
              </div>
            ) : (
              data.productSummary.map((prod: any) => (
                <div
                  key={prod.sku}
                  className={`border p-5 rounded-xl flex items-center justify-between hover:scale-[1.01] transition-all duration-200 ${getProductGridStyle(
                    prod.sku
                  )}`}
                >
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      {prod.name} ({prod.sku})
                    </span>
                    <span className="text-2xl font-black text-white tracking-tight">
                      {prod.totalSacks.toLocaleString("id-ID")} Sak
                    </span>
                    <span className="block text-[10px] text-slate-400 font-mono">
                      Berat Bersih: {(prod.totalWeightKg / 1000).toFixed(2)} ton
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-slate-850 border border-slate-750 flex items-center justify-center text-slate-400 shrink-0">
                    <Boxes size={18} />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Volume chart */}
          {data.productSummary.length > 0 && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                  <Scale size={16} className="text-emerald-400" />
                  Visualisasi Distribusi Hasil Beras Jadi (Ton)
                </h3>
                <p className="text-xs text-slate-500">Perbandingan output berat bersih (ton) per kategori SKU produk</p>
              </div>

              <div className="h-[250px] w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.productSummary.map((p: any) => ({
                      name: p.name,
                      ton: Math.round((p.totalWeightKg / 1000) * 100) / 100,
                    }))}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}
                      itemStyle={{ fontSize: 11 }}
                    />
                    <Bar name="Hasil Bersih (Ton)" dataKey="ton" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Work Orders detail list */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Log Pengemasan Output Work Order</h3>
              <p className="text-xs text-slate-500">Rincian produk sak yang dihasilkan per Surat Perintah Kerja</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/20">
                    <th className="py-2.5 px-3">Nomor WO</th>
                    <th className="py-2.5 px-3">Bahan Padi</th>
                    <th className="py-2.5 px-3 text-right">Input Padi (kg)</th>
                    <th className="py-2.5 px-3">Produk Dihasilkan (Sack & Kg)</th>
                    <th className="py-2.5 px-3 text-right">Rasio Rendemen (Yield)</th>
                    <th className="py-2.5 px-3">Tanggal Selesai</th>
                  </tr>
                </thead>
                <tbody>
                  {data.workOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500">
                        Tidak ada catatan pengemasan untuk periode ini.
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
                        <td className="py-3 px-3">
                          <span className="font-semibold block">{wo.paddyLotNumber}</span>
                          <span className="text-[10px] text-slate-500 font-medium">{wo.paddyVariety}</span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-400">
                          {wo.paddyInputKg.toLocaleString("id-ID")}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1.5 py-1">
                            {wo.batches.length === 0 ? (
                              <span className="text-slate-500 font-medium italic">Tidak ada kemasan</span>
                            ) : (
                              wo.batches.map((b: any, index: number) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-0.5 rounded bg-slate-850 border border-slate-750 text-[10px] text-slate-400 font-semibold"
                                >
                                  {b.name}: <span className="text-white font-extrabold ml-1">{b.sacks} Sak</span>
                                </span>
                              ))
                            )}
                          </div>
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
