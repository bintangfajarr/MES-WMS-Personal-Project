"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Loader2, Calendar, Clipboard, AlertCircle, Ban, Trash2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import WorkOrderTimeline from "@/components/mes/WorkOrderTimeline";
import StatusBadge from "@/components/shared/StatusBadge";
import ErrorState from "@/components/shared/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/date";

interface WorkOrder {
  id: string;
  woNumber: string;
  paddyLot: {
    lotNumber: string;
    netWeight: number;
    variety: {
      name: string;
      code: string;
    };
    supplier: {
      name: string;
    };
  };
  targetProducts: string[];
  estimatedOutput: number;
  status: string;
  deadline: string;
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
  steps: Array<{
    id: string;
    stepType: any;
    stepOrder: number;
    status: any;
    startedAt: string | null;
    completedAt: string | null;
    notes: string | null;
  }>;
}

export default function WorkOrderDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isActioning, setIsActioning] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/mes/work-orders/${id}`);
      const json = await res.json();
      if (json.success) {
        setWorkOrder(json.data);
      } else {
        setError(json.error);
      }
    } catch {
      setError("Gagal memuat detail Work Order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleCancelWO = async () => {
    if (!confirm("Apakah Anda yakin ingin membatalkan Work Order ini?")) return;
    setIsActioning(true);
    try {
      const res = await fetch(`/api/mes/work-orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Work Order berhasil dibatalkan");
        fetchDetail();
      } else {
        toast.error(json.error || "Gagal membatalkan Work Order");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsActioning(false);
    }
  };

  const handleStepAction = async (stepId: string, action: "start" | "complete") => {
    setIsActioning(true);
    try {
      const res = await fetch(`/api/mes/work-orders/${id}/steps`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepId,
          status: action === "start" ? "IN_PROGRESS" : "SELESAI",
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(
          action === "start" ? "Tahapan berhasil dimulai" : "Tahapan berhasil diselesaikan"
        );
        fetchDetail();
      } else {
        toast.error(json.error || "Gagal mengubah tahapan");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsActioning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        <span className="text-sm text-slate-400">Memuat detail Work Order...</span>
      </div>
    );
  }

  if (error || !workOrder) {
    return <ErrorState message={error || "Work Order tidak ditemukan"} onRetry={fetchDetail} />;
  }

  const products = Array.isArray(workOrder.targetProducts)
    ? workOrder.targetProducts
    : JSON.parse(workOrder.targetProducts as any || "[]");

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Work Order: ${workOrder.woNumber}`}
        description="Detail tahapan giling, informasi lot gabah, dan catatan produksi"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/mes/work-orders")}
              className="border-slate-800 hover:bg-slate-800/50 text-slate-400 hover:text-white rounded-xl flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali
            </Button>
            {isAdmin && workOrder.status === "DRAFT" && (
              <Button
                variant="destructive"
                onClick={handleCancelWO}
                disabled={isActioning}
                className="bg-red-650 hover:bg-red-650/90 text-white rounded-xl flex items-center gap-1.5 shadow"
              >
                <Ban className="w-4 h-4" /> Batalkan WO
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details Card */}
        <Card className="lg:col-span-2 bg-slate-900/40 border-slate-800 rounded-2xl">
          <CardHeader className="border-b border-slate-850 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Clipboard className="w-4 h-4 text-emerald-400" />
                Informasi Produksi
              </CardTitle>
              <StatusBadge status={workOrder.status} type="workOrder" />
            </div>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-500 block">Lot Padi Asal</span>
                <span className="font-semibold text-slate-200">{workOrder.paddyLot?.lotNumber}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Varietas Padi</span>
                <span className="font-semibold text-slate-200">
                  {workOrder.paddyLot?.variety?.name} ({workOrder.paddyLot?.variety?.code})
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Supplier</span>
                <span className="font-semibold text-slate-200">{workOrder.paddyLot?.supplier?.name}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Total Berat Gabah Bersih</span>
                <span className="font-semibold text-slate-200">
                  {Number(workOrder.paddyLot?.netWeight).toLocaleString()} kg
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-500 block">Target Produk Beras</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {products.map((p: string) => (
                    <span
                      key={p}
                      className="px-2 py-0.5 rounded bg-slate-950 border border-slate-850 text-slate-300 text-[10px] font-medium uppercase"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Estimasi Output Beras</span>
                <span className="font-bold text-emerald-400">
                  {Number(workOrder.estimatedOutput).toLocaleString()} kg
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Deadline Produksi</span>
                <span className="font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-550" />
                  {formatDate(workOrder.deadline)}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Dibuat Oleh</span>
                <span className="text-xs text-slate-400 font-medium block">
                  {workOrder.createdBy?.name} ({workOrder.createdBy?.email})
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Side Summary / Deadlines Card */}
        <Card className="bg-slate-900/40 border-slate-800 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
          <CardHeader className="border-b border-slate-850 pb-4 relative z-10">
            <CardTitle className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-emerald-400" />
              Status & Waktu
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4 relative z-10 text-sm">
            <div>
              <span className="text-xs text-slate-500 block">Dibuat Tanggal</span>
              <span className="font-medium text-slate-350">{new Date(workOrder.createdAt).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Estimasi Yield Keseluruhan</span>
              <span className="font-bold text-emerald-400 text-lg">62.00%</span>
              <p className="text-[11px] text-slate-500">Persentase yield standar konversi gabah ke beras siap kemas.</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Steps Timeline Card */}
      <Card className="bg-slate-900/40 border-slate-800 rounded-2xl">
        <CardContent className="p-6">
          <WorkOrderTimeline
            steps={workOrder.steps}
            workOrderStatus={workOrder.status}
            workOrderId={workOrder.id}
            onStepAction={handleStepAction}
            onRefresh={fetchDetail}
          />
        </CardContent>
      </Card>
    </div>
  );
}
