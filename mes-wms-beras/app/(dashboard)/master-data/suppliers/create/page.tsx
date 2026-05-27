"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";

const inputCls = "w-full px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30";

export default function CreateSupplierPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", address: "", city: "", province: "", phone: "", email: "", region: "" });
  const set = (k: string, v: string) => setForm(p => ({...p, [k]: v}));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await fetch("/api/master-data/suppliers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (json.success) { toast.success("Supplier created"); router.push("/master-data/suppliers"); }
      else toast.error(json.error);
    } catch { toast.error("Failed to create supplier"); } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Add Supplier" description="Register a new paddy supplier" />
      <form onSubmit={handleSubmit} className="max-w-lg bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Code</label><input value={form.code} onChange={e=>set("code",e.target.value)} required className={inputCls} placeholder="SUP-001" /></div>
          <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Name</label><input value={form.name} onChange={e=>set("name",e.target.value)} required className={inputCls} /></div>
        </div>
        <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Address</label><input value={form.address} onChange={e=>set("address",e.target.value)} className={inputCls} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">City</label><input value={form.city} onChange={e=>set("city",e.target.value)} className={inputCls} /></div>
          <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Province</label><input value={form.province} onChange={e=>set("province",e.target.value)} className={inputCls} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Phone</label><input value={form.phone} onChange={e=>set("phone",e.target.value)} className={inputCls} /></div>
          <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Email</label><input type="email" value={form.email} onChange={e=>set("email",e.target.value)} className={inputCls} /></div>
        </div>
        <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Origin Region</label><input value={form.region} onChange={e=>set("region",e.target.value)} className={inputCls} /></div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={() => router.back()} className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
          <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-white disabled:opacity-50 transition-colors">{loading && <Loader2 className="w-4 h-4 animate-spin" />} Create Supplier</button>
        </div>
      </form>
    </div>
  );
}
