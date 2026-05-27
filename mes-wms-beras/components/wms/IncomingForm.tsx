"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Scale, Calculator, AlertCircle } from "lucide-react";
import { calculateNetWeight } from "@/lib/utils/net-weight";

interface IncomingFormProps {
  suppliers: any[];
  varieties: any[];
}

const inputCls =
  "w-full px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all";

export default function IncomingForm({ suppliers, varieties }: IncomingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    supplierId: "",
    varietyId: "",
    grossWeight: "",
    sackWeight: "",
    moistureContent: "",
    dirtPercentage: "",
    notes: "",
  });

  const [netWeight, setNetWeight] = useState(0);
  const [dirtWeight, setDirtWeight] = useState(0);

  const set = (k: string, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
  };

  // Recalculate weights live
  useEffect(() => {
    const gw = parseFloat(form.grossWeight) || 0;
    const sw = parseFloat(form.sackWeight) || 0;
    const dp = parseFloat(form.dirtPercentage) || 0;

    const calculatedDirt = (gw * dp) / 100;
    const calculatedNet = gw - sw - calculatedDirt;

    setDirtWeight(Number(calculatedDirt.toFixed(2)));
    setNetWeight(calculatedNet > 0 ? Number(calculatedNet.toFixed(2)) : 0);
  }, [form.grossWeight, form.sackWeight, form.dirtPercentage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplierId || !form.varietyId) {
      toast.error("Please select a supplier and paddy variety");
      return;
    }

    const gw = parseFloat(form.grossWeight);
    const sw = parseFloat(form.sackWeight);
    const mc = parseFloat(form.moistureContent);
    const dp = parseFloat(form.dirtPercentage);

    if (isNaN(gw) || gw <= 0) {
      toast.error("Gross weight must be positive");
      return;
    }
    if (isNaN(sw) || sw < 0) {
      toast.error("Sack weight cannot be negative");
      return;
    }
    if (isNaN(mc) || mc < 0 || mc > 30) {
      toast.error("Moisture content must be between 0% and 30%");
      return;
    }
    if (isNaN(dp) || dp < 0 || dp > 100) {
      toast.error("Dirt percentage must be between 0% and 100%");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/wms/paddy-lots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: form.supplierId,
          varietyId: form.varietyId,
          grossWeight: gw,
          sackWeight: sw,
          moistureContent: mc,
          dirtPercentage: dp,
          notes: form.notes || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Paddy lot reception recorded successfully");
        // Redirect to detail page (which will contain QC form if status is MENUNGGU_QC)
        router.push(`/wms/paddy-warehouse/${json.data.id}`);
      } else {
        toast.error(json.error || "Failed to record paddy lot");
      }
    } catch (e) {
      toast.error("Failed to record paddy lot");
    } finally {
      setLoading(false);
    }
  };

  const selectedSupplierName =
    suppliers.find((s) => s.id === form.supplierId)?.name || "Not Selected";
  const selectedVarietyName =
    varieties.find((v) => v.id === form.varietyId)?.name || "Not Selected";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form Left Side */}
      <form
        onSubmit={handleSubmit}
        className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Supplier</label>
            <select
              value={form.supplierId}
              onChange={(e) => set("supplierId", e.target.value)}
              required
              className={inputCls}
            >
              <option value="">Select Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Paddy Variety</label>
            <select
              value={form.varietyId}
              onChange={(e) => set("varietyId", e.target.value)}
              required
              className={inputCls}
            >
              <option value="">Select Variety</option>
              {varieties.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Gross Weight (kg)</label>
            <input
              type="number"
              step="any"
              value={form.grossWeight}
              onChange={(e) => set("grossWeight", e.target.value)}
              required
              placeholder="e.g. 5000"
              className={inputCls}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Sack Weight Deduction (kg)</label>
            <input
              type="number"
              step="any"
              value={form.sackWeight}
              onChange={(e) => set("sackWeight", e.target.value)}
              required
              placeholder="e.g. 100"
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Moisture Content (%)</label>
            <input
              type="number"
              step="any"
              value={form.moistureContent}
              onChange={(e) => set("moistureContent", e.target.value)}
              required
              placeholder="e.g. 14.5"
              className={inputCls}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Dirt Percentage (%)</label>
            <input
              type="number"
              step="any"
              value={form.dirtPercentage}
              onChange={(e) => set("dirtPercentage", e.target.value)}
              required
              placeholder="e.g. 2.0"
              className={inputCls}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Notes / Remarks</label>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={3}
            placeholder="Add any details about cargo or driver..."
            className={`${inputCls} resize-none`}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-white disabled:opacity-50 transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Record Reception
          </button>
        </div>
      </form>

      {/* Preview Card Right Side */}
      <div className="space-y-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
          {/* Glassmorphic decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl" />

          <div className="space-y-4 relative z-10">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Scale className="w-4 h-4 text-emerald-400" /> Weighing Slip Preview
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Supplier:</span>
                <span className="font-semibold text-slate-200 truncate max-w-[180px]">
                  {selectedSupplierName}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Variety:</span>
                <span className="font-semibold text-slate-200 truncate max-w-[180px]">
                  {selectedVarietyName}
                </span>
              </div>

              <hr className="border-slate-800" />

              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Gross Weight:</span>
                <span className="font-semibold text-slate-200">
                  {parseFloat(form.grossWeight) || 0} kg
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Sack Deduction:</span>
                <span className="font-semibold text-red-400">
                  -{parseFloat(form.sackWeight) || 0} kg
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Dirt Deduction ({form.dirtPercentage || 0}%):</span>
                <span className="font-semibold text-red-400">-{dirtWeight} kg</span>
              </div>

              <hr className="border-slate-800" />

              <div className="bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-lg flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-400">NET WEIGHT:</span>
                </div>
                <span className="text-lg font-bold text-emerald-400">{netWeight} kg</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2 items-start bg-slate-800/30 p-3 border border-slate-700/50 rounded-lg text-xs text-slate-400 relative z-10">
            <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p>
              Weight data is based on gate weighing scale calibration. Status will initially set to{" "}
              <span className="text-yellow-400 font-medium">Waiting QC</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
