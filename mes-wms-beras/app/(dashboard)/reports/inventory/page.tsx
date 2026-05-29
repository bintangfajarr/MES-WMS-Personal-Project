"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Download,
  Boxes,
  Wheat,
  TrendingDown,
  AlertOctagon,
  LineChart as LineIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Line,
  Legend,
} from "recharts";

import PageHeader from "@/components/shared/PageHeader";
import { exportToCSV } from "@/lib/utils/export-csv";

export default function InventoryReportPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/inventory");
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Gagal memuat data inventaris: " + result.error);
      }
    } catch (e) {
      console.error(e);
      toast.error("Gagal mengambil data dari server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleExport = () => {
    if (!data || data.dailyMovements.length === 0) {
      toast.error("Tidak ada data pergerakan untuk diekspor");
      return;
    }

    const exportData = data.dailyMovements.map((m: any) => ({
      Tanggal: m.date,
      "Padi Masuk (kg)": m.paddyInKg,
      "Padi Keluar/Giling (kg)": m.paddyOutKg,
      "Beras Masuk (Sak)": m.riceInSacks,
      "Beras Keluar (Sak)": m.riceOutSacks,
      "Beras Masuk (kg)": m.riceInKg,
      "Beras Keluar (kg)": m.riceOutKg,
    }));

    exportToCSV(exportData, "Laporan-Pergerakan-Stok-30-Hari");
    toast.success("Log pergerakan berhasil diekspor");
  };

  const getStockStatusBadge = (status: string) => {
    if (status === "DI_BAWAH_MINIMUM") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold tracking-wide animate-pulse">
          <AlertOctagon size={10} />
          DI BAWAH MINIMUM
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-wide">
        AMAN
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Laporan & Pemantauan Stok Inventaris"
          description="Monitoring stock-movement harian serta tingkat kecukupan minimum pergudangan"
        />

        <button
          onClick={handleExport}
          disabled={loading || !data}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition-all self-start md:self-auto text-xs disabled:opacity-50"
        >
          <Download size={14} />
          Export Log CSV
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[350px] bg-slate-900/40 border border-slate-800 rounded-xl animate-pulse" />
          <div className="h-[350px] bg-slate-900/40 border border-slate-800 rounded-xl animate-pulse" />
        </div>
      ) : !data ? (
        <div className="text-center py-10 text-slate-500 bg-slate-900/10 border border-slate-850 rounded-xl">
          Gagal memuat log pergudangan.
        </div>
      ) : (
        <>
          {/* Row 1: Stock Status Monitor & Minimum Alert Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stock Level Table */}
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                  <Boxes size={16} className="text-emerald-400" />
                  Kecukupan Stok Gudang Beras (Finished Goods)
                </h3>
                <p className="text-xs text-slate-500">
                  Perbandingan kuantitas beras di gudang saat ini terhadap batas minimum aman
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/20">
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Nama Produk</th>
                      <th className="py-2.5 px-3 text-right">Stok (Sak)</th>
                      <th className="py-2.5 px-3 text-right">Minimum Stok (Sak)</th>
                      <th className="py-2.5 px-3 text-right">Berat Bersih (Kg)</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.stockStatus.map((prod: any) => (
                      <tr
                        key={prod.id}
                        className="border-b border-slate-850 hover:bg-slate-800/10 text-slate-300 transition-colors"
                      >
                        <td className="py-3 px-3 font-mono font-bold text-slate-200">
                          {prod.sku}
                        </td>
                        <td className="py-3 px-3 font-semibold">{prod.name}</td>
                        <td className="py-3 px-3 text-right font-mono text-white font-extrabold">
                          {prod.currentSacks.toLocaleString("id-ID")}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-400">
                          {prod.minimumStockSacks.toLocaleString("id-ID")}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-300">
                          {prod.currentWeightKg.toLocaleString("id-ID")} kg
                        </td>
                        <td className="py-3 px-3 text-right">
                          {getStockStatusBadge(prod.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Alert Summary Column */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                  <AlertOctagon size={16} className="text-rose-400" />
                  Notifikasi Kritis Logistik
                </h3>
                <p className="text-xs text-slate-500">SKU yang berada di bawah level pemesanan ulang (Re-order point)</p>
              </div>

              <div className="space-y-3 flex-grow mt-4 overflow-y-auto max-h-[220px]">
                {data.stockStatus.filter((p: any) => p.status === "DI_BAWAH_MINIMUM").length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Boxes size={18} className="text-emerald-400" />
                    </div>
                    <p className="text-xs font-semibold">Tingkat stok semua produk berada dalam kondisi aman.</p>
                  </div>
                ) : (
                  data.stockStatus
                    .filter((p: any) => p.status === "DI_BAWAH_MINIMUM")
                    .map((prod: any) => (
                      <div
                        key={prod.sku}
                        className="bg-rose-950/10 border border-rose-950/60 p-3.5 rounded-lg flex items-center gap-3"
                      >
                        <TrendingDown className="w-5 h-5 text-rose-400 shrink-0" />
                        <div className="text-xs leading-snug">
                          <p className="font-bold text-slate-200">{prod.name}</p>
                          <p className="text-slate-400">
                            Stok: <span className="font-mono text-rose-400 font-extrabold">{prod.currentSacks} Sak</span> / Min: {prod.minimumStockSacks} Sak
                          </p>
                        </div>
                      </div>
                    ))
                )}
              </div>

              <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Segera buat work order pengemasan baru
              </div>
            </div>
          </div>

          {/* Row 2: Daily Movement Charts */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <LineIcon size={16} className="text-emerald-400" />
                Tren Arus Keluar Masuk Stok (30 Hari)
              </h3>
              <p className="text-xs text-slate-500">Volume pergerakan logistik bahan baku padi (RM) dan barang jadi beras (FG)</p>
            </div>

            <div className="h-[280px] w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.dailyMovements} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(str) => {
                      try {
                        return format(new Date(str), "dd MMM");
                      } catch (e) {
                        return str;
                      }
                    }}
                  />
                  <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}
                    itemStyle={{ fontSize: 11 }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  
                  {/* Bars for Paddy */}
                  <Bar name="Padi Masuk (kg)" dataKey="paddyInKg" fill="#f59e0b" maxBarSize={15} />
                  <Bar name="Padi Keluar (kg)" dataKey="paddyOutKg" fill="#d97706" maxBarSize={15} />

                  {/* Lines for Finished Rice Sacks */}
                  <Line type="monotone" name="Beras Masuk (Sak)" dataKey="riceInSacks" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" name="Beras Keluar (Sak)" dataKey="riceOutSacks" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 3: Daily Movement Log Table */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Log Harian Pergerakan Gudang</h3>
              <p className="text-xs text-slate-500">Volume ringkasan transaksi masuk/keluar per tanggal kalender</p>
            </div>

            <div className="overflow-x-auto max-h-[300px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/20 sticky top-0 backdrop-blur z-10">
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3 text-right">RM Paddy In (kg)</th>
                    <th className="py-2.5 px-3 text-right">RM Paddy Out (kg)</th>
                    <th className="py-2.5 px-3 text-right">FG Rice In (Sak)</th>
                    <th className="py-2.5 px-3 text-right">FG Rice Out (Sak)</th>
                    <th className="py-2.5 px-3 text-right">FG Weight In (kg)</th>
                    <th className="py-2.5 px-3 text-right">FG Weight Out (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.dailyMovements.filter((m: any) => m.paddyInKg > 0 || m.paddyOutKg > 0 || m.riceInSacks > 0 || m.riceOutSacks > 0).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-500">
                        Tidak ada riwayat pergerakan stok selama 30 hari terakhir.
                      </td>
                    </tr>
                  ) : (
                    [...data.dailyMovements]
                      .reverse()
                      .filter((m: any) => m.paddyInKg > 0 || m.paddyOutKg > 0 || m.riceInSacks > 0 || m.riceOutSacks > 0)
                      .map((m: any) => (
                        <tr
                          key={m.date}
                          className="border-b border-slate-850 hover:bg-slate-800/10 text-slate-300 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-mono font-semibold">
                            {format(new Date(m.date), "dd MMMM yyyy")}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-amber-500">
                            {m.paddyInKg > 0 ? `+${m.paddyInKg.toLocaleString("id-ID")}` : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-amber-600">
                            {m.paddyOutKg > 0 ? `-${m.paddyOutKg.toLocaleString("id-ID")}` : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                            {m.riceInSacks > 0 ? `+${m.riceInSacks.toLocaleString("id-ID")}` : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-blue-400">
                            {m.riceOutSacks > 0 ? `-${m.riceOutSacks.toLocaleString("id-ID")}` : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-500">
                            {m.riceInKg > 0 ? `+${m.riceInKg.toLocaleString("id-ID")} kg` : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-blue-500">
                            {m.riceOutKg > 0 ? `-${m.riceOutKg.toLocaleString("id-ID")} kg` : "—"}
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
