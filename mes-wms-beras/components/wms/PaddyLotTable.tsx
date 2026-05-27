"use client";

import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import { format } from "date-fns";

interface PaddyLotTableProps {
  data: any[];
  isLoading: boolean;
  onRowClick: (row: any) => void;
  pagination?: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  filters: {
    status: string;
    varietyId: string;
    supplierId: string;
  };
  onFilterChange: (filters: any) => void;
  suppliers: any[];
  varieties: any[];
}

export default function PaddyLotTable({
  data,
  isLoading,
  onRowClick,
  pagination,
  filters,
  onFilterChange,
  suppliers,
  varieties,
}: PaddyLotTableProps) {
  const columns = [
    {
      header: "Lot Number",
      cell: (r: any) => <span className="font-semibold text-emerald-400">{r.lotNumber}</span>,
    },
    {
      header: "Supplier",
      cell: (r: any) => <span>{r.supplier?.name || "-"}</span>,
    },
    {
      header: "Variety",
      cell: (r: any) => <span>{r.variety?.name || "-"}</span>,
    },
    {
      header: "Gross Weight",
      cell: (r: any) => <span>{Number(r.grossWeight).toLocaleString()} kg</span>,
    },
    {
      header: "Net Weight",
      cell: (r: any) => <span className="font-medium text-white">{Number(r.netWeight).toLocaleString()} kg</span>,
    },
    {
      header: "Moisture",
      cell: (r: any) => <span>{Number(r.moistureContent)}%</span>,
    },
    {
      header: "Status",
      cell: (r: any) => <StatusBadge status={r.status} type="paddyLot" />,
    },
    {
      header: "Arrived At",
      cell: (r: any) => (
        <span className="text-xs text-slate-500">
          {format(new Date(r.arrivedAt), "dd MMM yyyy HH:mm")}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Status</label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="MENUNGGU_QC">Waiting QC</option>
            <option value="ANTRIAN_GILING">Milling Queue</option>
            <option value="DITOLAK">Rejected</option>
            <option value="RESERVED">Reserved</option>
            <option value="SEDANG_DIGILING">Milling</option>
            <option value="SELESAI">Completed</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Supplier</label>
          <select
            value={filters.supplierId}
            onChange={(e) => onFilterChange({ ...filters, supplierId: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Paddy Variety</label>
          <select
            value={filters.varietyId}
            onChange={(e) => onFilterChange({ ...filters, varietyId: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Varieties</option>
            {varieties.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        pagination={pagination}
        onRowClick={onRowClick}
        emptyMessage="No paddy lots found matching filters"
      />
    </div>
  );
}
