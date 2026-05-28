"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, ClipboardList, Package, CheckCircle2, Plus, Calendar, User, Search, Eye } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import ErrorState from "@/components/shared/ErrorState";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function DeliveryPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [customers, setCustomers] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);

  // Filter states
  const [status, setStatus] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [driverId, setDriverId] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    limit: 10,
  });

  // Fetch filter metadata (customers and drivers)
  const fetchMetadata = async () => {
    try {
      const [resCust, resUsers] = await Promise.all([
        fetch("/api/master-data/customers"),
        fetch("/api/master-data/users"),
      ]);

      const jsonCust = await resCust.json();
      const jsonUsers = await resUsers.json();

      if (jsonCust.success) setCustomers(jsonCust.data);
      if (jsonUsers.success) {
        setDrivers(jsonUsers.data.filter((u: any) => u.role === "DRIVER" && u.status === "ACTIVE"));
      }
    } catch (e) {
      console.error("Failed to fetch DO metadata filters", e);
    }
  };

  // Fetch delivery orders
  const fetchOrders = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(pagination.limit),
        ...(status && { status }),
        ...(customerId && { customerId }),
        ...(driverId && { driverId }),
      });

      const res = await fetch(`/api/wms/delivery-orders?${query.toString()}`);
      const json = await res.json();

      if (json.success) {
        setOrders(json.data);
        setPagination({
          page: json.pagination.page,
          totalPages: json.pagination.totalPages,
          limit: json.pagination.limit,
        });
      } else {
        setError(json.error || "Gagal memuat daftar pengiriman");
      }
    } catch (e) {
      setError("Gagal memuat data dari server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchOrders(1);
  }, [status, customerId, driverId]);

  // Compute local KPI counters
  const totalPending = orders.filter((o) => ["CONFIRMED", "PICKING", "READY_TO_SHIP"].includes(o.status)).length;
  const totalShipped = orders.filter((o) => o.status === "SHIPPED").length;
  const totalCompleted = orders.filter((o) => o.status === "DELIVERED" || o.status === "PARTIAL_RETURN").length;
  const totalSacks = orders.reduce(
    (sum, o) => sum + o.items.reduce((iSum: number, item: any) => iSum + item.orderedQty, 0),
    0
  );

  const columns = [
    {
      header: "Nomor DO",
      cell: (row: any) => (
        <span className="font-mono text-xs font-semibold text-emerald-400">
          {row.doNumber}
        </span>
      ),
    },
    {
      header: "Pelanggan",
      cell: (row: any) => (
        <div>
          <p className="text-white font-semibold text-sm">{row.customer?.name}</p>
          <p className="text-xs text-slate-500">
            {row.customer?.city || ""} - {row.customer?.code}
          </p>
        </div>
      ),
    },
    {
      header: "Tanggal Kirim",
      cell: (row: any) => (
        <span className="text-slate-300 text-xs">
          {format(new Date(row.deliveryDate), "dd MMM yyyy", { locale: localeId })}
        </span>
      ),
    },
    {
      header: "Total Barang",
      cell: (row: any) => {
        const itemSacks = row.items.reduce((sum: number, i: any) => sum + i.orderedQty, 0);
        return (
          <span className="text-white font-medium">
            {itemSacks} sak ({row.items.length} sku)
          </span>
        );
      },
    },
    {
      header: "Driver / Supir",
      cell: (row: any) => (
        <span className="text-slate-300 text-xs">
          {row.driver?.name || <span className="text-slate-600 italic">Belum Ditugaskan</span>}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (row: any) => <StatusBadge status={row.status} type="delivery" />,
    },
    {
      header: "Aksi",
      cell: (row: any) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/wms/delivery/${row.id}`);
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> Detail
        </button>
      ),
    },
  ];

  if (error && !loading) {
    return <ErrorState message={error} onRetry={() => fetchOrders(1)} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengiriman (Delivery Order)"
        description="Kelola dan pantau proses pengeluaran barang jadi, penugasan driver, dan status pengiriman"
        actions={
          <button
            onClick={() => router.push("/wms/delivery/create")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-white transition-colors"
          >
            <Plus className="w-4 h-4" /> Buat Delivery Order
          </button>
        }
      />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Pending */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Pending / Antrian</p>
              <h4 className="text-xl font-bold text-white mt-0.5">{totalPending} DO</h4>
            </div>
          </div>
        </div>

        {/* Card 2: Shipped */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Truck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Dalam Perjalanan</p>
              <h4 className="text-xl font-bold text-white mt-0.5">{totalShipped} DO</h4>
            </div>
          </div>
        </div>

        {/* Card 3: Completed */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Tiba / Selesai</p>
              <h4 className="text-xl font-bold text-white mt-0.5">{totalCompleted} DO</h4>
            </div>
          </div>
        </div>

        {/* Card 4: Total Sacks */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 rounded-full blur-2xl" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Jumlah Sacks Kirim</p>
              <h4 className="text-xl font-bold text-white mt-0.5">{totalSacks} Sak</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 bg-slate-900/20 border border-slate-850 p-4 rounded-xl">
          {/* Status Select */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Semua Status</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PICKING">Picking</option>
            <option value="READY_TO_SHIP">Ready to Ship</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="PARTIAL_RETURN">Partial Return</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Customer Select */}
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500 max-w-[220px]"
          >
            <option value="">Semua Pelanggan</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Driver Select */}
          <select
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500 max-w-[200px]"
          >
            <option value="">Semua Driver</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={orders}
          isLoading={loading}
          onRowClick={(row) => router.push(`/wms/delivery/${row.id}`)}
          pagination={{
            page: pagination.page,
            totalPages: pagination.totalPages,
            onPageChange: (p) => fetchOrders(p),
          }}
          emptyMessage="Tidak ada data Delivery Order ditemukan"
        />
      </div>
    </div>
  );
}
