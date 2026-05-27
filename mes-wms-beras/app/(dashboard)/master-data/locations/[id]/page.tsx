"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
const inputCls = "w-full px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30";

export default function EditLocationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter(); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", type: "RAW_MATERIAL", capacitySak: 0 });
  const set = (k: string, v: any) => setForm(p => ({...p, [k]: v}));
  useEffect(() => { fetch(`/api/master-data/locations/${id}`).then(r=>r.json()).then(j => { if(j.success) { const d=j.data; setForm({ name:d.name, type:d.type, capacitySak:d.capacitySak }); } }).finally(()=>setLoading(false)); }, [id]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { const r = await fetch(`/api/master-data/locations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); const j = await r.json(); if(j.success) { toast.success("Updated"); router.push("/master-data/locations"); } else toast.error(j.error); } catch { toast.error("Failed"); } finally { setSaving(false); }
  };
  if(loading) return <LoadingSkeleton variant="form" />;
  return (
    <div><PageHeader title="Edit Location" description="Update location information" />
      <form onSubmit={handleSubmit} className="max-w-lg bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Name</label><input value={form.name} onChange={e=>set("name",e.target.value)} required className={inputCls} /></div>
        <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Type</label><select value={form.type} onChange={e=>set("type",e.target.value)} className={inputCls}><option value="RAW_MATERIAL">Raw Material</option><option value="FINISHED_GOODS">Finished Goods</option><option value="QUARANTINE">Quarantine</option><option value="BY_PRODUCT">By-Product</option></select></div>
        <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Capacity (sak)</label><input type="number" value={form.capacitySak} onChange={e=>set("capacitySak",Number(e.target.value))} className={inputCls} /></div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={()=>router.back()} className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-white disabled:opacity-50 transition-colors">{saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes</button>
        </div>
      </form></div>
  );
}
