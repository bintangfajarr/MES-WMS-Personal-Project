"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Scale, Layers, AlertCircle } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import PaddyLotTable from "@/components/wms/PaddyLotTable";
import ErrorState from "@/components/shared/ErrorState";

export default function PaddyWarehousePage() {
  const router = useRouter();

  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    totalWeight: 0,
    activeCount: 0,
    waitingQcCount: 0,
  });

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [varieties, setVarieties] = useState<any[]>([]);

  const [filters, setFilters] = useState({
    status: "",
    varietyId: "",
    supplierId: "",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    limit: 10,
  });

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/wms/paddy-lots/stats");
      const json = await res.json();
      if (json.success) setStats(json.data);
    } catch (e) {
      console.error("Failed to fetch warehouse stats", e);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const [sRes, vRes] = await Promise.all([
        fetch("/api/master-data/suppliers"),
        fetch("/api/master-data/paddy-varieties"),
      ]);
      const sJson = await sRes.json();
      const vJson = await vRes.json();
      if (sJson.success) setSuppliers(sJson.data);
      if (vJson.success) setVarieties(vJson.data);
    } catch (e) {
      console.error("Failed to fetch filter options", e);
    }
  };

  const fetchLots = async (page = 1) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(pagination.limit),
        status: filters.status,
        varietyId: filters.varietyId,
        supplierId: filters.supplierId,
      });

      const res = await fetch(`/api/wms/paddy-lots?${query.toString()}`);
      const json = await res.json();
      if (json.success) {
        setLots(json.data);
        setPagination({
          page: json.pagination.page,
          totalPages: json.pagination.totalPages,
          limit: json.pagination.limit,
        });
      } else {
        setError(json.error);
      }
    } catch {
      setError("Failed to fetch paddy lots");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchLots(1);
  }, [filters]);

  if (error && !loading) return <ErrorState message={error} onRetry={() => fetchLots(1)} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gudang Padi (Raw Material)"
        description="Monitor paddy lot stock movements and incoming QC verification"
        actions={
          <button
            onClick={() => router.push("/wms/paddy-warehouse/incoming")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-white transition-colors"
          >
            <Plus className="w-4 h-4" /> Catat Penerimaan
          </button>
        }
      />

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 relative overflow-hidden flex items-center justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
          <div className="space-y-1 relative z-10">
            <span className="text-xs text-slate-400 font-medium">Total Stok Padi</span>
            <h2 className="text-2xl font-bold text-white">
              {stats.totalWeight.toLocaleString()} <span className="text-xs text-slate-400">kg</span>
            </h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center relative z-10">
            <Scale className="w-6 h-6 text-emerald-400" />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 relative overflow-hidden flex items-center justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
          <div className="space-y-1 relative z-10">
            <span className="text-xs text-slate-400 font-medium">Lot Padi Aktif</span>
            <h2 className="text-2xl font-bold text-white">
              {stats.activeCount} <span className="text-xs text-slate-400">lots</span>
            </h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center relative z-10">
            <Layers className="w-6 h-6 text-blue-400" />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 relative overflow-hidden flex items-center justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl" />
          <div className="space-y-1 relative z-10">
            <span className="text-xs text-slate-400 font-medium">Lot Menunggu QC</span>
            <h2 className="text-2xl font-bold text-white">
              {stats.waitingQcCount} <span className="text-xs text-slate-400">lots</span>
            </h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center relative z-10">
            <AlertCircle className="w-6 h-6 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Paddy Lots Table */}
      <PaddyLotTable
        data={lots}
        isLoading={loading}
        onRowClick={(row) => router.push(`/wms/paddy-warehouse/${row.id}`)}
        pagination={{
          page: pagination.page,
          totalPages: pagination.totalPages,
          onPageChange: (p) => fetchLots(p),
        }}
        filters={filters}
        onFilterChange={setFilters}
        suppliers={suppliers}
        varieties={varieties}
      />
    </div>
  );
}
