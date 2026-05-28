"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { huskingLogSchema, HuskingLogInput } from "@/lib/validations/production-log";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Save, AlertTriangle } from "lucide-react";

interface HuskingFormProps {
  workOrderId: string;
  onSuccess: () => void;
}

interface Machine {
  id: string;
  name: string;
  code: string;
}

export default function HuskingForm({ workOrderId, onSuccess }: HuskingFormProps) {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isLoadingMachines, setIsLoadingMachines] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<HuskingLogInput>({
    resolver: zodResolver(huskingLogSchema) as any,
    defaultValues: {
      workOrderId,
      startTime: new Date(),
      endTime: new Date(),
    },
  });

  const inputWeight = watch("inputWeight");
  const brownRiceOutput = watch("brownRiceOutput");

  // Fetch Husker machines and previous step (Drying) output if available
  useEffect(() => {
    async function initForm() {
      try {
        const [mRes, wRes, lRes] = await Promise.all([
          fetch("/api/master-data/machines"),
          fetch(`/api/mes/work-orders/${workOrderId}`),
          fetch(`/api/mes/production-logs?workOrderId=${workOrderId}`),
        ]);
        const mJson = await mRes.json();
        const wJson = await wRes.json();
        const lJson = await lRes.json();

        if (mJson.success) {
          const huskers = mJson.data.filter((m: any) => m.type === "HUSKER");
          setMachines(huskers);
        }

        let prefilledWeight = 0;
        if (lJson.success && lJson.data) {
          // Find output weight of DRYING step
          const dryingLog = lJson.data.find((log: any) => log.stepType === "PENGERINGAN");
          if (dryingLog) {
            prefilledWeight = Number(dryingLog.outputWeight);
          }
        }

        if (prefilledWeight === 0 && wJson.success && wJson.data) {
          prefilledWeight = Number(wJson.data.paddyLot?.netWeight || 0);
        }

        setValue("inputWeight", prefilledWeight);
      } catch (err) {
        console.error(err);
        toast.error("Gagal memuat inisialisasi form");
      } finally {
        setIsLoadingMachines(false);
      }
    }
    initForm();
  }, [workOrderId, setValue]);

  const onSubmit = async (data: HuskingLogInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/mes/production-logs/husking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Catatan Penggilingan berhasil disimpan!");
        onSuccess();
      } else {
        toast.error(json.error || "Gagal menyimpan catatan");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const huskingYield = inputWeight && brownRiceOutput ? (brownRiceOutput / inputWeight) * 100 : 0;
  const isYieldLow = huskingYield > 0 && huskingYield < 75;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-slate-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Machine */}
        <div className="space-y-1.5">
          <Label htmlFor="machineId">Pilih Mesin Husker</Label>
          {isLoadingMachines ? (
            <div className="text-xs text-slate-500">Memuat mesin...</div>
          ) : (
            <select
              id="machineId"
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 transition-colors"
              {...register("machineId")}
            >
              <option value="">-- Pilih Husker --</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.code})
                </option>
              ))}
            </select>
          )}
          {errors.machineId && <p className="text-[10px] text-red-500">{errors.machineId.message}</p>}
        </div>

        {/* Input Weight */}
        <div className="space-y-1.5">
          <Label htmlFor="inputWeight">Berat Gabah Masuk (kg)</Label>
          <Input
            id="inputWeight"
            type="number"
            step="0.01"
            className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl h-9"
            {...register("inputWeight")}
          />
          {errors.inputWeight && <p className="text-[10px] text-red-500">{errors.inputWeight.message}</p>}
        </div>

        {/* Brown Rice Output */}
        <div className="space-y-1.5">
          <Label htmlFor="brownRiceOutput">Beras Pecah Kulit (kg)</Label>
          <Input
            id="brownRiceOutput"
            type="number"
            step="0.01"
            className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl h-9"
            {...register("brownRiceOutput")}
          />
          {errors.brownRiceOutput && <p className="text-[10px] text-red-500">{errors.brownRiceOutput.message}</p>}
        </div>

        {/* Husk Output */}
        <div className="space-y-1.5">
          <Label htmlFor="huskOutput">Sekam / By-product (kg)</Label>
          <Input
            id="huskOutput"
            type="number"
            step="0.01"
            className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl h-9"
            {...register("huskOutput")}
          />
          {errors.huskOutput && <p className="text-[10px] text-red-500">{errors.huskOutput.message}</p>}
        </div>
      </div>

      {/* Yield Real-time Preview */}
      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Estimasi Rendemen (Husking Yield)</span>
          <span className={`font-bold ${isYieldLow ? "text-red-400 animate-pulse" : "text-emerald-400"}`}>
            {huskingYield.toFixed(2)}%
          </span>
        </div>
        {isYieldLow && (
          <div className="flex items-center gap-1.5 text-[10px] text-red-400 bg-red-950/10 border border-red-950/20 p-2 rounded-lg">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
            <span>Peringatan: Rendemen giling di bawah batas standar 75%. Sistem akan menerbitkan peringatan sistem.</span>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Catatan Aktivitas</Label>
        <Textarea
          id="notes"
          rows={2}
          className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 rounded-xl text-xs resize-none"
          placeholder="Isi catatan khusus jika ada..."
          {...register("notes")}
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-emerald-650 hover:bg-emerald-600 text-white rounded-xl text-xs py-2 flex items-center justify-center gap-1.5"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Menyimpan Log...
          </>
        ) : (
          <>
            <Save className="w-3.5 h-3.5" />
            Selesaikan Husking
          </>
        )}
      </Button>
    </form>
  );
}
