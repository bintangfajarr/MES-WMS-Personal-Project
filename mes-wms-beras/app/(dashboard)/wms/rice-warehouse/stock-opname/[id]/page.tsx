"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  Calendar,
  User,
  Clock,
  Check,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function StockOpnameDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [opname, setOpname] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wms/rice-stock/stock-opname/${id}`);
      const json = await res.json();
      if (json.success) {
        setOpname(json.data);
      } else {
        toast.error(json.error || "Gagal memuat detail stock opname");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const handleApprove = async () => {
    if (!confirm("Apakah Anda yakin ingin menyetujui stock opname ini? Tindakan ini akan menyesuaikan stok batch beras di sistem.")) {
      return;
    }

    setApproving(true);
    try {
      const res = await fetch(`/api/wms/rice-stock/stock-opname/${id}/approve`, {
        method: "PATCH",
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Stock opname berhasil disetujui dan stok disesuaikan");
        fetchDetail();
      } else {
        toast.error(json.error || "Gagal menyetujui stock opname");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center gap-2">
        <span className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400 text-sm">Memuat detail stock opname...</span>
      </div>
    );
  }

  if (!opname) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
        <p className="text-slate-400">Stock opname tidak ditemukan</p>
        <button
          onClick={() => router.push("/wms/rice-warehouse/stock-opname")}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar
        </button>
      </div>
    );
  }

  const itemsWithVariance = opname.items?.filter((i: any) => i.variance !== 0) || [];
  const totalVariance = opname.items?.reduce((sum: number, i: any) => sum + Math.abs(i.variance), 0) || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Detail Stock Opname`}
        description="Informasi hasil pencocokan stok fisik dengan sistem"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/wms/rice-warehouse/stock-opname")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali
            </button>
            {isAdmin && !opname.isApproved && (
              <button
                onClick={handleApprove}
                disabled={approving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-white transition-colors disabled:opacity-50"
              >
                {approving ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Setujui & Sesuaikan Stok
              </button>
            )}
          </div>
        }
      />

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Conductor Info Card */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <ClipboardCheck className="w-4.5 h-4.5 text-indigo-400" />
            Informasi Opname
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Petugas:</span>
              <span className="text-slate-300 font-medium flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" /> {opname.conductor?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tanggal:</span>
              <span className="text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {format(new Date(opname.conductedAt), "dd MMMM yyyy HH:mm", {
                  locale: localeId,
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
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
          </div>
        </div>

        {/* Notes Card */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-2">Catatan</h3>
            <p className="text-sm text-slate-400 italic">
              {opname.notes || "Tidak ada catatan tambahan"}
            </p>
          </div>
        </div>

        {/* Variance Card */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="w-4.5 h-4.5 text-yellow-400" />
            Hasil Analisis Selisih
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Item Selisih</p>
              <p className={`text-xl font-bold ${itemsWithVariance.length > 0 ? "text-yellow-400" : "text-emerald-400"}`}>
                {itemsWithVariance.length} item
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Selisih Fisik</p>
              <p className={`text-xl font-bold ${totalVariance > 0 ? "text-yellow-400" : "text-emerald-400"}`}>
                {totalVariance} sak
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Daftar Item Hasil Opname</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase">Batch Number</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase">Produk</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase">Lokasi</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase">Jml Sistem</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase">Jml Fisik</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase">Selisih (Variance)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {opname.items?.map((item: any) => {
                const isDiff = item.variance !== 0;
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-800/20 transition-colors ${
                      isDiff ? "bg-yellow-500/5" : ""
                    }`}
                  >
                    <td className="px-5 py-3 font-mono text-xs text-emerald-400">{item.batch?.batchNumber}</td>
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-white font-medium">{item.batch?.product?.name}</p>
                        <p className="text-[10px] text-slate-500">{item.batch?.product?.sku}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-400">{item.batch?.location?.code || "-"}</td>
                    <td className="px-5 py-3 text-right text-slate-450">{item.systemQty} sak</td>
                    <td className="px-5 py-3 text-right text-slate-200 font-semibold">{item.physicalQty} sak</td>
                    <td
                      className={`px-5 py-3 text-right font-semibold ${
                        item.variance > 0
                          ? "text-emerald-400"
                          : item.variance < 0
                          ? "text-red-400"
                          : "text-slate-500"
                      }`}
                    >
                      {item.variance > 0 ? `+${item.variance}` : item.variance}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
