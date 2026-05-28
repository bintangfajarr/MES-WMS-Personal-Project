"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, ArrowLeft, CheckCircle2, Inbox } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import InboundFGForm from "@/components/wms/InboundFGForm";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function RiceWarehouseInboundPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);

  const fetchProductionBatches = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wms/rice-stock?status=PRODUKSI&limit=100");
      const json = await res.json();
      if (json.success) {
        setBatches(json.data);
      }
    } catch (e) {
      console.error("Failed to fetch production batches", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductionBatches();
  }, []);

  const handleInboundSuccess = () => {
    setSelectedBatch(null);
    fetchProductionBatches();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Penerimaan dari Produksi"
        description="Terima batch beras dari produksi ke gudang finished goods"
        actions={
          <button
            onClick={() => router.push("/wms/rice-warehouse")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
        }
      />

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/25 rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center flex-shrink-0">
          <Package className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <p className="text-sm text-blue-300">
            Berikut daftar batch yang sudah selesai diproduksi dan siap
            diterima ke gudang. Klik &quot;Terima ke Gudang&quot; untuk
            memulai proses penerimaan.
          </p>
        </div>
      </div>

      {/* Batch List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 animate-pulse"
            >
              <div className="h-4 bg-slate-800 rounded w-40 mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-slate-800 rounded w-32" />
                <div className="h-3 bg-slate-800 rounded w-24" />
              </div>
              <div className="mt-4 h-9 bg-slate-800 rounded-lg" />
            </div>
          ))}
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
            <Inbox className="w-8 h-8 text-slate-600" />
          </div>
          <div className="text-center">
            <p className="text-slate-400 font-medium">
              Tidak ada batch menunggu penerimaan
            </p>
            <p className="text-sm text-slate-600 mt-1">
              Semua batch dari produksi sudah diterima di gudang
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {batches.map((batch) => (
            <div
              key={batch.id}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono text-sm text-emerald-400 font-medium">
                    {batch.batchNumber}
                  </p>
                  <p className="text-white font-medium mt-1">
                    {batch.product?.name}
                  </p>
                </div>
                <StatusBadge status={batch.status} type="batch" />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div>
                  <p className="text-slate-500 text-xs">Ukuran Kemasan</p>
                  <p className="text-slate-300">
                    {Number(batch.packagingSize)} kg
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Jumlah Sak</p>
                  <p className="text-white font-semibold">{batch.totalSak}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Total Berat</p>
                  <p className="text-slate-300">
                    {Number(batch.totalWeightKg).toLocaleString()} kg
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Tgl Produksi</p>
                  <p className="text-slate-300">
                    {format(new Date(batch.productionDate), "dd MMM yyyy", {
                      locale: localeId,
                    })}
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-500 mb-3">
                WO: {batch.workOrder?.woNumber}
              </div>

              <button
                onClick={() => setSelectedBatch(batch)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" /> Terima ke Gudang
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Inbound Modal */}
      {selectedBatch && (
        <InboundFGForm
          batch={selectedBatch}
          onSuccess={handleInboundSuccess}
          onCancel={() => setSelectedBatch(null)}
        />
      )}
    </div>
  );
}
