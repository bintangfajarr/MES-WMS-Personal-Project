"use client";

import { WorkOrderStepType } from "@/types";
import DryingForm from "./steps/DryingForm";
import HuskingForm from "./steps/HuskingForm";
import PolishingForm from "./steps/PolishingForm";
import SortingForm from "./steps/SortingForm";
import PackagingForm from "./steps/PackagingForm";

interface ProductionStepFormProps {
  stepType: WorkOrderStepType;
  workOrderId: string;
  onSuccess: () => void;
}

export default function ProductionStepForm({
  stepType,
  workOrderId,
  onSuccess,
}: ProductionStepFormProps) {
  switch (stepType) {
    case "PENGERINGAN":
      return <DryingForm workOrderId={workOrderId} onSuccess={onSuccess} />;
    case "PENGGILINGAN":
      return <HuskingForm workOrderId={workOrderId} onSuccess={onSuccess} />;
    case "PENYOSOHAN":
      return <PolishingForm workOrderId={workOrderId} onSuccess={onSuccess} />;
    case "SORTASI_GRADING":
      return <SortingForm workOrderId={workOrderId} onSuccess={onSuccess} />;
    case "PENGEMASAN":
      return <PackagingForm workOrderId={workOrderId} onSuccess={onSuccess} />;
    default:
      return (
        <div className="text-xs text-red-400 p-2 border border-red-950/20 bg-red-950/10 rounded-lg">
          Tipe tahapan produksi tidak dikenal
        </div>
      );
  }
}
