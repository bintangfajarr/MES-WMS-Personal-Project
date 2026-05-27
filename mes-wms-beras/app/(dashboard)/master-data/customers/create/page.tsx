"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
const inputCls = "w-full px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30";

export default function CreateCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", type: "TOKO", deliveryAddress: "", city: "", phone: "", email: "" });
  const set = (k: string, v: string) => setForm(p => ({...p, [k]: v}));
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { const r = await fetch("/api/master-data/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); const j = await r.json(); if (j.success) { toast.success("Customer created"); router.push("/master-data/customers"); } else toast.error(j.error); } catch { toast.error("Failed"); } finally { setLoading(false); }
  };
  return (
    <div><PageHeader title="Add Customer" description="Register a new customer" />
      <form onSubmit={handleSubmit} className="max-w-lg bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Code</label><input value={form.code} onChange={e=>set("code",e.target.value)} required className={inputCls} placeholder="CUST-001" /></div>
          <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Name</label><input value={form.name} onChange={e=>set("name",e.target.value)} required className={inputCls} /></div>
        </div>
        <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Type</label>
          <select value={form.type} onChange={e=>set("type",e.target.value)} className={inputCls}><option value="TOKO">Store</option><option value="DISTRIBUTOR">Distributor</option><option value="SUPERMARKET">Supermarket</option><option value="HORECA">HoReCa</option><option value="KOPERASI">Cooperative</option></select></div>
        <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Delivery Address</label><input value={form.deliveryAddress} onChange={e=>set("deliveryAddress",e.target.value)} className={inputCls} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">City</label><input value={form.city} onChange={e=>set("city",e.target.value)} className={inputCls} /></div>
          <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Phone</label><input value={form.phone} onChange={e=>set("phone",e.target.value)} className={inputCls} /></div>
        </div>
        <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Email</label><input type="email" value={form.email} onChange={e=>set("email",e.target.value)} className={inputCls} /></div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={()=>router.back()} className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
          <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-white disabled:opacity-50 transition-colors">{loading && <Loader2 className="w-4 h-4 animate-spin" />} Create Customer</button>
        </div>
      </form></div>
  );
}
