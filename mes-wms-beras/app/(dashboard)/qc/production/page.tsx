"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ListFilter,
  Sliders,
  TrendingUp,
  FileSpreadsheet,
  Settings,
  Scale,
  Calendar,
  User,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";

const cardCls = "bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg";
const labelCls = "text-xs font-semibold text-slate-400 uppercase tracking-wider";
const inputCls =
  "w-full px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder:text-slate-500";

export default function ProductionQCPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"grading" | "history" | "stats">("grading");
  
  // Data State
  const [sortingLogs, setSortingLogs] = useState<any[]>([]);
  const [incomingQCs, setIncomingQCs] = useState<any[]>([]);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [resultFilter, setResultFilter] = useState("ALL"); // ALL, LULUS, GAGAL

  // Override Modal State
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [premiumInput, setPremiumInput] = useState(0);
  const [mediumInput, setMediumInput] = useState(0);
  const [patahInput, setPatahInput] = useState(0);
  const [overrideNotes, setOverrideNotes] = useState("");
  const [submittingOverride, setSubmittingOverride] = useState(false);

  const fetchQCData = async () => {
    try {
      const res = await fetch("/api/qc/production");
      const resData = await res.json();
      if (resData.success) {
        setSortingLogs(resData.data.sortingLogs || []);
        setIncomingQCs(resData.data.incomingQCs || []);
      } else {
        toast.error(resData.error || "Gagal memuat data QC");
      }
    } catch {
      toast.error("Gagal terhubung ke API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQCData();
  }, []);

  const openOverrideModal = (log: any) => {
    const decision = log.gradingDecision as any || {};
    setSelectedLog(log);
    setPremiumInput(Number(decision.PREMIUM || 0));
    setMediumInput(Number(decision.MEDIUM || 0));
    setPatahInput(Number(decision.PATAH || 0));
    setOverrideNotes("");
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLog) return;
    if (premiumInput + mediumInput + patahInput <= 0) {
      toast.error("Total alokasi harus lebih besar dari 0");
      return;
    }

    setSubmittingOverride(true);
    try {
      const res = await fetch("/api/qc/production/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sortingLogId: selectedLog.id,
          premium: premiumInput,
          medium: mediumInput,
          patah: patahInput,
          notes: overrideNotes,
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        toast.success("Keputusan grading berhasil di-override!");
        setSelectedLog(null);
        fetchQCData();
      } else {
        toast.error(resData.error || "Gagal melakukan override");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setSubmittingOverride(false);
    }
  };

  // Stats Calculations
  const totalIncomingInspected = incomingQCs.length;
  const passedIncoming = incomingQCs.filter((qc) => qc.result === "LULUS").length;
  const passRate = totalIncomingInspected > 0 ? ((passedIncoming / totalIncomingInspected) * 100).toFixed(1) : "—";
  
  const avgWholeGrain = sortingLogs.length > 0 
    ? (sortingLogs.reduce((acc, log) => acc + Number(log.wholeGrainRatio), 0) / sortingLogs.length).toFixed(1) 
    : "—";

  // Filtered History unified list
  const unifiedHistory = [
    ...incomingQCs.map((qc) => ({
      id: qc.id,
      type: "INCOMING",
      reference: qc.paddyLot.lotNumber,
      variety: qc.paddyLot.variety.name,
      inspectedAt: new Date(qc.inspectedAt),
      result: qc.result,
      details: `Kadar Air: ${qc.moistureContent}%, Kotoran: ${qc.dirtPercentage}%, Aroma/Warna: ${qc.colorAroma}`,
      notes: qc.notes || "—",
    })),
    ...sortingLogs.map((log) => {
      const decision = log.gradingDecision as any || {};
      const premium = Number(decision.PREMIUM || 0);
      const medium = Number(decision.MEDIUM || 0);
      const patah = Number(decision.PATAH || 0);
      return {
        id: log.id,
        type: "GRADING",
        reference: log.productionLog.workOrder.woNumber,
        variety: log.productionLog.workOrder.paddyLot.variety.name,
        inspectedAt: new Date(log.createdAt),
        result: log.wholeGrainRatio >= 95 ? "LULUS (PREMIUM)" : log.wholeGrainRatio >= 80 ? "LULUS (MEDIUM)" : "LULUS (PATAH)",
        details: `Butir Utuh: ${log.wholeGrainRatio}%. Alokasi -> Premium: ${premium}kg, Medium: ${medium}kg, Patah: ${patah}kg`,
        notes: log.productionLog.notes || "—",
      };
    })
  ].sort((a, b) => b.inspectedAt.getTime() - a.inspectedAt.getTime());

  const filteredHistory = unifiedHistory.filter((item) => {
    const matchesSearch = item.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.variety.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = resultFilter === "ALL" || 
      (resultFilter === "LULUS" && item.result.includes("LULUS")) ||
      (resultFilter === "GAGAL" && item.result.includes("DITOLAK"));

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-sm text-slate-400 mt-3">Memuat data QC & Grading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="QC & Grading Produksi"
        description="Pantau kualitas hasil produksi beras, evaluasi keputusan grading otomatis, dan akses riwayat inspeksi sistem."
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab("grading")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "grading"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Antrean Grading & Override
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "history"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Riwayat QC Unified
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "stats"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Statistik Kualitas
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "grading" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" /> Hasil Sortasi & Alokasi Grade Aktif
            </h3>
            {!isAdmin && (
              <span className="text-xs text-amber-400 flex items-center gap-1.5 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                <ShieldAlert className="w-3.5 h-3.5" /> Hanya Admin yang dapat meng-override grading
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {sortingLogs.length === 0 ? (
              <div className={`${cardCls} text-center py-10 text-slate-500 text-sm`}>
                Belum ada data log sortasi produksi terkini.
              </div>
            ) : (
              sortingLogs.map((log) => {
                const decision = log.gradingDecision as any || {};
                const premium = Number(decision.PREMIUM || 0);
                const medium = Number(decision.MEDIUM || 0);
                const patah = Number(decision.PATAH || 0);
                const isOverridden = log.productionLog.notes?.includes("[OVERRIDE QC]");

                return (
                  <div key={log.id} className={`${cardCls} border-l-4 ${log.wholeGrainRatio >= 95 ? "border-l-emerald-500" : log.wholeGrainRatio >= 80 ? "border-l-amber-500" : "border-l-orange-500"} space-y-4`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-bold text-slate-100">{log.productionLog.workOrder.woNumber}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${log.wholeGrainRatio >= 95 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : log.wholeGrainRatio >= 80 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-orange-500/10 text-orange-400 border border-orange-500/20"}`}>
                            Grade: {log.wholeGrainRatio >= 95 ? "Premium" : log.wholeGrainRatio >= 80 ? "Medium" : "Patah"}
                          </span>
                          {isOverridden && (
                            <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-full font-bold border border-sky-500/20 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Overridden
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Varietas: {log.productionLog.workOrder.paddyLot.variety.name} | Tanggal: {new Date(log.createdAt).toLocaleString("id-ID")}
                        </p>
                      </div>
                      
                      {isAdmin && (
                        <button
                          onClick={() => openOverrideModal(log)}
                          className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
                        >
                          Override Grading
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                      <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Rasio Butir Utuh</p>
                        <p className="text-xl font-black text-slate-100 mt-1">{log.wholeGrainRatio}%</p>
                      </div>
                      <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Alokasi Premium</p>
                        <p className="text-xl font-black text-emerald-400 mt-1">{premium.toLocaleString("id-ID")} kg</p>
                      </div>
                      <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Alokasi Medium</p>
                        <p className="text-xl font-black text-amber-400 mt-1">{medium.toLocaleString("id-ID")} kg</p>
                      </div>
                      <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Alokasi Patah</p>
                        <p className="text-xl font-black text-orange-400 mt-1">{patah.toLocaleString("id-ID")} kg</p>
                      </div>
                    </div>

                    {log.productionLog.notes && (
                      <div className="bg-slate-950/20 p-3 rounded-lg border border-slate-800/50 text-xs text-slate-400 whitespace-pre-line">
                        <strong>Catatan & Log Audit:</strong><br />
                        {log.productionLog.notes}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-emerald-400" /> Riwayat Inspeksi & Grading Seluruhnya
            </h3>
            
            {/* Search & Filters */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari referensi, varietas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${inputCls} pl-9 w-64`}
                />
              </div>
              <select
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value)}
                className={inputCls}
              >
                <option value="ALL">Semua Hasil</option>
                <option value="LULUS">Lulus / Selesai</option>
                <option value="GAGAL">Ditolak</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden border border-slate-800 rounded-xl bg-slate-950/20">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Tanggal / Waktu</th>
                  <th className="p-4">Tipe QC</th>
                  <th className="p-4">Referensi / WO</th>
                  <th className="p-4">Varietas</th>
                  <th className="p-4">Hasil Kualitas</th>
                  <th className="p-4">Detail Parameter</th>
                  <th className="p-4">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Tidak ditemukan riwayat inspeksi QC yang sesuai.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="p-4 text-slate-400 whitespace-nowrap">
                        {item.inspectedAt.toLocaleString("id-ID")}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.type === "INCOMING" 
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
                            : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                        }`}>
                          {item.type === "INCOMING" ? "Incoming" : "Grading"}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-200">{item.reference}</td>
                      <td className="p-4 text-slate-300">{item.variety}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.result.includes("LULUS") || item.result.includes("PREMIUM") || item.result.includes("MEDIUM")
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}>
                          {item.result.includes("LULUS") || item.result.includes("PREMIUM") || item.result.includes("MEDIUM") ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {item.result}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 max-w-xs truncate" title={item.details}>
                        {item.details}
                      </td>
                      <td className="p-4 text-slate-500 max-w-xs truncate" title={item.notes}>
                        {item.notes}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "stats" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={cardCls}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Incoming QC Pass Rate</p>
                <h4 className="text-3xl font-black text-emerald-400 mt-2">{passRate}%</h4>
              </div>
              <span className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-4 text-xs text-slate-400">
              Total {passedIncoming} dari {totalIncomingInspected} lot padi lolos QC penerimaan.
            </div>
          </div>

          <div className={cardCls}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rata-rata Rasio Butir Utuh</p>
                <h4 className="text-3xl font-black text-sky-400 mt-2">{avgWholeGrain}%</h4>
              </div>
              <span className="p-2.5 bg-sky-500/10 rounded-lg text-sky-400 border border-sky-500/20">
                <TrendingUp className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-4 text-xs text-slate-400">
              Hasil grading optimal didominasi butir utuh berkualitas.
            </div>
          </div>

          <div className={cardCls}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Lot Terinspeksi</p>
                <h4 className="text-3xl font-black text-purple-400 mt-2">{totalIncomingInspected + sortingLogs.length}</h4>
              </div>
              <span className="p-2.5 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-4 text-xs text-slate-400">
              Inspeksi incoming lot: {totalIncomingInspected} | Grading gilingan: {sortingLogs.length}
            </div>
          </div>
        </div>
      )}

      {/* Override Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <form onSubmit={handleSaveOverride} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-400" /> Override Grading Decision
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                WO: {selectedLog.productionLog.workOrder.woNumber} | Utuh: {selectedLog.wholeGrainRatio}%
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className={labelCls}>Jumlah Premium (kg)</label>
                <input
                  type="number"
                  value={premiumInput}
                  onChange={(e) => setPremiumInput(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className={inputCls}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Jumlah Medium (kg)</label>
                <input
                  type="number"
                  value={mediumInput}
                  onChange={(e) => setMediumInput(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className={inputCls}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Jumlah Patah (kg)</label>
                <input
                  type="number"
                  value={patahInput}
                  onChange={(e) => setPatahInput(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className={inputCls}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Alasan Override *</label>
                <textarea
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  placeholder="Jelaskan alasan override keputusan sistem..."
                  rows={2}
                  className={`${inputCls} resize-none`}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submittingOverride}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {submittingOverride && <Loader2 className="w-3 h-3 animate-spin" />}
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
