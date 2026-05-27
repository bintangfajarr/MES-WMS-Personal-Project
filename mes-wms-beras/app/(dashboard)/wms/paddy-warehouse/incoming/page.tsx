"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import IncomingForm from "@/components/wms/IncomingForm";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";

export default function RecordPaddyReceptionPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [varieties, setVarieties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOptions = async () => {
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
        console.error("Failed to load options", e);
      } finally {
        setLoading(false);
      }
    };
    loadOptions();
  }, []);

  if (loading) return <LoadingSkeleton variant="form" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catat Penerimaan Padi"
        description="Record gross weights, moisture, and impurity parameters for incoming paddy lot cargos"
      />
      <IncomingForm suppliers={suppliers} varieties={varieties} />
    </div>
  );
}
