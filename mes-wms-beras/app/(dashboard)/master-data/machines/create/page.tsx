"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
const inputCls = "w-full px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30";

export default function CreateMachinePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", type: "DRYER", capacityKgPerBatch: "", capacityKgPerHour: "" });
  const set = (k: string, v: any) => setForm(p => ({...p, [k]: v}));
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const body = { ...form, capacityKgPerBatch: form.capacityKgPerBatch ? Number(form.capacityKgPerBatch) : null, capacityKgPerHour: form.capacityKgPerHour ? Number(form.capacityKgPerHour) : null };
    try { const r = await fetch("/api/master-data/machines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const j = await r.json(); if (j.success) { toast.success("Machine created"); router.push("/master-data/machines"); } else toast.error(j.error); } catch { toast.error("Failed"); } finally { setLoading(false); }
  };
  return (
    <div><PageHeader title="Add Machine" description="Register a new factory machine" />
      <form onSubmit={handleSubmit} className="max-w-lg bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Code</label><input value={form.code} onChange={e=>set("code",e.target.value)} required className={inputCls} placeholder="DRYER-01" /></div>
          <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Name</label><input value={form.name} onChange={e=>set("name",e.target.value)} required className={inputCls} /></div>
        </div>
        <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Type</label><select value={form.type} onChange={e=>set("type",e.target.value)} className={inputCls}><option value="DRYER">Dryer</option><option value="HUSKER">Husker</option><option value="POLISHER">Polisher</option><option value="COLOR_SORTER">Color Sorter</option><option value="CLASSIFIER">Classifier</option><option value="PACKER">Packer</option></select></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Capacity (kg/batch)</label><input type="number" value={form.capacityKgPerBatch} onChange={e=>set("capacityKgPerBatch",e.target.value)} className={inputCls} /></div>
          <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Capacity (kg/hr)</label><input type="number" value={form.capacityKgPerHour} onChange={e=>set("capacityKgPerHour",e.target.value)} className={inputCls} /></div>
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={()=>router.back()} className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
          <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-white disabled:opacity-50 transition-colors">{loading && <Loader2 className="w-4 h-4 animate-spin" />} Create Machine</button>
        </div>
      </form></div>
  );
}
