"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import ErrorState from "@/components/shared/ErrorState";
import { format } from "date-fns";

export default function QCIncomingPage() {
  const router = useRouter();
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPendingLots = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/qc/incoming");
      const json = await res.json();
      if (json.success) {
        setLots(json.data);
      } else {
        setError(json.error || "Failed to load pending QC lots");
      }
    } catch {
      setError("Failed to fetch pending QC lots");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingLots();
  }, []);

  if (error && !loading) return <ErrorState message={error} onRetry={fetchPendingLots} />;

  const columns = [
    {
      header: "Lot Number",
      cell: (r: any) => <span className="font-semibold text-emerald-400">{r.lotNumber}</span>,
    },
    {
      header: "Supplier",
      cell: (r: any) => <span>{r.supplier?.name}</span>,
    },
    {
      header: "Variety",
      cell: (r: any) => <span>{r.variety?.name}</span>,
    },
    {
      header: "Gross Weight",
      cell: (r: any) => <span>{Number(r.grossWeight).toLocaleString()} kg</span>,
    },
    {
      header: "Moisture Content",
      cell: (r: any) => <span>{Number(r.moistureContent)}%</span>,
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
    <div className="space-y-6">
      <PageHeader
        title="Incoming Quality Control"
        description="Verify moisture content, impurities, and overall quality parameter checks for new lot shipments"
      />

      <DataTable
        columns={columns}
        data={lots}
        isLoading={loading}
        onRowClick={(row) => router.push(`/qc/incoming/${row.id}`)}
        emptyMessage="Excellent! No paddy lots are currently waiting for QC inspection."
      />
    </div>
  );
}
