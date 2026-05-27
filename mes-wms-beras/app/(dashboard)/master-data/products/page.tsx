"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import ErrorState from "@/components/shared/ErrorState";
const typeLabels: Record<string, string> = { PREMIUM: "Premium", MEDIUM: "Medium", PATAH: "Broken", BY_PRODUCT: "By-Product" };

export default function ProductsPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const fetchData = async () => { setLoading(true); try { const r = await fetch("/api/master-data/products"); const j = await r.json(); if (j.success) setData(j.data); else setError(j.error); } catch { setError("Failed to fetch"); } finally { setLoading(false); } };
  useEffect(() => { fetchData(); }, []);
  if (error && !loading) return <ErrorState message={error} onRetry={fetchData} />;
  return (
    <div>
      <PageHeader title="Products" description="Manage rice products" actions={<button onClick={() => router.push("/master-data/products/create")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-white transition-colors"><Plus className="w-4 h-4" /> Add Product</button>} />
      <DataTable columns={[
        { header: "SKU", accessorKey: "sku" as const },
        { header: "Name", accessorKey: "name" as const },
        { header: "Type", cell: (r: any) => <span className="text-xs text-slate-300">{typeLabels[r.type]||r.type}</span> },
        { header: "Price/kg", cell: (r: any) => <span className="text-emerald-400 font-medium">Rp {Number(r.pricePerKg).toLocaleString()}</span> },
        { header: "Min Stock", cell: (r: any) => <span className="text-slate-400">{r.minimumStock} sak</span> },
        { header: "Active", cell: (r: any) => <span className={r.isActive ? "text-emerald-400" : "text-slate-500"}>{r.isActive ? "Yes" : "No"}</span> },
      ]} data={data} isLoading={loading} onRowClick={(r) => router.push(`/master-data/products/${r.id}`)} emptyMessage="No products found" />
    </div>
  );
}
