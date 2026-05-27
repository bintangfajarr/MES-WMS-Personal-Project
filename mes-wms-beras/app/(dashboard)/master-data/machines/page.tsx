"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import ErrorState from "@/components/shared/ErrorState";
const typeLabels: Record<string,string> = { DRYER:"Dryer", HUSKER:"Husker", POLISHER:"Polisher", COLOR_SORTER:"Color Sorter", CLASSIFIER:"Classifier", PACKER:"Packer" };

export default function MachinesPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const fetchData = async () => { setLoading(true); try { const r = await fetch("/api/master-data/machines"); const j = await r.json(); if(j.success) setData(j.data); else setError(j.error); } catch { setError("Failed"); } finally { setLoading(false); } };
  useEffect(() => { fetchData(); }, []);
  if(error&&!loading) return <ErrorState message={error} onRetry={fetchData} />;
  return (
    <div>
      <PageHeader title="Machines" description="Manage factory machines" actions={<button onClick={()=>router.push("/master-data/machines/create")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-white transition-colors"><Plus className="w-4 h-4" /> Add Machine</button>} />
      <DataTable columns={[
        { header: "Code", accessorKey: "code" as const },
        { header: "Name", accessorKey: "name" as const },
        { header: "Type", cell: (r:any) => <span className="text-xs text-slate-300">{typeLabels[r.type]||r.type}</span> },
        { header: "Capacity", cell: (r:any) => <span className="text-slate-400">{r.capacityKgPerHour ? `${Number(r.capacityKgPerHour)} kg/hr` : "-"}</span> },
        { header: "Status", cell: (r:any) => <StatusBadge status={r.status} type="machine" /> },
      ]} data={data} isLoading={loading} onRowClick={(r)=>router.push(`/master-data/machines/${r.id}`)} emptyMessage="No machines found" />
    </div>
  );
}
