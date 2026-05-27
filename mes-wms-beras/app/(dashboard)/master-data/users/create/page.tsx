"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "OPR_PROD" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/master-data/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (json.success) { toast.success("User created successfully"); router.push("/master-data/users"); }
      else toast.error(json.error || "Failed to create user");
    } catch { toast.error("Failed to create user"); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Add User" description="Create a new system user" />
      <form onSubmit={handleSubmit} className="max-w-lg bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Full Name</label>
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Email</label>
          <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required className="w-full px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Password</label>
          <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={8} className="w-full px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Role</label>
          <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30">
            <option value="ADMIN">Admin</option>
            <option value="OPR_PROD">Production Operator</option>
            <option value="OPR_WHS">Warehouse Operator</option>
            <option value="DRIVER">Driver</option>
          </select>
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={() => router.back()} className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
          <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-white disabled:opacity-50 transition-colors">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Create User
          </button>
        </div>
      </form>
    </div>
  );
}
