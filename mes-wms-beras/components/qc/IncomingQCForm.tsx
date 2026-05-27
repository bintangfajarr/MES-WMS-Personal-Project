"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ShieldCheck, ShieldAlert, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface IncomingQCFormProps {
  lot: any;
  onSuccess?: () => void;
}

const inputCls =
  "w-full px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all";

export default function IncomingQCForm({ lot, onSuccess }: IncomingQCFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    moistureContent: String(lot.moistureContent || ""),
    dirtPercentage: String(lot.dirtPercentage || ""),
    colorAroma: "NORMAL",
    result: "LULUS" as "LULUS" | "GAGAL",
    rejectionReason: "",
    notes: "",
  });

  const set = (k: string, v: any) => {
    setForm((p) => ({ ...p, [k]: v }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const mc = parseFloat(form.moistureContent);
    const dp = parseFloat(form.dirtPercentage);

    if (isNaN(mc) || mc < 0 || mc > 30) {
      toast.error("Moisture content must be between 0% and 30%");
      return;
    }
    if (isNaN(dp) || dp < 0 || dp > 100) {
      toast.error("Dirt percentage must be between 0% and 100%");
      return;
    }

    if (form.result === "GAGAL" && !form.rejectionReason.trim()) {
      toast.error("Please specify a rejection reason");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/wms/paddy-lots/${lot.id}/qc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moistureContent: mc,
          dirtPercentage: dp,
          colorAroma: form.colorAroma,
          result: form.result,
          rejectionReason: form.result === "GAGAL" ? form.rejectionReason : null,
          notes: form.notes || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Incoming QC complete. Status: ${form.result === "LULUS" ? "Passed" : "Rejected"}`);
        if (onSuccess) onSuccess();
        router.refresh();
      } else {
        toast.error(json.error || "Failed to submit QC");
      }
    } catch {
      toast.error("Failed to submit QC");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-5"
    >
      <div className="border-b border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-slate-200">Incoming QC Inspection</h3>
        <p className="text-xs text-slate-400">
          Verify moisture and dirt parameters for lot: <span className="text-emerald-400 font-semibold">{lot.lotNumber}</span>
        </p>
      </div>

      {/* QC Result Decision Switcher */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => set("result", "LULUS")}
          className={cn(
            "p-4 rounded-xl border flex flex-col items-center gap-2 text-center transition-all",
            form.result === "LULUS"
              ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/5"
              : "bg-slate-800/20 border-slate-800 text-slate-400 hover:border-slate-700"
          )}
        >
          <ShieldCheck className="w-6 h-6" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">Pass Lot</div>
            <div className="text-[10px] text-slate-500">Lot goes to milling queue</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => set("result", "GAGAL")}
          className={cn(
            "p-4 rounded-xl border flex flex-col items-center gap-2 text-center transition-all",
            form.result === "GAGAL"
              ? "bg-red-500/10 border-red-500 text-red-400 shadow-lg shadow-red-500/5"
              : "bg-slate-800/20 border-slate-800 text-slate-400 hover:border-slate-700"
          )}
        >
          <ShieldAlert className="w-6 h-6" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">Reject Lot</div>
            <div className="text-[10px] text-slate-500">Lot is returned / denied entry</div>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Verified Moisture Content (%)</label>
          <input
            type="number"
            step="any"
            value={form.moistureContent}
            onChange={(e) => set("moistureContent", e.target.value)}
            required
            className={inputCls}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Verified Dirt Percentage (%)</label>
          <input
            type="number"
            step="any"
            value={form.dirtPercentage}
            onChange={(e) => set("dirtPercentage", e.target.value)}
            required
            className={inputCls}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400">Color and Aroma quality</label>
        <select
          value={form.colorAroma}
          onChange={(e) => set("colorAroma", e.target.value)}
          className={inputCls}
        >
          <option value="NORMAL">Normal (Fresh, pale yellow/straw color)</option>
          <option value="ABNORMAL">Abnormal (Moldy, damp, or blackened grain)</option>
        </select>
      </div>

      {form.result === "GAGAL" && (
        <div className="space-y-1.5 animate-fadeIn">
          <label className="text-xs font-medium text-red-400">Rejection Reason</label>
          <input
            type="text"
            value={form.rejectionReason}
            onChange={(e) => set("rejectionReason", e.target.value)}
            required
            placeholder="e.g. Moisture exceeds 25%, grain is moldy"
            className="w-full px-3 py-2.5 rounded-lg bg-red-950/10 border border-red-500/50 text-red-200 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/30 transition-all"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400">Notes / Remarks</label>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          placeholder="Inspection logs, grain classification details..."
          className={`${inputCls} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={cn(
          "w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50",
          form.result === "LULUS"
            ? "bg-emerald-500 hover:bg-emerald-400"
            : "bg-red-500 hover:bg-red-400"
        )}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : form.result === "LULUS" ? (
          <CheckCircle className="w-4 h-4" />
        ) : (
          <AlertTriangle className="w-4 h-4" />
        )}
        Submit Quality Inspection
      </button>
    </form>
  );
}
