"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus, ClipboardList, Activity, CheckCircle, Search, Calendar } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import ErrorState from "@/components/shared/ErrorState";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/utils/date";

interface WorkOrder {
  id: string;
  woNumber: string;
  paddyLot: {
    lotNumber: string;
    variety: {
      name: string;
    };
  };
  targetProducts: string[];
  estimatedOutput: number;
  status: string;
  deadline: string;
  createdAt: string;
  steps: Array<{
    status: string;
  }>;
}

export default function WorkOrdersPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completedToday: 0,
  });

  const [filters, setFilters] = useState({
    status: "",
    startDate: "",
    endDate: "",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    limit: 10,
  });

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/mes/work-orders/stats");
      const json = await res.json();
      if (json.success) setStats(json.data);
    } catch (e) {
      console.error("Failed to fetch WO stats", e);
    }
  };

  const fetchWorkOrders = async (page = 1) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(pagination.limit),
        status: filters.status,
        startDate: filters.startDate,
        endDate: filters.endDate,
      });

      const res = await fetch(`/api/mes/work-orders?${query.toString()}`);
      const json = await res.json();
      if (json.success) {
        setWorkOrders(json.data);
        setPagination({
          page: json.pagination.page,
          totalPages: json.pagination.totalPages,
          limit: json.pagination.limit,
        });
      } else {
        setError(json.error);
      }
    } catch {
      setError("Failed to fetch work orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchWorkOrders(1);
  }, [filters]);

  if (error && !loading) {
    return <ErrorState message={error} onRetry={() => fetchWorkOrders(1)} />;
  }

  const columns = [
    {
      header: "WO Number",
      cell: (row: WorkOrder) => (
        <span className="font-mono font-semibold text-slate-100">{row.woNumber}</span>
      ),
    },
    {
      header: "Lot Padi Asal",
      cell: (row: WorkOrder) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-200">{row.paddyLot?.lotNumber}</span>
          <span className="text-[11px] text-slate-500">{row.paddyLot?.variety?.name}</span>
        </div>
      ),
    },
    {
      header: "Target Produk",
      cell: (row: WorkOrder) => {
        const products = Array.isArray(row.targetProducts)
          ? row.targetProducts
          : JSON.parse(row.targetProducts as any || "[]");
        return (
          <div className="flex flex-wrap gap-1">
            {products.map((p: string) => (
              <span key={p} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-medium uppercase">
                {p}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      header: "Est. Output",
      cell: (row: WorkOrder) => (
        <span className="font-medium">{Number(row.estimatedOutput).toLocaleString()} kg</span>
      ),
    },
    {
      header: "Status",
      cell: (row: WorkOrder) => <StatusBadge status={row.status} type="workOrder" />,
    },
    {
      header: "Progress",
      cell: (row: WorkOrder) => {
        const completed = row.steps.filter(
          (s) => s.status === "SELESAI" || s.status === "SKIPPED"
        ).length;
        const pct = Math.round((completed / 5) * 100);
        return (
          <div className="w-28 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>{completed}/5 langkah</span>
              <span>{pct}%</span>
            </div>
            <Progress value={pct} className="h-1.5 bg-slate-950 border border-slate-850" />
          </div>
        );
      },
    },
    {
      header: "Deadline",
      cell: (row: WorkOrder) => (
        <span className="text-xs text-slate-400">{formatDate(row.deadline)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Work Orders (MES)"
        description="Kelola dan pantau proses penggilingan padi menjadi beras siap kemas"
        actions={
          isAdmin ? (
            <button
              onClick={() => router.push("/mes/work-orders/create")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow"
            >
              <Plus className="w-4 h-4" /> Buat Work Order
            </button>
          ) : undefined
        }
      />

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 relative overflow-hidden flex items-center justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
          <div className="space-y-1 relative z-10">
            <span className="text-xs text-slate-400 font-medium">Total Work Orders</span>
            <h2 className="text-2xl font-bold text-white">{stats.total}</h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center relative z-10">
            <ClipboardList className="w-6 h-6 text-emerald-400" />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 relative overflow-hidden flex items-center justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
          <div className="space-y-1 relative z-10">
            <span className="text-xs text-slate-400 font-medium">Work Orders Aktif</span>
            <h2 className="text-2xl font-bold text-white">{stats.active}</h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center relative z-10">
            <Activity className="w-6 h-6 text-blue-400 animate-pulse" />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 relative overflow-hidden flex items-center justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl" />
          <div className="space-y-1 relative z-10">
            <span className="text-xs text-slate-400 font-medium">Selesai Hari Ini</span>
            <h2 className="text-2xl font-bold text-white">{stats.completedToday}</h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center relative z-10">
            <CheckCircle className="w-6 h-6 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
          {/* Status Filter */}
          <div className="space-y-1.5 w-full md:w-48">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="">Semua Status</option>
              <option value="DRAFT">Draft</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="SELESAI">Selesai</option>
              <option value="CANCELLED">Dibatalkan</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-36">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs outline-none focus:border-emerald-500 transition-colors"
              />
              <Calendar className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <span className="text-slate-650 text-xs">s/d</span>
            <div className="relative w-full md:w-36">
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs outline-none focus:border-emerald-500 transition-colors"
              />
              <Calendar className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Clear Filters */}
        {(filters.status || filters.startDate || filters.endDate) && (
          <button
            onClick={() => setFilters({ status: "", startDate: "", endDate: "" })}
            className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
          >
            Hapus Filter
          </button>
        )}
      </div>

      {/* Work Orders Table */}
      <DataTable
        columns={columns}
        data={workOrders}
        isLoading={loading}
        onRowClick={(row) => router.push(`/mes/work-orders/${row.id}`)}
        emptyMessage="Tidak ada Work Order yang ditemukan"
        pagination={{
          page: pagination.page,
          totalPages: pagination.totalPages,
          onPageChange: (p) => fetchWorkOrders(p),
        }}
      />
    </div>
  );
}
