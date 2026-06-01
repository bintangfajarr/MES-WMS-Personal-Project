"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Send, ListChecks, Weight, Clock, Sparkles } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";

const inputCls =
  "w-full px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder:text-slate-500";
const labelCls = "text-xs font-semibold text-slate-400 uppercase tracking-wider";

export default function PolishingPage() {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    workOrderId: "",
    machineId: "",
    inputWeight: "",
    soshLevel: "1",
    whiteRiceOutput: "",
    branOutput: "",
    startTime: "",
    endTime: "",
    notes: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [woRes, machRes] = await Promise.all([
          fetch("/api/mes/work-orders?status=IN_PROGRESS"),
          fetch("/api/master-data/machines?type=POLISHER"),
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
        soshLevel: parseInt(form.soshLevel),
        whiteRiceOutput: parseFloat(form.whiteRiceOutput),
        branOutput: parseFloat(form.branOutput),
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        notes: form.notes || undefined,
      };

      const res = await fetch("/api/mes/production-logs/polishing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Log penyosohan berhasil disimpan!");
        setForm({ workOrderId: "", machineId: "", inputWeight: "", soshLevel: "1", whiteRiceOutput: "", branOutput: "", startTime: "", endTime: "", notes: "" });
      } else {
        toast.error(data.error || "Gagal menyimpan log penyosohan");
      }
    } catch {
      toast.error("Gagal terhubung ke server");
    } finally {
      setSubmitting(false);
    }
  };

  const inputW = parseFloat(form.inputWeight) || 0;
  const whiteW = parseFloat(form.whiteRiceOutput) || 0;
  const branW = parseFloat(form.branOutput) || 0;
  const polishingYield = inputW > 0 && whiteW > 0 ? ((whiteW / inputW) * 100).toFixed(2) : "—";

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
        title="Log Penyosohan (Polishing)"
        description="Catat proses penyosohan beras pecah kulit menjadi beras putih. Syarat: Step Penggilingan sudah selesai."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Reference */}
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
                  <option key={wo.id} value={wo.id}>{wo.woNumber} — {wo.paddyLot?.lotNumber || "N/A"}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Mesin Polisher *</label>
              <select name="machineId" value={form.machineId} onChange={handleChange} required className={inputCls}>
                <option value="">Pilih Mesin</option>
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>{m.code} — {m.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Weight & Level */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-4 h-4 text-emerald-400" /> Hasil Penyosohan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>Berat Input (kg) *</label>
              <input type="number" name="inputWeight" value={form.inputWeight} onChange={handleChange} required step="0.01" min="0" placeholder="Brown rice input" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Level Sosoh (1-3) *</label>
              <select name="soshLevel" value={form.soshLevel} onChange={handleChange} required className={inputCls}>
                <option value="1">Level 1 — Ringan</option>
                <option value="2">Level 2 — Sedang</option>
                <option value="3">Level 3 — Berat (Premium)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Output Beras Putih (kg) *</label>
              <input type="number" name="whiteRiceOutput" value={form.whiteRiceOutput} onChange={handleChange} required step="0.01" min="0" placeholder="White rice output" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Output Bekatul (kg) *</label>
              <input type="number" name="branOutput" value={form.branOutput} onChange={handleChange} required step="0.01" min="0" placeholder="Bran output" className={inputCls} />
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
        {inputW > 0 && whiteW > 0 && (
          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Polishing Yield</p>
              <p className="text-lg font-bold text-emerald-400">{polishingYield}%</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Beras Putih</p>
              <p className="text-lg font-bold text-white">{whiteW.toLocaleString("id-ID")} kg</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Bekatul</p>
              <p className="text-lg font-bold text-amber-400">{branW.toLocaleString("id-ID")} kg</p>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-white disabled:opacity-50 transition-colors shadow-lg shadow-emerald-500/20">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Simpan Log Penyosohan
          </button>
        </div>
      </form>
    </div>
  );
}
