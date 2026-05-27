"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
const inputCls = "w-full px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", type: "PREMIUM", pricePerKg: 0, minimumStock: 0, isActive: true });
  const [variants, setVariants] = useState<{size: number; unit: string}[]>([]);
  const set = (k: string, v: any) => setForm(p => ({...p, [k]: v}));
  useEffect(() => { fetch(`/api/master-data/products/${id}`).then(r=>r.json()).then(j => { if (j.success) { const d = j.data; setForm({ name: d.name, description: d.description||"", type: d.type, pricePerKg: Number(d.pricePerKg), minimumStock: d.minimumStock, isActive: d.isActive }); setVariants(d.packagingVariants || []); } }).finally(()=>setLoading(false)); }, [id]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { const r = await fetch(`/api/master-data/products/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({...form, packagingVariants: variants}) }); const j = await r.json(); if (j.success) { toast.success("Updated"); router.push("/master-data/products"); } else toast.error(j.error); } catch { toast.error("Failed"); } finally { setSaving(false); }
  };
  if (loading) return <LoadingSkeleton variant="form" />;
  return (
    <div><PageHeader title="Edit Product" description="Update product information" />
      <form onSubmit={handleSubmit} className="max-w-lg bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Name</label><input value={form.name} onChange={e=>set("name",e.target.value)} required className={inputCls} /></div>
        <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Description</label><input value={form.description} onChange={e=>set("description",e.target.value)} className={inputCls} /></div>
        <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Type</label><select value={form.type} onChange={e=>set("type",e.target.value)} className={inputCls}><option value="PREMIUM">Premium</option><option value="MEDIUM">Medium</option><option value="PATAH">Broken</option><option value="BY_PRODUCT">By-Product</option></select></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Price/Kg (Rp)</label><input type="number" value={form.pricePerKg} onChange={e=>set("pricePerKg",Number(e.target.value))} className={inputCls} /></div>
          <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Min Stock (sak)</label><input type="number" value={form.minimumStock} onChange={e=>set("minimumStock",Number(e.target.value))} className={inputCls} /></div>
        </div>
        <div className="space-y-2"><label className="text-xs font-medium text-slate-400">Packaging Variants</label>
          {variants.map((v, i) => (<div key={i} className="flex gap-2 items-center"><input type="number" value={v.size} onChange={e=>{const nv=[...variants]; nv[i].size=Number(e.target.value); setVariants(nv);}} className={inputCls} /><input value={v.unit} onChange={e=>{const nv=[...variants]; nv[i].unit=e.target.value; setVariants(nv);}} className={inputCls} />{variants.length>1&&<button type="button" onClick={()=>setVariants(variants.filter((_,j)=>j!==i))} className="p-1 text-red-400"><X className="w-4 h-4" /></button>}</div>))}
          <button type="button" onClick={()=>setVariants([...variants,{size:0,unit:"kg"}])} className="text-xs text-emerald-400 flex items-center gap-1"><Plus className="w-3 h-3" /> Add variant</button>
        </div>
        <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Active</label><select value={form.isActive?"true":"false"} onChange={e=>set("isActive",e.target.value==="true")} className={inputCls}><option value="true">Active</option><option value="false">Inactive</option></select></div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={()=>router.back()} className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-white disabled:opacity-50 transition-colors">{saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes</button>
        </div>
      </form></div>
  );
}
