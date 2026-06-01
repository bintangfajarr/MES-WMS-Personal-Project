"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Thermometer,
  Droplets,
  Loader2,
  Send,
  ListChecks,
  Weight,
  Clock,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";

const inputCls =
  "w-full px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder:text-slate-500";
const labelCls = "text-xs font-semibold text-slate-400 uppercase tracking-wider";

export default function DryingPage() {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    workOrderId: "",
    machineId: "",
    inputWeight: "",
    tempCelsius: "",
    moistureIn: "",
    moistureOut: "",
    weightAfterDrying: "",
    startTime: "",
    endTime: "",
    notes: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [woRes, machRes] = await Promise.all([
          fetch("/api/mes/work-orders?status=IN_PROGRESS,DRAFT"),
          fetch("/api/master-data/machines?type=DRYER"),
        ]);
        const woData = await woRes.json();
        const machData = await machRes.json();
        if (woData.success) setWorkOrders(woData.data || []);
        if (machData.success) setMachines(machData.data || []);
      } catch {
        toast.error("Gagal memuat data referensi");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        workOrderId: form.workOrderId,
        machineId: form.machineId,
        inputWeight: parseFloat(form.inputWeight),
        tempCelsius: parseFloat(form.tempCelsius),
        moistureIn: parseFloat(form.moistureIn),
        moistureOut: parseFloat(form.moistureOut),
        weightAfterDrying: parseFloat(form.weightAfterDrying),
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        notes: form.notes || undefined,
      };

      const res = await fetch("/api/mes/production-logs/drying", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Log pengeringan berhasil disimpan!");
        setForm({
          workOrderId: "",
          machineId: "",
          inputWeight: "",
          tempCelsius: "",
          moistureIn: "",
          moistureOut: "",
          weightAfterDrying: "",
          startTime: "",
          endTime: "",
          notes: "",
        });
      } else {
        toast.error(data.error || "Gagal menyimpan log pengeringan");
      }
    } catch {
      toast.error("Gagal terhubung ke server");
    } finally {
      setSubmitting(false);
    }
  };

  // Calculated preview
  const inputW = parseFloat(form.inputWeight) || 0;
  const afterW = parseFloat(form.weightAfterDrying) || 0;
  const dryingLoss = inputW > 0 && afterW > 0 ? inputW - afterW : 0;
  const dryingYield = inputW > 0 && afterW > 0 ? ((afterW / inputW) * 100).toFixed(2) : "—";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-sm text-slate-400 mt-3">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Log Pengeringan (Drying)"
        description="Catat proses pengeringan padi untuk menurunkan kadar air ke ≤14%."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Work Order & Machine */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <ListChecks className="w-4 h-4 text-emerald-400" /> Referensi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>Work Order *</label>
              <select name="workOrderId" value={form.workOrderId} onChange={handleChange} required className={inputCls}>
                <option value="">Pilih Work Order</option>
                {workOrders.map((wo) => (
                  <option key={wo.id} value={wo.id}>
                    {wo.woNumber} — {wo.paddyLot?.lotNumber || "N/A"}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Mesin Dryer *</label>
              <select name="machineId" value={form.machineId} onChange={handleChange} required className={inputCls}>
                <option value="">Pilih Mesin</option>
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code} — {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Weight & Moisture */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Weight className="w-4 h-4 text-emerald-400" /> Berat & Kadar Air
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>Berat Input (kg) *</label>
              <input type="number" name="inputWeight" value={form.inputWeight} onChange={handleChange} required step="0.01" min="0" placeholder="Contoh: 5000" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Berat Setelah Pengeringan (kg) *</label>
              <input type="number" name="weightAfterDrying" value={form.weightAfterDrying} onChange={handleChange} required step="0.01" min="0" placeholder="Contoh: 4500" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Suhu (°C) *</label>
              <div className="relative">
                <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="number" name="tempCelsius" value={form.tempCelsius} onChange={handleChange} required step="0.1" min="0" placeholder="Contoh: 45" className={`${inputCls} pl-9`} />
              </div>
            </div>
            <div className="space-y-1.5" />
            <div className="space-y-1.5">
              <label className={labelCls}>Kadar Air Masuk (%) *</label>
              <div className="relative">
                <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                <input type="number" name="moistureIn" value={form.moistureIn} onChange={handleChange} required step="0.1" min="0" max="100" placeholder="Contoh: 18" className={`${inputCls} pl-9`} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Kadar Air Keluar (%) *</label>
              <div className="relative">
                <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                <input type="number" name="moistureOut" value={form.moistureOut} onChange={handleChange} required step="0.1" min="0" max="100" placeholder="Target: ≤14" className={`${inputCls} pl-9`} />
              </div>
            </div>
          </div>
        </div>

        {/* Time */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Clock className="w-4 h-4 text-emerald-400" /> Waktu Proses
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>Waktu Mulai *</label>
              <input type="datetime-local" name="startTime" value={form.startTime} onChange={handleChange} required className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Waktu Selesai *</label>
              <input type="datetime-local" name="endTime" value={form.endTime} onChange={handleChange} required className={inputCls} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Catatan</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} placeholder="Catatan tambahan..." className={`${inputCls} resize-none`} />
          </div>
        </div>

        {/* Preview */}
        {inputW > 0 && afterW > 0 && (
          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Susut (Loss)</p>
              <p className="text-lg font-bold text-orange-400">{dryingLoss.toLocaleString("id-ID")} kg</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Yield Pengeringan</p>
              <p className="text-lg font-bold text-emerald-400">{dryingYield}%</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Status Kadar Air</p>
              <p className={`text-lg font-bold ${parseFloat(form.moistureOut) <= 14 ? "text-emerald-400" : "text-orange-400"}`}>
                {form.moistureOut ? (parseFloat(form.moistureOut) <= 14 ? "✓ Lulus" : "✗ Masih Tinggi") : "—"}
              </p>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-white disabled:opacity-50 transition-colors shadow-lg shadow-emerald-500/20"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Simpan Log Pengeringan
          </button>
        </div>
      </form>
    </div>
  );
}
