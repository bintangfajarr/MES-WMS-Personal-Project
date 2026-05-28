"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sortingLogSchema, SortingLogInput } from "@/lib/validations/production-log";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Save, AlertCircle } from "lucide-react";

interface SortingFormProps {
  workOrderId: string;
  onSuccess: () => void;
}

export default function SortingForm({ workOrderId, onSuccess }: SortingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SortingLogInput>({
    resolver: zodResolver(sortingLogSchema) as any,
    defaultValues: {
      workOrderId,
      startTime: new Date(),
      endTime: new Date(),
    },
  });

  const inputWeight = watch("inputWeight");
  const wholeGrainOutput = watch("wholeGrainOutput") || 0;
  const halfBrokenOutput = watch("halfBrokenOutput") || 0;
  const quarterBrokenOutput = watch("quarterBrokenOutput") || 0;
  const rejectedOutput = watch("rejectedOutput") || 0;

  // Prefill input weight from previous step (Polishing) output if available
  useEffect(() => {
    async function initForm() {
      try {
        const [wRes, lRes] = await Promise.all([
          fetch(`/api/mes/work-orders/${workOrderId}`),
          fetch(`/api/mes/production-logs?workOrderId=${workOrderId}`),
        ]);
        const wJson = await wRes.json();
        const lJson = await lRes.json();

        let prefilledWeight = 0;
        if (lJson.success && lJson.data) {
          const polishingLog = lJson.data.find((log: any) => log.stepType === "PENYOSOHAN");
          if (polishingLog) {
            prefilledWeight = Number(polishingLog.outputWeight);
          }
        }

        if (prefilledWeight === 0 && wJson.success && wJson.data) {
          prefilledWeight = Number(wJson.data.paddyLot?.netWeight || 0);
        }

        setValue("inputWeight", prefilledWeight);
      } catch (err) {
        console.error(err);
        toast.error("Gagal memuat inisialisasi form");
      }
    }
    initForm();
  }, [workOrderId, setValue]);

  const onSubmit = async (data: SortingLogInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/mes/production-logs/sorting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Catatan Sortasi & Grading berhasil disimpan!");
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

  const wholeGrainRatio = inputWeight && wholeGrainOutput ? (wholeGrainOutput / inputWeight) * 100 : 0;
  const totalOutput = Number(wholeGrainOutput) + Number(halfBrokenOutput) + Number(quarterBrokenOutput) + Number(rejectedOutput);
  const isToleranceExceeded = inputWeight ? totalOutput > inputWeight * 1.005 : false;

  const getAutoGrade = () => {
    if (wholeGrainRatio === 0) return "Belum ditentukan";
    if (wholeGrainRatio >= 95) return "PREMIUM (Rasio Kepala >= 95%)";
    return "MEDIUM (Rasio Kepala < 95%)";
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-slate-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input Weight */}
        <div className="space-y-1.5 col-span-2">
          <Label htmlFor="inputWeight">Beras Putih Masuk (kg)</Label>
          <Input
            id="inputWeight"
            type="number"
            step="0.01"
            className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl h-9"
            {...register("inputWeight")}
          />
          {errors.inputWeight && <p className="text-[10px] text-red-500">{errors.inputWeight.message}</p>}
        </div>

        {/* Whole Grain Output */}
        <div className="space-y-1.5">
          <Label htmlFor="wholeGrainOutput">Beras Kepala / Whole Grain (kg)</Label>
          <Input
            id="wholeGrainOutput"
            type="number"
            step="0.01"
            className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl h-9"
            {...register("wholeGrainOutput")}
          />
          {errors.wholeGrainOutput && <p className="text-[10px] text-red-500">{errors.wholeGrainOutput.message}</p>}
        </div>

        {/* Half Broken Output */}
        <div className="space-y-1.5">
          <Label htmlFor="halfBrokenOutput">Beras Patah Setengah / Half (kg)</Label>
          <Input
            id="halfBrokenOutput"
            type="number"
            step="0.01"
            className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl h-9"
            {...register("halfBrokenOutput")}
          />
          {errors.halfBrokenOutput && <p className="text-[10px] text-red-500">{errors.halfBrokenOutput.message}</p>}
        </div>

        {/* Quarter Broken Output */}
        <div className="space-y-1.5">
          <Label htmlFor="quarterBrokenOutput">Beras Menir / Quarter (kg)</Label>
          <Input
            id="quarterBrokenOutput"
            type="number"
            step="0.01"
            className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl h-9"
            {...register("quarterBrokenOutput")}
          />
          {errors.quarterBrokenOutput && <p className="text-[10px] text-red-500">{errors.quarterBrokenOutput.message}</p>}
        </div>

        {/* Rejected Output */}
        <div className="space-y-1.5">
          <Label htmlFor="rejectedOutput">Kotoran / Rejected (kg)</Label>
          <Input
            id="rejectedOutput"
            type="number"
            step="0.01"
            className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl h-9"
            {...register("rejectedOutput")}
          />
          {errors.rejectedOutput && <p className="text-[10px] text-red-500">{errors.rejectedOutput.message}</p>}
        </div>
      </div>

      {/* Yield & Grading Preview */}
      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Rasio Beras Kepala (Whole Grain Ratio)</span>
          <span className="font-bold text-emerald-400">{wholeGrainRatio.toFixed(2)}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Keputusan Grade Otomatis</span>
          <span className="font-bold text-blue-400">{getAutoGrade()}</span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-850 pt-2">
          <span className="text-slate-500">Total Output vs Input</span>
          <span className={`font-semibold ${isToleranceExceeded ? "text-red-400" : "text-slate-300"}`}>
            {totalOutput.toLocaleString()} kg / {Number(inputWeight || 0).toLocaleString()} kg
          </span>
        </div>
        {isToleranceExceeded && (
          <div className="flex items-center gap-1.5 text-[10px] text-red-400 bg-red-950/10 border border-red-950/20 p-2 rounded-lg mt-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
            <span>Peringatan: Total output melebihi batas toleransi input 0.5%. Harap periksa kembali angka berat giling!</span>
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
        disabled={isSubmitting || isToleranceExceeded}
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
            Selesaikan Sortasi & Grading
          </>
        )}
      </Button>
    </form>
  );
}
