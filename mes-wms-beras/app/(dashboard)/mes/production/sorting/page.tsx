"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Send, ListChecks, Clock, Filter } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";

const inputCls =
  "w-full px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder:text-slate-500";
const labelCls = "text-xs font-semibold text-slate-400 uppercase tracking-wider";

export default function SortingPage() {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    workOrderId: "",
    inputWeight: "",
    wholeGrainOutput: "",
    halfBrokenOutput: "",
    quarterBrokenOutput: "",
    rejectedOutput: "",
    startTime: "",
    endTime: "",
    notes: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const woRes = await fetch("/api/mes/work-orders?status=IN_PROGRESS");
        const woData = await woRes.json();
        if (woData.success) setWorkOrders(woData.data || []);
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
        inputWeight: parseFloat(form.inputWeight),
        wholeGrainOutput: parseFloat(form.wholeGrainOutput),
        halfBrokenOutput: parseFloat(form.halfBrokenOutput),
        quarterBrokenOutput: parseFloat(form.quarterBrokenOutput),
        rejectedOutput: parseFloat(form.rejectedOutput),
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        notes: form.notes || undefined,
      };

      const res = await fetch("/api/mes/production-logs/sorting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Log sortasi & grading berhasil disimpan!");
        setForm({ workOrderId: "", inputWeight: "", wholeGrainOutput: "", halfBrokenOutput: "", quarterBrokenOutput: "", rejectedOutput: "", startTime: "", endTime: "", notes: "" });
      } else {
        toast.error(data.error || "Gagal menyimpan log sortasi");
      }
    } catch {
      toast.error("Gagal terhubung ke server");
    } finally {
      setSubmitting(false);
    }
  };

  const inputW = parseFloat(form.inputWeight) || 0;
  const wholeW = parseFloat(form.wholeGrainOutput) || 0;
  const halfW = parseFloat(form.halfBrokenOutput) || 0;
  const quarterW = parseFloat(form.quarterBrokenOutput) || 0;
  const rejectedW = parseFloat(form.rejectedOutput) || 0;
  const totalOutput = wholeW + halfW + quarterW + rejectedW;
  const wholeGrainRatio = inputW > 0 && wholeW > 0 ? ((wholeW / inputW) * 100).toFixed(2) : "—";
  const sortingYield = inputW > 0 && totalOutput > 0 ? ((totalOutput / inputW) * 100).toFixed(2) : "—";

  // Auto grade determination
  let gradeLabel = "—";
  if (wholeGrainRatio !== "—") {
    const ratio = parseFloat(wholeGrainRatio);
    if (ratio >= 95) gradeLabel = "PREMIUM";
    else if (ratio >= 80) gradeLabel = "MEDIUM";
    else gradeLabel = "PATAH";
  }

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
        title="Log Sortasi & Grading"
        description="Catat hasil sortasi beras berdasarkan ukuran butir: utuh, setengah patah, seperempat patah, dan tolak. Syarat: Step Penyosohan sudah selesai."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Reference */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <ListChecks className="w-4 h-4 text-emerald-400" /> Referensi
          </h3>
          <div className="space-y-1.5">
            <label className={labelCls}>Work Order *</label>
            <select name="workOrderId" value={form.workOrderId} onChange={handleChange} required className={inputCls}>
              <option value="">Pilih Work Order</option>
              {workOrders.map((wo) => (
                <option key={wo.id} value={wo.id}>{wo.woNumber} — {wo.paddyLot?.lotNumber || "N/A"}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Output */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Filter className="w-4 h-4 text-emerald-400" /> Hasil Sortasi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className={labelCls}>Berat Input (kg) *</label>
              <input type="number" name="inputWeight" value={form.inputWeight} onChange={handleChange} required step="0.01" min="0" placeholder="Berat beras putih masuk" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Butir Utuh / Whole Grain (kg) *</label>
              <input type="number" name="wholeGrainOutput" value={form.wholeGrainOutput} onChange={handleChange} required step="0.01" min="0" placeholder="0" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Setengah Patah / Half Broken (kg) *</label>
              <input type="number" name="halfBrokenOutput" value={form.halfBrokenOutput} onChange={handleChange} required step="0.01" min="0" placeholder="0" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Seperempat Patah / Quarter Broken (kg) *</label>
              <input type="number" name="quarterBrokenOutput" value={form.quarterBrokenOutput} onChange={handleChange} required step="0.01" min="0" placeholder="0" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Tolak / Rejected (kg) *</label>
              <input type="number" name="rejectedOutput" value={form.rejectedOutput} onChange={handleChange} required step="0.01" min="0" placeholder="0" className={inputCls} />
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
        {inputW > 0 && totalOutput > 0 && (
          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Whole Grain Ratio</p>
                <p className={`text-lg font-bold ${parseFloat(wholeGrainRatio) >= 95 ? "text-emerald-400" : parseFloat(wholeGrainRatio) >= 80 ? "text-amber-400" : "text-red-400"}`}>{wholeGrainRatio}%</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Sorting Yield</p>
                <p className="text-lg font-bold text-emerald-400">{sortingYield}%</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Total Output</p>
                <p className="text-lg font-bold text-white">{totalOutput.toLocaleString("id-ID")} kg</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Auto Grade</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${gradeLabel === "PREMIUM" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : gradeLabel === "MEDIUM" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                  {gradeLabel}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-white disabled:opacity-50 transition-colors shadow-lg shadow-emerald-500/20">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Simpan Log Sortasi
          </button>
        </div>
      </form>
    </div>
  );
}
