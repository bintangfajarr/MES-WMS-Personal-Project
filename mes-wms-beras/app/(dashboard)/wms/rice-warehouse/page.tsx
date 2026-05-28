"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Warehouse,
  AlertTriangle,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import RiceStockTable from "@/components/wms/RiceStockTable";
import ErrorState from "@/components/shared/ErrorState";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function RiceWarehousePage() {
  const router = useRouter();

  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [filters, setFilters] = useState({
    productId: "",
    status: "",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    limit: 10,
  });

  // Fetch summary per product
  const fetchSummary = async () => {
    try {
      const res = await fetch("/api/wms/rice-stock/summary");
      const json = await res.json();
      if (json.success) setSummary(json.data);
    } catch (e) {
      console.error("Failed to fetch rice stock summary", e);
    }
  };

  // Fetch product list for filters
  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/master-data/products");
      const json = await res.json();
      if (json.success) {
        setProducts(
          json.data.filter((p: any) => p.type !== "BY_PRODUCT")
        );
      }
    } catch (e) {
      console.error("Failed to fetch products", e);
    }
  };

  // Fetch batches
  const fetchBatches = async (page = 1) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(pagination.limit),
        ...(filters.productId && { productId: filters.productId }),
        ...(filters.status && { status: filters.status }),
      });

      const res = await fetch(`/api/wms/rice-stock?${query.toString()}`);
      const json = await res.json();
      if (json.success) {
        setBatches(json.data);
        setPagination({
          page: json.pagination.page,
          totalPages: json.pagination.totalPages,
          limit: json.pagination.limit,
        });
      } else {
        setError(json.error);
      }
    } catch {
      setError("Failed to fetch rice stock data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchBatches(1);
  }, [filters]);

  // Detect batches near expiry
  const nearExpiryCount = summary.reduce((count, s) => {
    if (s.nearestExpiry) {
      const days = Math.ceil(
        (new Date(s.nearestExpiry).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      );
      if (days <= 30 && days > 0) return count + 1;
    }
    return count;
  }, 0);

  if (error && !loading)
    return <ErrorState message={error} onRetry={() => fetchBatches(1)} />;

  const colorSchemes = [
    {
      bg: "bg-amber-500/5",
      iconBg: "bg-amber-500/10",
      iconBorder: "border-amber-500/20",
      iconColor: "text-amber-400",
    },
    {
      bg: "bg-sky-500/5",
      iconBg: "bg-sky-500/10",
      iconBorder: "border-sky-500/20",
      iconColor: "text-sky-400",
    },
    {
      bg: "bg-violet-500/5",
      iconBg: "bg-violet-500/10",
      iconBorder: "border-violet-500/20",
      iconColor: "text-violet-400",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gudang Beras (Finished Goods)"
        description="Monitor stok beras hasil produksi, penerimaan, dan stock opname"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/wms/rice-warehouse/inbound")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-white transition-colors"
            >
              <Package className="w-4 h-4" /> Terima Dari Produksi
            </button>
            <button
              onClick={() => router.push("/wms/rice-warehouse/stock-opname")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white transition-colors"
            >
              <BarChart3 className="w-4 h-4" /> Stock Opname
            </button>
          </div>
        }
      />

      {/* Near Expiry Alert Banner */}
      {nearExpiryCount > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-300">
              Perhatian: {nearExpiryCount} produk memiliki batch yang akan
              kadaluarsa dalam 30 hari
            </p>
            <p className="text-xs text-yellow-400/70 mt-0.5">
              Prioritaskan pengiriman batch dengan tanggal kadaluarsa terdekat
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards per Product */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summary.length > 0
          ? summary.map((s, idx) => {
              const scheme = colorSchemes[idx % colorSchemes.length];
              const isLowStock = s.totalSak < s.minimumStock;
              return (
                <div
                  key={s.productId}
                  className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 relative overflow-hidden"
                >
                  <div
                    className={`absolute top-0 right-0 w-24 h-24 ${scheme.bg} rounded-full blur-2xl`}
                  />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-9 h-9 rounded-lg ${scheme.iconBg} border ${scheme.iconBorder} flex items-center justify-center`}
                        >
                          <Warehouse
                            className={`w-4.5 h-4.5 ${scheme.iconColor}`}
                          />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">
                            {s.name}
                          </h3>
                          <p className="text-[10px] text-slate-500">{s.sku}</p>
                        </div>
                      </div>
                      {isLowStock && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-red-500/15 text-red-400 border border-red-500/25">
                          Stok Rendah
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                          Total Sak
                        </p>
                        <p className="text-lg font-bold text-white">
                          {s.totalSak.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                          Total Kg
                        </p>
                        <p className="text-lg font-bold text-white">
                          {s.totalKg.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                          Batch
                        </p>
                        <p className="text-lg font-bold text-white">
                          {s.batchCount}
                        </p>
                      </div>
                    </div>

                    {s.nearestExpiry && (
                      <div className="mt-3 pt-3 border-t border-slate-800">
                        <p className="text-[10px] text-slate-500">
                          Kadaluarsa Terdekat:{" "}
                          <span className="text-slate-300">
                            {format(
                              new Date(s.nearestExpiry),
                              "dd MMM yyyy",
                              { locale: localeId }
                            )}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          : // Skeleton cards
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-slate-900/50 border border-slate-800 rounded-xl p-5"
              >
                <div className="animate-pulse space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-slate-800 rounded-lg" />
                    <div className="h-4 bg-slate-800 rounded w-24" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="h-6 bg-slate-800 rounded" />
                    <div className="h-6 bg-slate-800 rounded" />
                    <div className="h-6 bg-slate-800 rounded" />
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Batches Table */}
      <RiceStockTable
        data={batches}
        isLoading={loading}
        onRowClick={(row) =>
          router.push(`/wms/rice-warehouse/${row.id}`)
        }
        pagination={{
          page: pagination.page,
          totalPages: pagination.totalPages,
          onPageChange: (p) => fetchBatches(p),
        }}
        filters={filters}
        onFilterChange={setFilters}
        products={products}
      />
    </div>
  );
}
