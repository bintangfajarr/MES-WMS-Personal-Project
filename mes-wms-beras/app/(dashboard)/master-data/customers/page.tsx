"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import ErrorState from "@/components/shared/ErrorState";

const typeLabels: Record<string, string> = { TOKO: "Store", DISTRIBUTOR: "Distributor", SUPERMARKET: "Supermarket", HORECA: "HoReCa", KOPERASI: "Cooperative" };

export default function CustomersPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const fetchData = async () => { setLoading(true); try { const r = await fetch("/api/master-data/customers"); const j = await r.json(); if (j.success) setData(j.data); else setError(j.error); } catch { setError("Failed to fetch"); } finally { setLoading(false); } };
  useEffect(() => { fetchData(); }, []);
  if (error && !loading) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div>
      <PageHeader title="Customers" description="Manage delivery customers" actions={<button onClick={() => router.push("/master-data/customers/create")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-white transition-colors"><Plus className="w-4 h-4" /> Add Customer</button>} />
      <DataTable columns={[
        { header: "Code", accessorKey: "code" as const },
        { header: "Name", accessorKey: "name" as const },
        { header: "Type", cell: (r: any) => <span className="text-xs text-slate-300">{typeLabels[r.type]||r.type}</span> },
        { header: "City", cell: (r: any) => <span className="text-slate-400">{r.city || "-"}</span> },
        { header: "Phone", cell: (r: any) => <span className="text-slate-400">{r.phone || "-"}</span> },
        { header: "Status", cell: (r: any) => <StatusBadge status={r.status} type="user" /> },
      ]} data={data} isLoading={loading} onRowClick={(r) => router.push(`/master-data/customers/${r.id}`)} emptyMessage="No customers found" />
    </div>
  );
}
