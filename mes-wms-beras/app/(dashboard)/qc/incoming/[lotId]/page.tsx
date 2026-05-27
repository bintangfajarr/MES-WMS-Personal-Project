"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeAlert } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import IncomingQCForm from "@/components/qc/IncomingQCForm";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import { format } from "date-fns";

export default function QCIncomingDetailPage({ params }: { params: Promise<{ lotId: string }> }) {
  const { lotId } = use(params);
  const router = useRouter();

  const [lot, setLot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLot = async () => {
    try {
      const res = await fetch(`/api/wms/paddy-lots/${lotId}`);
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
    fetchLot();
  }, [lotId]);

  if (loading) return <LoadingSkeleton variant="form" />;
  if (error || !lot) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <BadgeAlert className="w-12 h-12 text-red-500 mb-3" />
        <h3 className="text-lg font-bold text-white">Error</h3>
        <p className="text-slate-400 mb-4">{error || "Lot not found"}</p>
        <button
          onClick={() => router.push("/qc/incoming")}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm"
        >
          Back to QC List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push("/qc/incoming")}
          className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-slate-300 hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <PageHeader
          title={`Inspection: ${lot.lotNumber}`}
          description="Evaluate moisture content and grain impurities to authorize or reject lot entries"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Incoming QC Inspection Form */}
        <div className="lg:col-span-2">
          {lot.status === "MENUNGGU_QC" ? (
            <IncomingQCForm lot={lot} onSuccess={() => router.push("/qc/incoming")} />
          ) : (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center space-y-3">
              <div className="text-emerald-400 font-bold text-lg">QC ALREADY SUBMITTED</div>
              <p className="text-xs text-slate-400">
                This paddy lot has already been checked. Current status is:{" "}
                <span className="text-white font-semibold">{lot.status}</span>
              </p>
              <button
                onClick={() => router.push("/qc/incoming")}
                className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Return to Pending List
              </button>
            </div>
          )}
        </div>

        {/* Right Info: Original cargo specs as context */}
        <div className="space-y-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
              Original Weighing Slip Details
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Supplier:</span>
                <span className="text-slate-300 font-medium">{lot.supplier?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Variety:</span>
                <span className="text-slate-300 font-medium">{lot.variety?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Moisture Content:</span>
                <span className="text-yellow-500 font-semibold">{Number(lot.moistureContent)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dirt Percentage:</span>
                <span className="text-red-400 font-semibold">{Number(lot.dirtPercentage)}%</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2">
                <span className="text-slate-500">Gross Weight:</span>
                <span className="text-slate-300">{Number(lot.grossWeight).toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sack Weight:</span>
                <span className="text-slate-300">-{Number(lot.sackWeight).toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 font-bold text-white">
                <span>Net Weight:</span>
                <span>{Number(lot.netWeight).toLocaleString()} kg</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
