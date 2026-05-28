"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import DeliveryOrderForm from "@/components/wms/DeliveryOrderForm";
import { Loader2 } from "lucide-react";

export default function CreateDeliveryOrderPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resCust, resUsers, resProd] = await Promise.all([
          fetch("/api/master-data/customers"),
          fetch("/api/master-data/users"),
          fetch("/api/master-data/products"),
        ]);

        const jsonCust = await resCust.json();
        const jsonUsers = await resUsers.json();
        const jsonProd = await resProd.json();

        if (jsonCust.success) setCustomers(jsonCust.data);
        if (jsonUsers.success) {
          setDrivers(jsonUsers.data.filter((u: any) => u.role === "DRIVER" && u.status === "ACTIVE"));
        }
        if (jsonProd.success) setProducts(jsonProd.data);
      } catch (e) {
        console.error("Gagal memuat master data form DO", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buat Delivery Order Baru"
        description="Buat pengiriman baru untuk pelanggan dan alokasikan batch produk menggunakan aturan FIFO"
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 border border-slate-800 rounded-xl space-y-3">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
          <p className="text-sm text-slate-400">Sedang memuat data master...</p>
        </div>
      ) : (
        <DeliveryOrderForm customers={customers} drivers={drivers} products={products} />
      )}
    </div>
  );
}
