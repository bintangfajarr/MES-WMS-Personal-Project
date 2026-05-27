"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import ErrorState from "@/components/shared/ErrorState";

export default function SuppliersPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/master-data/suppliers");
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error);
    } catch { setError("Failed to fetch suppliers"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  if (error && !loading) return <ErrorState message={error} onRetry={fetchData} />;

  const columns = [
    { header: "Code", accessorKey: "code" as const },
    { header: "Name", accessorKey: "name" as const },
    { header: "City", cell: (row: any) => <span className="text-slate-400">{row.city || "-"}</span> },
    { header: "Region", cell: (row: any) => <span className="text-slate-400">{row.region || "-"}</span> },
    { header: "Phone", cell: (row: any) => <span className="text-slate-400">{row.phone || "-"}</span> },
    { header: "Status", cell: (row: any) => <StatusBadge status={row.status} type="user" /> },
  ];

  return (
    <div>
      <PageHeader title="Suppliers" description="Manage paddy suppliers" actions={
        <button onClick={() => router.push("/master-data/suppliers/create")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-white transition-colors">
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      } />
      <DataTable columns={columns} data={data} isLoading={loading} onRowClick={(row) => router.push(`/master-data/suppliers/${row.id}`)} emptyMessage="No suppliers found" />
    </div>
  );
}
