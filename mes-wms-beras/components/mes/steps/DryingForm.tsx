"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { dryingLogSchema, DryingLogInput } from "@/lib/validations/production-log";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface DryingFormProps {
  workOrderId: string;
  onSuccess: () => void;
}

interface Machine {
  id: string;
  name: string;
  code: string;
}

export default function DryingForm({ workOrderId, onSuccess }: DryingFormProps) {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isLoadingMachines, setIsLoadingMachines] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DryingLogInput>({
    resolver: zodResolver(dryingLogSchema),
    defaultValues: {
      workOrderId,
      startTime: new Date(),
      endTime: new Date(),
    },
  });

  const inputWeight = watch("inputWeight");
  const weightAfterDrying = watch("weightAfterDrying");
  const moistureOut = watch("moistureOut");

  // Fetch Dryer machines and WO info
  useEffect(() => {
    async function initForm() {
      try {
        const [mRes, wRes] = await Promise.all([
          fetch("/api/master-data/machines"),
          fetch(`/api/mes/work-orders/${workOrderId}`),
        ]);
        const mJson = await mRes.json();
        const wJson = await wRes.json();

        if (mJson.success) {
          // Filter only DRYER machines
          const dryers = mJson.data.filter((m: any) => m.type === "DRYER");
          setMachines(dryers);
        }
        if (wJson.success && wJson.data) {
          const wo = wJson.data;
          setValue("inputWeight", Number(wo.paddyLot?.netWeight || 0));
          setValue("moistureIn", Number(wo.paddyLot?.moistureContent || 0));
        }
      } catch (err) {
        console.error(err);
        toast.error("Gagal memuat inisialisasi form");
      } finally {
        setIsLoadingMachines(false);
      }
    }
    initForm();
  }, [workOrderId, setValue]);

  const onSubmit = async (data: DryingLogInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/mes/production-logs/drying", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Catatan Pengeringan berhasil disimpan!");
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

  const dryingLoss = inputWeight && weightAfterDrying ? inputWeight - weightAfterDrying : 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-slate-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Machine */}
        <div className="space-y-1.5">
          <Label htmlFor="machineId">Pilih Mesin Dryer</Label>
          {isLoadingMachines ? (
            <div className="text-xs text-slate-500">Memuat mesin...</div>
          ) : (
            <select
              id="machineId"
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 transition-colors"
              {...register("machineId")}
            >
              <option value="">-- Pilih Dryer --</option>
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
          <Label htmlFor="inputWeight">Berat Masuk (kg)</Label>
          <Input
            id="inputWeight"
            type="number"
            step="0.01"
            className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl h-9"
            {...register("inputWeight")}
          />
          {errors.inputWeight && <p className="text-[10px] text-red-500">{errors.inputWeight.message}</p>}
        </div>

        {/* Temp */}
        <div className="space-y-1.5">
          <Label htmlFor="tempCelsius">Temperatur (°C)</Label>
          <Input
            id="tempCelsius"
            type="number"
            step="0.1"
            placeholder="e.g. 45"
            className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl h-9"
            {...register("tempCelsius")}
          />
          {errors.tempCelsius && <p className="text-[10px] text-red-500">{errors.tempCelsius.message}</p>}
        </div>

        {/* Moisture In */}
        <div className="space-y-1.5">
          <Label htmlFor="moistureIn">Kadar Air Masuk (%)</Label>
          <Input
            id="moistureIn"
            type="number"
            step="0.1"
            className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl h-9"
            {...register("moistureIn")}
          />
          {errors.moistureIn && <p className="text-[10px] text-red-500">{errors.moistureIn.message}</p>}
        </div>

        {/* Moisture Out */}
        <div className="space-y-1.5">
          <Label htmlFor="moistureOut">Kadar Air Keluar (%)</Label>
          <Input
            id="moistureOut"
            type="number"
            step="0.1"
            placeholder="Target <= 14%"
            className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl h-9"
            {...register("moistureOut")}
          />
          {errors.moistureOut && <p className="text-[10px] text-red-500">{errors.moistureOut.message}</p>}
        </div>

        {/* Weight After */}
        <div className="space-y-1.5">
          <Label htmlFor="weightAfterDrying">Berat Kering (kg)</Label>
          <Input
            id="weightAfterDrying"
            type="number"
            step="0.01"
            className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl h-9"
            {...register("weightAfterDrying")}
          />
          {errors.weightAfterDrying && <p className="text-[10px] text-red-500">{errors.weightAfterDrying.message}</p>}
        </div>
      </div>

      {/* Calculations Info */}
      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 text-xs grid grid-cols-2 gap-4">
        <div>
          <span className="text-slate-500 block">Penyusutan (Loss)</span>
          <span className="font-semibold text-slate-300">{dryingLoss.toLocaleString()} kg</span>
        </div>
        <div>
          <span className="text-slate-500 block">Status Target</span>
          {moistureOut ? (
            Number(moistureOut) <= 14 ? (
              <span className="font-semibold text-emerald-400">Selesai (Kadar Air &le; 14%)</span>
            ) : (
              <span className="font-semibold text-yellow-400">Butuh Siklus Pengeringan Lagi (&gt; 14%)</span>
            )
          ) : (
            <span className="text-slate-650 italic">Masukkan kadar air keluar</span>
          )}
        </div>
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
            Simpan Catatan Pengeringan
          </>
        )}
      </Button>
    </form>
  );
}
