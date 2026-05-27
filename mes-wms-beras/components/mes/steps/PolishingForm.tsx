"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { polishingLogSchema, PolishingLogInput } from "@/lib/validations/production-log";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface PolishingFormProps {
  workOrderId: string;
  onSuccess: () => void;
}

interface Machine {
  id: string;
  name: string;
  code: string;
}

export default function PolishingForm({ workOrderId, onSuccess }: PolishingFormProps) {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isLoadingMachines, setIsLoadingMachines] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PolishingLogInput>({
    resolver: zodResolver(polishingLogSchema),
    defaultValues: {
      workOrderId,
      soshLevel: "SEDANG",
      startTime: new Date(),
      endTime: new Date(),
    },
  });

  const inputWeight = watch("inputWeight");
  const whiteRiceOutput = watch("whiteRiceOutput");

  // Fetch Polisher machines and previous step (Husking) output if available
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
          const polishers = mJson.data.filter((m: any) => m.type === "POLISHER");
          setMachines(polishers);
        }

        let prefilledWeight = 0;
        if (lJson.success && lJson.data) {
          const huskingLog = lJson.data.find((log: any) => log.stepType === "PENGGILINGAN");
          if (huskingLog) {
            prefilledWeight = Number(huskingLog.outputWeight);
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

  const onSubmit = async (data: PolishingLogInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/mes/production-logs/polishing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Catatan Penyosohan berhasil disimpan!");
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

  const polishingYield = inputWeight && whiteRiceOutput ? (whiteRiceOutput / inputWeight) * 100 : 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-slate-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Machine */}
        <div className="space-y-1.5">
          <Label htmlFor="machineId">Pilih Mesin Polisher</Label>
          {isLoadingMachines ? (
            <div className="text-xs text-slate-500">Memuat mesin...</div>
          ) : (
            <select
              id="machineId"
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 transition-colors"
              {...register("machineId")}
            >
              <option value="">-- Pilih Polisher --</option>
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
          <Label htmlFor="inputWeight">Pecah Kulit Masuk (kg)</Label>
          <Input
            id="inputWeight"
            type="number"
            step="0.01"
            className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl h-9"
            {...register("inputWeight")}
          />
          {errors.inputWeight && <p className="text-[10px] text-red-500">{errors.inputWeight.message}</p>}
        </div>

        {/* Sosh Level */}
        <div className="space-y-1.5">
          <Label htmlFor="soshLevel">Tingkat Sosoh (Polishing Degree)</Label>
          <select
            id="soshLevel"
            className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 transition-colors"
            {...register("soshLevel")}
          >
            <option value="TINGGI">Tinggi (Sangat Putih / Premium)</option>
            <option value="SEDANG">Sedang (Standar / Medium)</option>
          </select>
          {errors.soshLevel && <p className="text-[10px] text-red-500">{errors.soshLevel.message}</p>}
        </div>

        {/* White Rice Output */}
        <div className="space-y-1.5">
          <Label htmlFor="whiteRiceOutput">Beras Sosoh Putih (kg)</Label>
          <Input
            id="whiteRiceOutput"
            type="number"
            step="0.01"
            className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl h-9"
            {...register("whiteRiceOutput")}
          />
          {errors.whiteRiceOutput && <p className="text-[10px] text-red-500">{errors.whiteRiceOutput.message}</p>}
        </div>

        {/* Bran Output */}
        <div className="space-y-1.5">
          <Label htmlFor="branOutput">Bekatul / Bran Output (kg)</Label>
          <Input
            id="branOutput"
            type="number"
            step="0.01"
            className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl h-9"
            {...register("branOutput")}
          />
          {errors.branOutput && <p className="text-[10px] text-red-500">{errors.branOutput.message}</p>}
        </div>
      </div>

      {/* Yield Real-time Preview */}
      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 text-xs flex items-center justify-between">
        <span className="text-slate-500">Rendemen Penyosohan (Polishing Yield)</span>
        <span className="font-bold text-emerald-400">
          {polishingYield.toFixed(2)}%
        </span>
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
            Selesaikan Penyosohan
          </>
        )}
      </Button>
    </form>
  );
}
