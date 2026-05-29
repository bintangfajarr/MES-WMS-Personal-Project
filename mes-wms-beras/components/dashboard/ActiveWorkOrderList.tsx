"use client";

import Link from "next/link";
import StatusBadge from "@/components/shared/StatusBadge";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Eye } from "lucide-react";

interface WorkOrder {
  id: string;
  woNumber: string;
  paddyLot: {
    lotNumber: string;
    variety: {
      name: string;
    };
  };
  targetProducts: any; // parsed JSON array
  deadline: string | Date;
  status: string;
}

interface ActiveWorkOrderListProps {
  workOrders: WorkOrder[];
}

export default function ActiveWorkOrderList({ workOrders }: ActiveWorkOrderListProps) {
  const getTargetProductsString = (target: any) => {
    try {
      if (Array.isArray(target)) {
        return target.join(", ");
      }
      if (typeof target === "string") {
        const parsed = JSON.parse(target);
        if (Array.isArray(parsed)) return parsed.join(", ");
      }
    } catch (e) {}
    return "N/A";
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-slate-200">Work Order Terbaru</h3>
          <p className="text-xs text-slate-500">Daftar 5 Surat Perintah Kerja produksi terkini</p>
        </div>
        <Link
          href="/mes/work-orders"
          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Lihat Semua
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/20">
              <th className="py-2.5 px-3">Nomor WO</th>
              <th className="py-2.5 px-3">Padi Lot (Varietas)</th>
              <th className="py-2.5 px-3">Produk Target</th>
              <th className="py-2.5 px-3">Deadline</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {workOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-500">
                  Tidak ada Work Order terbaru.
                </td>
              </tr>
            ) : (
              workOrders.map((wo) => (
                <tr
                  key={wo.id}
                  className="border-b border-slate-850 hover:bg-slate-800/10 text-slate-300 transition-colors group"
                >
                  <td className="py-3 px-3 font-mono font-bold text-slate-200">
                    {wo.woNumber}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold">{wo.paddyLot.lotNumber}</span>
                    <span className="block text-[10px] text-slate-500 font-medium">
                      {wo.paddyLot.variety.name}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/50 text-[10px] text-slate-400 font-semibold uppercase">
                      {getTargetProductsString(wo.targetProducts)}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    {format(new Date(wo.deadline), "dd MMM yyyy", { locale: localeId })}
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={wo.status} type="workOrder" />
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      href={`/mes/work-orders/${wo.id}`}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-emerald-950/30 hover:text-emerald-400 border border-slate-700 hover:border-emerald-900 text-slate-400 font-bold transition-all"
                    >
                      <Eye size={12} />
                      Detail
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
