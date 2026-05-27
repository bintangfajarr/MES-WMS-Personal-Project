"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import ErrorState from "@/components/shared/ErrorState";

export default function PackagingMaterialsPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const fetchData = async () => { setLoading(true); try { const r = await fetch("/api/master-data/packaging-materials"); const j = await r.json(); if(j.success) setData(j.data); else setError(j.error); } catch { setError("Failed"); } finally { setLoading(false); } };
  useEffect(() => { fetchData(); }, []);
  if(error&&!loading) return <ErrorState message={error} onRetry={fetchData} />;
  return (
    <div>
      <PageHeader title="Packaging Materials" description="Manage packaging supplies" actions={<button onClick={()=>router.push("/master-data/packaging-materials/create")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-white transition-colors"><Plus className="w-4 h-4" /> Add Material</button>} />
      <DataTable columns={[
        { header: "Code", accessorKey: "code" as const },
        { header: "Name", accessorKey: "name" as const },
        { header: "Unit", accessorKey: "unit" as const },
        { header: "Stock", cell: (r:any) => <span className={r.currentStock<=r.minimumStock?"text-red-400 font-medium":"text-slate-300"}>{r.currentStock}</span> },
        { header: "Min Stock", cell: (r:any) => <span className="text-slate-400">{r.minimumStock}</span> },
        { header: "Active", cell: (r:any) => <span className={r.isActive?"text-emerald-400":"text-slate-500"}>{r.isActive?"Yes":"No"}</span> },
      ]} data={data} isLoading={loading} onRowClick={(r)=>router.push(`/master-data/packaging-materials/${r.id}`)} emptyMessage="No materials found" />
    </div>
  );
}
