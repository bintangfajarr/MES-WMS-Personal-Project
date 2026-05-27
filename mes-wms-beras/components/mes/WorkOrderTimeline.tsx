"use client";

import { WorkOrderStep, WorkOrderStepType, WorkOrderStepStatus } from "@/types";
import StatusBadge from "@/components/shared/StatusBadge";
import { Flame, Cog, Sparkles, Filter, Package, Check, Play, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ProductionStepForm from "./ProductionStepForm";

interface WorkOrderTimelineProps {
  steps: WorkOrderStep[];
  workOrderStatus: string;
  workOrderId: string;
  onStepAction?: (stepId: string, action: "start" | "complete") => void;
  onRefresh?: () => void;
}

const STEP_ICONS: Record<WorkOrderStepType, React.ComponentType<any>> = {
  PENGERINGAN: Flame,
  PENGGILINGAN: Cog,
  PENYOSOHAN: Sparkles,
  SORTASI_GRADING: Filter,
  PENGEMASAN: Package,
};

const STEP_NAMES: Record<WorkOrderStepType, string> = {
  PENGERINGAN: "Pengeringan",
  PENGGILINGAN: "Pecah Kulit / Penggilingan",
  PENYOSOHAN: "Penyosohan / Polishing",
  SORTASI_GRADING: "Sortasi & Grading",
  PENGEMASAN: "Pengemasan / Packaging",
};

export default function WorkOrderTimeline({
  steps,
  workOrderStatus,
  workOrderId,
  onStepAction,
  onRefresh,
}: WorkOrderTimelineProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  // Helper to determine if a step can be started
  const canStartStep = (currentStep: WorkOrderStep, index: number): boolean => {
    if (workOrderStatus === "CANCELLED" || workOrderStatus === "SELESAI") return false;
    if (currentStep.status !== "BELUM_MULAI") return false;

    // Check if all previous steps are COMPLETED or SKIPPED
    for (let i = 0; i < index; i++) {
      const prevStep = steps[i];
      if (prevStep.status !== "SELESAI" && prevStep.status !== "SKIPPED") {
        return false;
      }
    }
    return true;
  };

  const toggleExpand = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4">
        <h3 className="text-lg font-semibold text-slate-100">Tahapan Produksi (Work Order Steps)</h3>
        <span className="text-xs text-slate-400">Klik langkah untuk melihat detail</span>
      </div>

      <div className="relative pl-8 md:pl-0 md:grid md:grid-cols-5 md:gap-4 space-y-6 md:space-y-0">
        {/* Connection line for desktop */}
        <div className="hidden md:block absolute top-6 left-8 right-8 h-[2px] bg-slate-850 -z-10" />
        {/* Connection line for mobile */}
        <div className="md:hidden absolute top-0 bottom-0 left-3.5 w-[2px] bg-slate-850 -z-10" />

        {steps.map((step, index) => {
          const Icon = STEP_ICONS[step.stepType];
          const stepName = STEP_NAMES[step.stepType];
          const isSkipped = step.status === "SKIPPED";
          const isCompleted = step.status === "SELESAI";
          const isInProgress = step.status === "IN_PROGRESS";
          const readyToStart = canStartStep(step, index);
          const isExpanded = expandedStep === step.id;

          return (
            <div
              key={step.id}
              className={cn(
                "relative bg-slate-900/30 md:bg-transparent rounded-2xl p-4 md:p-0 border border-slate-800/40 md:border-none transition-all duration-200",
                isInProgress ? "shadow-md shadow-blue-950/20" : ""
              )}
            >
              {/* Step indicator node */}
              <div className="absolute -left-8 md:left-1/2 md:-translate-x-1/2 top-4 md:top-0 z-10">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                    isCompleted
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                      : isSkipped
                      ? "bg-slate-800 border-slate-700 text-slate-500"
                      : isInProgress
                      ? "bg-blue-500/20 border-blue-500 text-blue-400 animate-pulse"
                      : readyToStart
                      ? "bg-slate-900 border-slate-500 text-slate-300 hover:border-emerald-500 hover:text-emerald-400 cursor-pointer"
                      : "bg-slate-950 border-slate-800 text-slate-600"
                  )}
                  onClick={() => readyToStart && onStepAction?.(step.id, "start")}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : isInProgress ? (
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                  ) : (
                    <span className="text-xs font-semibold">{index + 1}</span>
                  )}
                </div>
              </div>

              {/* Step content */}
              <div className="md:pt-10 md:text-center space-y-2">
                <div className="flex items-center md:justify-center gap-2">
                  <Icon
                    className={cn(
                      "w-4 h-4",
                      isCompleted
                        ? "text-emerald-400"
                        : isSkipped
                        ? "text-slate-600"
                        : isInProgress
                        ? "text-blue-400"
                        : "text-slate-500"
                    )}
                  />
                  <h4
                    className={cn(
                      "font-semibold text-sm cursor-pointer hover:text-white transition-colors",
                      isCompleted
                        ? "text-slate-200"
                        : isSkipped
                        ? "text-slate-500 line-through"
                        : isInProgress
                        ? "text-blue-400"
                        : "text-slate-400"
                    )}
                    onClick={() => toggleExpand(step.id)}
                  >
                    {stepName}
                  </h4>
                </div>

                <div className="flex md:justify-center">
                  <StatusBadge status={step.status} type="workOrder" />
                </div>

                {/* Operator Actions */}
                <div className="pt-2 flex md:justify-center">
                  {readyToStart && (
                    <Button
                      size="sm"
                      onClick={() => onStepAction?.(step.id, "start")}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs py-1 px-3 flex items-center gap-1.5 shadow"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Mulai
                    </Button>
                  )}
                  {isInProgress && (
                    <button
                      onClick={() => toggleExpand(step.id)}
                      className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors animate-pulse"
                    >
                      {isExpanded ? "Tutup Input Form" : "Input Progres"}
                    </button>
                  )}
                </div>

                {/* Expanded Details / Logs / Form */}
                {isExpanded && (
                  <div className="text-left mt-4 p-4 bg-slate-950/60 rounded-xl border border-slate-850 space-y-3 text-xs text-slate-400">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                      <span className="font-semibold text-slate-300">{stepName}</span>
                      <StatusBadge status={step.status} type="workOrder" />
                    </div>

                    {isInProgress ? (
                      <ProductionStepForm
                        stepType={step.stepType}
                        workOrderId={workOrderId}
                        onSuccess={() => {
                          onRefresh?.();
                          setExpandedStep(null);
                        }}
                      />
                    ) : (
                      <div className="space-y-2">
                        {step.startedAt && (
                          <p><strong>Dimulai:</strong> {new Date(step.startedAt).toLocaleString()}</p>
                        )}
                        {step.completedAt && (
                          <p><strong>Selesai:</strong> {new Date(step.completedAt).toLocaleString()}</p>
                        )}
                        {step.notes && <p><strong>Catatan:</strong> {step.notes}</p>}
                        {!step.startedAt && !step.completedAt && (
                          <p className="text-slate-550 italic">Belum ada aktivitas tercatat untuk langkah ini.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
