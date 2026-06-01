"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  Layers,
  Scale,
  Activity,
  CheckCircle,
  XCircle,
  FileText,
  BadgeAlert,
  ClipboardList,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import IncomingQCForm from "@/components/qc/IncomingQCForm";
import { format } from "date-fns";

export default function PaddyLotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [lot, setLot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLotDetail = async () => {
    try {
      const res = await fetch(`/api/wms/paddy-lots/${id}`);
      const json = await res.json();
      if (json.success) {
        setLot(json.data);
      } else {
        setError(json.error || "Paddy lot not found");
      }
    } catch {
      setError("Failed to fetch lot details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLotDetail();
  }, [id]);

  if (loading) return <LoadingSkeleton variant="form" />;
  if (error || !lot) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <BadgeAlert className="w-12 h-12 text-red-500 mb-3" />
        <h3 className="text-lg font-bold text-white">Error</h3>
        <p className="text-slate-400 mb-4">{error || "Lot not found"}</p>
        <button
          onClick={() => router.push("/wms/paddy-warehouse")}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm"
        >
          Back to Warehouse
        </button>
      </div>
    );
  }

  const stockMovements = lot.rmStockMovements || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push("/wms/paddy-warehouse")}
          className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-slate-300 hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <PageHeader
          title={lot.lotNumber}
          description="Detailed metrics and movement logs for this paddy cargo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Lot information card + QC results card if available */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Paddy Lot Metrics */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Lot Specifications</h3>
                <p className="text-xs text-slate-500">
                  Registered: {format(new Date(lot.arrivedAt), "dd MMM yyyy HH:mm")}
                </p>
              </div>
              <StatusBadge status={lot.status} type="paddyLot" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
                <span className="block text-[10px] text-slate-400 font-medium uppercase">Net Weight</span>
                <span className="text-lg font-bold text-white">
                  {Number(lot.netWeight).toLocaleString()} kg
                </span>
              </div>
              <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
                <span className="block text-[10px] text-slate-400 font-medium uppercase">Gross Weight</span>
                <span className="text-slate-400 text-sm font-medium">
                  {Number(lot.grossWeight).toLocaleString()} kg
                </span>
              </div>
              <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
                <span className="block text-[10px] text-slate-400 font-medium uppercase">Moisture Content</span>
                <span className="text-sm font-bold text-yellow-400">{Number(lot.moistureContent)}%</span>
              </div>
              <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
                <span className="block text-[10px] text-slate-400 font-medium uppercase">Dirt Percentage</span>
                <span className="text-sm font-bold text-red-400">{Number(lot.dirtPercentage)}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
              <div className="space-y-2">
                <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
                  <span className="text-slate-400">Supplier:</span>
                  <span className="text-slate-200 font-medium">{lot.supplier?.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
                  <span className="text-slate-400">Supplier Code:</span>
                  <span className="text-slate-200 font-semibold">{lot.supplier?.code}</span>
                </div>
                <div className="flex justify-between pb-1.5">
                  <span className="text-slate-400">Supplier Origin:</span>
                  <span className="text-slate-200 font-medium">{lot.supplier?.region || "-"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
                  <span className="text-slate-400">Paddy Variety:</span>
                  <span className="text-slate-200 font-medium">{lot.variety?.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
                  <span className="text-slate-400">Variety Code:</span>
                  <span className="text-slate-200 font-semibold">{lot.variety?.code}</span>
                </div>
                <div className="flex justify-between pb-1.5">
                  <span className="text-slate-400">Remarks:</span>
                  <span className="text-slate-300 italic">{lot.notes || "-"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* QC Inspection Summary Panel */}
          {lot.incomingQC ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <ClipboardList className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-200">Quality Control (QC) Certificate</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-800/20 p-4 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">QC Status:</span>
                    <StatusBadge status={lot.incomingQC.result} type="qc" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Moisture Content:</span>
                    <span className="font-semibold text-slate-200">{Number(lot.incomingQC.moistureContent)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dirt Percentage:</span>
                    <span className="font-semibold text-slate-200">{Number(lot.incomingQC.dirtPercentage)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Color & Aroma:</span>
                    <span className="font-semibold text-slate-200">{lot.incomingQC.colorAroma}</span>
                  </div>
                </div>

                <div className="bg-slate-800/20 p-4 border border-slate-800 rounded-xl flex flex-col justify-between">
                  <div className="space-y-2">
                    <p className="text-slate-300 italic">
                      &ldquo;{lot.incomingQC.notes || "No extra remarks recorded"}&rdquo;
                    </p>
                  </div>
                  {lot.incomingQC.result === "GAGAL" && (
                    <div className="mt-4 p-3 bg-red-950/20 border border-red-500/20 rounded-lg text-red-400">
                      <span className="font-bold">Rejection Reason: </span>
                      {lot.incomingQC.rejectionReason}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            lot.status === "MENUNGGU_QC" && (
              <IncomingQCForm lot={lot} onSuccess={fetchLotDetail} />
            )
          )}
        </div>

        {/* Right Side: Timeline pergerakan lot */}
        <div className="space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
              <Activity className="w-4 h-4 text-emerald-400" /> WMS Movement History
            </h3>

            {stockMovements.length === 0 ? (
              <p className="text-xs text-slate-500">No stock movements recorded</p>
            ) : (
              <div className="relative border-l border-slate-800 pl-4 space-y-5 ml-1">
                {stockMovements.map((move: any) => {
                  const isIN = move.type === "IN";
                  return (
                    <div key={move.id} className="relative text-xs">
                      {/* Bullet point icon */}
                      <span
                        className={cn(
                          "absolute -left-[21px] top-0.5 w-3.5 h-3.5 rounded-full border flex items-center justify-center bg-slate-950",
                          isIN ? "border-emerald-500 text-emerald-400" : "border-red-500 text-red-400"
                        )}
                      />

                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className={cn("font-bold", isIN ? "text-emerald-400" : "text-red-400")}>
                            {isIN ? "+" : "-"} {Number(move.weightKg).toLocaleString()} kg
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {format(new Date(move.createdAt), "dd MMM HH:mm")}
                          </span>
                        </div>
                        <p className="text-slate-300 font-medium">{move.description}</p>
                        {move.reference && (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-slate-400">
                            Ref: {move.reference}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
