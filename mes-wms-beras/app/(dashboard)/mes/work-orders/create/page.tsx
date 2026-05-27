"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import WorkOrderForm from "@/components/mes/WorkOrderForm";
import { Button } from "@/components/ui/button";

export default function CreateWorkOrderPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex h-[50vh] items-center justify-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        <span className="text-sm text-slate-400">Memuat otorisasi...</span>
      </div>
    );
  }

  const isAdmin = session?.user?.role === "ADMIN";

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-lg shadow-red-950/20">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-100">Akses Ditolak</h2>
          <p className="text-sm text-slate-400">
            Hanya Admin atau Manager yang memiliki izin untuk membuat Work Order baru.
          </p>
        </div>
        <Button
          onClick={() => router.push("/mes/work-orders")}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl"
        >
          Kembali ke Work Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buat Work Order Baru"
        description="Rencanakan penggilingan padi dari lot gabah yang telah lolos uji QC"
        actions={
          <Button
            variant="outline"
            onClick={() => router.push("/mes/work-orders")}
            className="border-slate-800 hover:bg-slate-800/50 text-slate-400 hover:text-white rounded-xl flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Button>
        }
      />

      <WorkOrderForm />
    </div>
  );
}
