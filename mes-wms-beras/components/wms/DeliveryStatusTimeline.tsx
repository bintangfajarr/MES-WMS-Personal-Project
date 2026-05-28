"use client";

import { cn } from "@/lib/utils";
import { Check, Truck, PackageCheck, Package, ClipboardList, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { DeliveryOrderStatus } from "@prisma/client";

interface DeliveryStatusTimelineProps {
  currentStatus: DeliveryOrderStatus;
}

const STEPS = [
  { status: "DRAFT" as DeliveryOrderStatus, label: "Draft", desc: "DO dibuat", icon: ClipboardList },
  { status: "CONFIRMED" as DeliveryOrderStatus, label: "Dikonfirmasi", desc: "Stok dialokasikan", icon: Package },
  { status: "PICKING" as DeliveryOrderStatus, label: "Picking", desc: "Proses pengambilan barang", icon: ClipboardList },
  { status: "READY_TO_SHIP" as DeliveryOrderStatus, label: "Siap Kirim", desc: "Barang di loading dock", icon: PackageCheck },
  { status: "SHIPPED" as DeliveryOrderStatus, label: "Dikirim", desc: "Dalam perjalanan", icon: Truck },
  { status: "DELIVERED" as DeliveryOrderStatus, label: "Tiba", desc: "Pengiriman selesai", icon: CheckCircle2 },
];

export default function DeliveryStatusTimeline({ currentStatus }: DeliveryStatusTimelineProps) {
  // If cancelled
  if (currentStatus === "CANCELLED") {
    return (
      <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-6 flex items-center gap-4">
        <XCircle className="w-8 h-8 text-red-500 shrink-0" />
        <div>
          <h4 className="font-bold text-red-400">Delivery Order Dibatalkan</h4>
          <p className="text-xs text-slate-400">Pengiriman ini dibatalkan oleh Admin / Supervisor.</p>
        </div>
      </div>
    );
  }

  const isReturned = currentStatus === "PARTIAL_RETURN";

  // Find index of current step (if partial return, consider index of DELIVERED)
  const activeIndex = STEPS.findIndex(
    (step) => step.status === (isReturned ? "DELIVERED" : currentStatus)
  );

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-slate-200">Status Alur Pengiriman</h3>
        {isReturned && (
          <span className="inline-flex items-center gap-1 bg-orange-500/15 text-orange-400 border border-orange-500/25 px-2 py-0.5 rounded-md text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" /> Retur Sebagian
          </span>
        )}
      </div>

      {/* Horizontal timeline for desktop, vertical for mobile */}
      <div className="hidden md:flex justify-between items-center relative pr-4">
        {/* Progress Bar Line */}
        <div className="absolute top-[18px] left-[5%] right-[5%] h-0.5 bg-slate-800 -z-10" />
        <div
          className="absolute top-[18px] left-[5%] h-0.5 bg-emerald-500 -z-10 transition-all duration-500"
          style={{
            width: `${Math.max(0, (activeIndex / (STEPS.length - 1)) * 90)}%`,
          }}
        />

        {STEPS.map((step, idx) => {
          const StepIcon = step.icon;
          const isCompleted = idx < activeIndex;
          const isActive = idx === activeIndex;
          const isFuture = idx > activeIndex;

          return (
            <div key={step.status} className="flex flex-col items-center text-center w-[16%] relative">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300",
                  isCompleted
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : isActive
                    ? "bg-slate-900 border-emerald-500 text-emerald-400 ring-4 ring-emerald-500/15 animate-pulse"
                    : "bg-slate-950 border-slate-800 text-slate-500"
                )}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
              </div>
              <span
                className={cn(
                  "text-xs font-bold mt-2.5",
                  isActive ? "text-emerald-400" : isCompleted ? "text-slate-200" : "text-slate-500"
                )}
              >
                {step.label}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 max-w-[90px] block line-clamp-2">
                {step.desc}
              </span>
            </div>
          );
        })}
      </div>

      {/* Vertical timeline for mobile */}
      <div className="md:hidden space-y-5 relative pl-4">
        {/* Line */}
        <div className="absolute left-[31px] top-2 bottom-2 w-0.5 bg-slate-800" />
        <div
          className="absolute left-[31px] top-2 w-0.5 bg-emerald-500 transition-all duration-500"
          style={{
            height: `${Math.max(0, (activeIndex / (STEPS.length - 1)) * 100)}%`,
          }}
        />

        {STEPS.map((step, idx) => {
          const StepIcon = step.icon;
          const isCompleted = idx < activeIndex;
          const isActive = idx === activeIndex;

          return (
            <div key={step.status} className="flex gap-4 items-start relative">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center border shrink-0 z-10",
                  isCompleted
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : isActive
                    ? "bg-slate-900 border-emerald-500 text-emerald-400 ring-4 ring-emerald-500/15"
                    : "bg-slate-950 border-slate-800 text-slate-500"
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
              </div>
              <div>
                <span
                  className={cn(
                    "text-xs font-bold block",
                    isActive ? "text-emerald-400" : isCompleted ? "text-slate-200" : "text-slate-500"
                  )}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-slate-500">{step.desc}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
