"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
const inputCls = "w-full px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30";

export default function EditPackagingMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter(); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", unit: "", currentStock: 0, minimumStock: 0 });
  const set = (k: string, v: any) => setForm(p => ({...p, [k]: v}));
  useEffect(() => { fetch(`/api/master-data/packaging-materials/${id}`).then(r=>r.json()).then(j => { if(j.success) { const d=j.data; setForm({ name:d.name, unit:d.unit, currentStock:d.currentStock, minimumStock:d.minimumStock }); } }).finally(()=>setLoading(false)); }, [id]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { const r = await fetch(`/api/master-data/packaging-materials/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); const j = await r.json(); if(j.success) { toast.success("Updated"); router.push("/master-data/packaging-materials"); } else toast.error(j.error); } catch { toast.error("Failed"); } finally { setSaving(false); }
  };
  if(loading) return <LoadingSkeleton variant="form" />;
  return (
    <div><PageHeader title="Edit Packaging Material" description="Update material information" />
      <form onSubmit={handleSubmit} className="max-w-lg bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Name</label><input value={form.name} onChange={e=>set("name",e.target.value)} required className={inputCls} /></div>
        <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Unit</label><input value={form.unit} onChange={e=>set("unit",e.target.value)} required className={inputCls} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Current Stock</label><input type="number" value={form.currentStock} onChange={e=>set("currentStock",Number(e.target.value))} className={inputCls} /></div>
          <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Minimum Stock</label><input type="number" value={form.minimumStock} onChange={e=>set("minimumStock",Number(e.target.value))} className={inputCls} /></div>
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={()=>router.back()} className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-white disabled:opacity-50 transition-colors">{saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes</button>
        </div>
      </form></div>
  );
}
