"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Plus, ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function StockOpnamePage() {
  const router = useRouter();
  const [opnames, setOpnames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/wms/rice-stock/stock-opname");
        const json = await res.json();
        if (json.success) setOpnames(json.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Opname"
        description="Riwayat dan pengelolaan stock opname gudang beras"
        actions={
          <div className="flex gap-2">
            <button onClick={() => router.push("/wms/rice-warehouse")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white transition-colors">
              <ArrowLeft className="w-4 h-4" /> Kembali
            </button>
            <button onClick={() => router.push("/wms/rice-warehouse/stock-opname/create")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-white transition-colors">
              <Plus className="w-4 h-4" /> Mulai Stock Opname Baru
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-slate-800 rounded w-48 mb-3" />
              <div className="h-3 bg-slate-800 rounded w-32" />
            </div>
          ))}
        </div>
      ) : opnames.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
            <ClipboardCheck className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400 font-medium">Belum ada stock opname</p>
          <button onClick={() => router.push("/wms/rice-warehouse/stock-opname/create")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-white transition-colors">
            <Plus className="w-4 h-4" /> Mulai Stock Opname
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {opnames.map(opname => {
            const totalItems = opname.items?.length || 0;
            const varianceItems = opname.items?.filter((i: any) => i.variance !== 0).length || 0;
            return (
              <div key={opname.id} onClick={() => router.push(`/wms/rice-warehouse/stock-opname/${opname.id}`)} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-slate-700 cursor-pointer transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      <ClipboardCheck className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">Stock Opname</p>
                        {opname.isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                            <CheckCircle2 className="w-3 h-3" /> Disetujui
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">
                            <Clock className="w-3 h-3" /> Menunggu Approval
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {format(new Date(opname.conductedAt), "dd MMM yyyy HH:mm", { locale: localeId })} — oleh {opname.conductor?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Total Item</p>
                      <p className="text-white font-semibold">{totalItems}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Selisih</p>
                      <p className={`font-semibold ${varianceItems > 0 ? "text-yellow-400" : "text-emerald-400"}`}>
                        {varianceItems} item
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
