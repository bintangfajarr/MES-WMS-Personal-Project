"use client";

import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  pagination?: PaginationProps;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-slate-800/50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-slate-800 rounded animate-pulse w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  pagination,
  emptyMessage = "Belum ada data",
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} cols={columns.length} />
              ))
            ) : data.length === 0 ? (
              // Empty state
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
                      <Inbox className="w-6 h-6 text-slate-600" />
                    </div>
                    <p className="text-sm text-slate-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              // Data rows
              data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "transition-colors",
                    onRowClick
                      ? "cursor-pointer hover:bg-slate-800/30"
                      : "hover:bg-slate-800/20"
                  )}
                >
                  {columns.map((col, colIndex) => (
                    <td
                      key={colIndex}
                      className={cn(
                        "px-4 py-3 text-slate-300",
                        col.className
                      )}
                    >
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                        ? String(row[col.accessorKey] ?? "")
                        : ""}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (() => {
        // Sliding window pagination: show up to 5 page buttons around current page
        const maxVisible = 5;
        let startPage = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
        let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);
        if (endPage - startPage + 1 < maxVisible) {
          startPage = Math.max(1, endPage - maxVisible + 1);
        }
        const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

        return (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
            <span className="text-xs text-slate-500">
              Halaman {pagination.page} dari {pagination.totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {startPage > 1 && (
                <>
                  <button
                    onClick={() => pagination.onPageChange(1)}
                    className="w-7 h-7 rounded-md text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    1
                  </button>
                  {startPage > 2 && (
                    <span className="w-7 h-7 flex items-center justify-center text-xs text-slate-600">…</span>
                  )}
                </>
              )}

              {pages.map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => pagination.onPageChange(pageNum)}
                  className={cn(
                    "w-7 h-7 rounded-md text-xs font-medium transition-colors",
                    pagination.page === pageNum
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  )}
                >
                  {pageNum}
                </button>
              ))}

              {endPage < pagination.totalPages && (
                <>
                  {endPage < pagination.totalPages - 1 && (
                    <span className="w-7 h-7 flex items-center justify-center text-xs text-slate-600">…</span>
                  )}
                  <button
                    onClick={() => pagination.onPageChange(pagination.totalPages)}
                    className="w-7 h-7 rounded-md text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    {pagination.totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
