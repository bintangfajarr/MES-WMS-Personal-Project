"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, KeyRound } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "", status: "" });
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    fetch(`/api/master-data/users/${id}`).then(r => r.json()).then(json => {
      if (json.success) setForm({ name: json.data.name, email: json.data.email, role: json.data.role, status: json.data.status });
    }).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/master-data/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (json.success) { toast.success("User updated successfully"); router.push("/master-data/users"); }
      else toast.error(json.error);
    } catch { toast.error("Failed to update user"); }
    finally { setSaving(false); }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setResetting(true);
    try {
      const res = await fetch(`/api/master-data/users/${id}/reset-password`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newPassword }) });
      const json = await res.json();
      if (json.success) { toast.success("Password reset successfully"); setNewPassword(""); }
      else toast.error(json.error);
    } catch { toast.error("Failed to reset password"); }
    finally { setResetting(false); }
  };

  if (loading) return <LoadingSkeleton variant="form" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Edit User" description="Update user information" />
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
          <label className="text-xs font-medium text-slate-400">Role</label>
          <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30">
            <option value="ADMIN">Admin</option>
            <option value="OPR_PROD">Production Operator</option>
            <option value="OPR_WHS">Warehouse Operator</option>
            <option value="DRIVER">Driver</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Status</label>
          <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30">
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={() => router.back()} className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-white disabled:opacity-50 transition-colors">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
          </button>
        </div>
      </form>

      {/* Reset Password */}
      <div className="max-w-lg bg-slate-900/50 border border-amber-500/20 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2"><KeyRound className="w-4 h-4" /> Reset Password</h3>
        <div className="flex gap-2">
          <input type="password" placeholder="New password (min 8 chars)" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="flex-1 px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500" />
          <button type="button" onClick={handleResetPassword} disabled={resetting} className="px-4 py-2.5 rounded-lg text-sm font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 disabled:opacity-50 transition-colors">
            {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset"}
          </button>
        </div>
      </div>
    </div>
  );
}
