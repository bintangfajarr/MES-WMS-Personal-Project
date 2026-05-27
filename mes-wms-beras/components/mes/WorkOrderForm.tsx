"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createWorkOrderSchema, CreateWorkOrderInput } from "@/lib/validations/work-order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, ArrowLeft } from "lucide-react";

interface PaddyLot {
  id: string;
  lotNumber: string;
  netWeight: number;
  variety: {
    name: string;
    code: string;
  };
  supplier: {
    name: string;
  };
}

export default function WorkOrderForm() {
  const router = useRouter();
  const [lots, setLots] = useState<PaddyLot[]>([]);
  const [isLoadingLots, setIsLoadingLots] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateWorkOrderInput>({
    resolver: zodResolver(createWorkOrderSchema),
    defaultValues: {
      targetProducts: [],
      notes: "",
    },
  });

  const selectedLotId = watch("paddyLotId");
  const targetProducts = watch("targetProducts") || [];

  // Fetch lots with status ANTRIAN_GILING
  useEffect(() => {
    async function fetchLots() {
      try {
        const res = await fetch("/api/wms/paddy-lots?status=ANTRIAN_GILING");
        const json = await res.json();
        if (json.success) {
          setLots(json.data);
        } else {
          toast.error("Gagal memuat daftar lot padi");
        }
      } catch (err) {
        console.error(err);
        toast.error("Terjadi kesalahan saat memuat lot padi");
      } finally {
        setIsLoadingLots(false);
      }
    }
    fetchLots();
  }, []);

  // Auto-calculate estimated output when lot changes
  useEffect(() => {
    if (selectedLotId) {
      const selectedLot = lots.find((l) => l.id === selectedLotId);
      if (selectedLot) {
        const netWeight = Number(selectedLot.netWeight);
        // estimatedOutput = lot weight * 0.62 (target yield)
        const estOutput = Math.round(netWeight * 0.62 * 100) / 100;
        setValue("estimatedOutput", estOutput);
      }
    }
  }, [selectedLotId, lots, setValue]);

  const handleProductToggle = (productType: string) => {
    const current = [...targetProducts];
    const index = current.indexOf(productType);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(productType);
    }
    setValue("targetProducts", current, { shouldValidate: true });
  };

  const onSubmit = async (data: CreateWorkOrderInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/mes/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Work Order berhasil dibuat!");
        router.push("/mes/work-orders");
      } else {
        toast.error(json.error || "Gagal membuat Work Order");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
      <div className="space-y-4">
        {/* Paddy Lot */}
        <div className="space-y-2">
          <Label htmlFor="paddyLotId" className="text-slate-300">Pilih Lot Padi (Status: Antrian Giling)</Label>
          {isLoadingLots ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
              Memuat lot padi...
            </div>
          ) : lots.length === 0 ? (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              Tidak ada lot padi dalam antrian giling. Silakan lakukan QC penerimaan terlebih dahulu.
            </div>
          ) : (
            <select
              id="paddyLotId"
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors"
              {...register("paddyLotId")}
            >
              <option value="">-- Pilih Lot Padi --</option>
              {lots.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lot.lotNumber} - {lot.variety?.name} ({Number(lot.netWeight).toLocaleString()} kg) - {lot.supplier?.name}
                </option>
              ))}
            </select>
          )}
          {errors.paddyLotId && (
            <p className="text-xs text-red-500">{errors.paddyLotId.message}</p>
          )}
        </div>

        {/* Target Products */}
        <div className="space-y-2">
          <Label className="text-slate-300">Target Produk (Multi-select)</Label>
          <div className="grid grid-cols-3 gap-3">
            {["PREMIUM", "MEDIUM", "PATAH"].map((p) => {
              const active = targetProducts.includes(p);
              return (
                <button
                  type="button"
                  key={p}
                  onClick={() => handleProductToggle(p)}
                  className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-950/20"
                      : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  Beras {p === "PATAH" ? "Patah" : p}
                </button>
              );
            })}
          </div>
          {errors.targetProducts && (
            <p className="text-xs text-red-500">{errors.targetProducts.message}</p>
          )}
        </div>

        {/* Estimated Output */}
        <div className="space-y-2">
          <Label htmlFor="estimatedOutput" className="text-slate-300">Estimasi Output (kg) - Auto Kalkulasi (Yield 62%)</Label>
          <Input
            id="estimatedOutput"
            type="number"
            step="0.01"
            className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 rounded-xl"
            placeholder="0.00"
            {...register("estimatedOutput")}
          />
          {errors.estimatedOutput && (
            <p className="text-xs text-red-500">{errors.estimatedOutput.message}</p>
          )}
        </div>

        {/* Deadline */}
        <div className="space-y-2">
          <Label htmlFor="deadline" className="text-slate-300">Deadline Penggilingan</Label>
          <input
            id="deadline"
            type="date"
            className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors"
            {...register("deadline")}
          />
          {errors.deadline && (
            <p className="text-xs text-red-500">{errors.deadline.message}</p>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-slate-300">Catatan Khusus (Opsional)</Label>
          <Textarea
            id="notes"
            rows={3}
            className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 rounded-xl resize-none"
            placeholder="Masukkan instruksi khusus produksi..."
            {...register("notes")}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/mes/work-orders")}
          className="border-slate-800 hover:bg-slate-800/50 text-slate-400 hover:text-white rounded-xl"
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || lots.length === 0}
          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-2 ml-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Buat Work Order
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
