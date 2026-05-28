"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import StatusBadge from "@/components/shared/StatusBadge";
import DataTable from "@/components/shared/DataTable";
import { BATCH_STATUS_LABEL } from "@/lib/constants/status";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { AlertTriangle } from "lucide-react";

interface RiceStockTableProps {
  data: any[];
  isLoading?: boolean;
  onRowClick?: (row: any) => void;
  pagination?: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  filters: {
    productId: string;
    status: string;
  };
  onFilterChange: (filters: { productId: string; status: string }) => void;
  products: any[];
}

export default function RiceStockTable({
  data,
  isLoading,
  onRowClick,
  pagination,
  filters,
  onFilterChange,
  products,
}: RiceStockTableProps) {
  const isNearExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const columns = [
    {
      header: "Batch Number",
      cell: (row: any) => (
        <span className="font-mono text-xs text-emerald-400">
          {row.batchNumber}
        </span>
      ),
    },
    {
      header: "Produk",
      cell: (row: any) => (
        <div>
          <p className="text-white font-medium text-sm">{row.product?.name}</p>
          <p className="text-xs text-slate-500">{row.product?.sku}</p>
        </div>
      ),
    },
    {
      header: "Ukuran",
      cell: (row: any) => (
        <span className="text-slate-300">{Number(row.packagingSize)} kg</span>
      ),
    },
    {
      header: "Jumlah Sak",
      cell: (row: any) => (
        <span className="text-white font-semibold">{row.totalSak}</span>
      ),
    },
    {
      header: "Lokasi",
      cell: (row: any) => (
        <span className="text-slate-300">
          {row.location?.code || (
            <span className="text-slate-600 italic">Belum ditempatkan</span>
          )}
        </span>
      ),
    },
    {
      header: "Tgl Produksi",
      cell: (row: any) => (
        <span className="text-slate-400 text-xs">
          {format(new Date(row.productionDate), "dd MMM yyyy", {
            locale: localeId,
          })}
        </span>
      ),
    },
    {
      header: "Tgl Kadaluarsa",
      cell: (row: any) => {
        const near = isNearExpiry(row.expiryDate);
        const expired = isExpired(row.expiryDate);
        return (
          <div className="flex items-center gap-1.5">
            {(near || expired) && (
              <AlertTriangle
                className={cn(
                  "w-3.5 h-3.5",
                  expired ? "text-red-400" : "text-yellow-400"
                )}
              />
            )}
            <span
              className={cn(
                "text-xs",
                expired
                  ? "text-red-400 font-semibold"
                  : near
                  ? "text-yellow-400 font-semibold"
                  : "text-slate-400"
              )}
            >
              {format(new Date(row.expiryDate), "dd MMM yyyy", {
                locale: localeId,
              })}
            </span>
          </div>
        );
      },
    },
    {
      header: "Status",
      cell: (row: any) => <StatusBadge status={row.status} type="batch" />,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filters.productId}
          onChange={(e) =>
            onFilterChange({ ...filters, productId: e.target.value })
          }
          className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="">Semua Produk</option>
          {products.map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) =>
            onFilterChange({ ...filters, status: e.target.value })
          }
          className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="">Semua Status</option>
          {Object.entries(BATCH_STATUS_LABEL).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        onRowClick={onRowClick}
        pagination={pagination}
        emptyMessage="Tidak ada batch beras ditemukan"
      />
    </div>
  );
}
