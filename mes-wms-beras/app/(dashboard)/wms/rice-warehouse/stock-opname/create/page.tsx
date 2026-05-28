"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { toast } from "sonner";

export default function CreateStockOpnamePage() {
  const router = useRouter();

  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/wms/rice-stock?status=DI_GUDANG&limit=200");
        const json = await res.json();
        if (json.success) {
          setBatches(json.data);
          const counts: Record<string, number> = {};
          json.data.forEach((b: any) => { counts[b.id] = b.totalSak; });
          setPhysicalCounts(counts);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const getVariance = (batchId: string, systemQty: number) => {
    return (physicalCounts[batchId] ?? systemQty) - systemQty;
  };

  const totalVarianceItems = batches.filter(b => getVariance(b.id, b.totalSak) !== 0).length;
  const totalVariance = batches.reduce((sum, b) => sum + Math.abs(getVariance(b.id, b.totalSak)), 0);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const items = batches.map(b => ({
        batchId: b.id,
        physicalQty: physicalCounts[b.id] ?? b.totalSak,
      }));

      const res = await fetch("/api/wms/rice-stock/stock-opname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, notes }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Stock opname berhasil disimpan");
        router.push("/wms/rice-warehouse/stock-opname");
      } else {
        toast.error(json.error || "Gagal menyimpan stock opname");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Opname Baru"
        description="Input jumlah fisik untuk setiap batch beras di gudang"
        actions={
          <button onClick={() => router.push("/wms/rice-warehouse/stock-opname")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
        }
      />

      {loading ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 animate-pulse">
          <div className="h-6 bg-slate-800 rounded w-48 mb-4" />
          {[1,2,3,4].map(i => <div key={i} className="h-10 bg-slate-800 rounded mb-2" />)}
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
          <p className="text-slate-400">Tidak ada batch aktif di gudang untuk di-opname</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Batch</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Produk</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Lokasi</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Jml Sistem</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase">Input Fisik</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {batches.map(batch => {
                    const variance = getVariance(batch.id, batch.totalSak);
                    return (
                      <tr key={batch.id} className="hover:bg-slate-800/20">
                        <td className="px-4 py-3 font-mono text-xs text-emerald-400">{batch.batchNumber}</td>
                        <td className="px-4 py-3 text-white">{batch.product?.name}</td>
                        <td className="px-4 py-3 text-slate-400">{batch.location?.code || "-"}</td>
                        <td className="px-4 py-3 text-right text-slate-300 font-medium">{batch.totalSak}</td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            value={physicalCounts[batch.id] ?? batch.totalSak}
                            onChange={e => setPhysicalCounts(prev => ({ ...prev, [batch.id]: parseInt(e.target.value) || 0 }))}
                            min={0}
                            className="w-24 bg-slate-800 border border-slate-700 text-white text-sm text-center rounded-lg px-2 py-1.5 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold ${variance > 0 ? "text-emerald-400" : variance < 0 ? "text-red-400" : "text-slate-500"}`}>
                          {variance > 0 ? `+${variance}` : variance}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary & Submit */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-slate-500">Item dengan selisih</p>
                <p className={`text-lg font-bold ${totalVarianceItems > 0 ? "text-yellow-400" : "text-emerald-400"}`}>{totalVarianceItems}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total selisih (absolut)</p>
                <p className={`text-lg font-bold ${totalVariance > 0 ? "text-yellow-400" : "text-emerald-400"}`}>{totalVariance} sak</p>
              </div>
            </div>

            {totalVarianceItems > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-lg p-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                <p className="text-xs text-yellow-300">Terdapat {totalVarianceItems} item dengan selisih stok. Data akan diajukan untuk persetujuan Admin.</p>
              </div>
            )}

            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Catatan stock opname (opsional)..."
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2.5 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
            />

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              {submitting ? "Menyimpan..." : "Submit Stock Opname"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
