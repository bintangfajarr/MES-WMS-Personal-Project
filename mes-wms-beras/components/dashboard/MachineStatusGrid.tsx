"use client";

import { Activity, AlertTriangle, Settings, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Machine {
  id: string;
  code: string;
  name: string;
  type: string;
  capacityKgPerBatch: any;
  capacityKgPerHour: any;
  status: "ACTIVE" | "MAINTENANCE" | "INACTIVE" | "BREAKDOWN";
}

interface MachineStatusGridProps {
  machines: Machine[];
}

export default function MachineStatusGrid({ machines }: MachineStatusGridProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return {
          label: "AKTIF",
          color: "text-emerald-400",
          bg: "bg-emerald-500/10 border-emerald-500/20",
          dot: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
          icon: <Activity className="w-3.5 h-3.5 text-emerald-400" />,
        };
      case "MAINTENANCE":
        return {
          label: "MAINTENANCE",
          color: "text-amber-400",
          bg: "bg-amber-500/10 border-amber-500/20",
          dot: "bg-amber-400 shadow-[0_0_8px_#fbbf24]",
          icon: <Settings className="w-3.5 h-3.5 text-amber-400 animate-spin" />,
        };
      case "BREAKDOWN":
        return {
          label: "BREAKDOWN",
          color: "text-rose-400",
          bg: "bg-rose-500/10 border-rose-500/20",
          dot: "bg-rose-400 shadow-[0_0_8px_#f87171] animate-ping",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />,
        };
      default:
        return {
          label: "NONAKTIF",
          color: "text-slate-400",
          bg: "bg-slate-500/10 border-slate-500/20",
          dot: "bg-slate-500",
          icon: <EyeOff className="w-3.5 h-3.5 text-slate-400" />,
        };
    }
  };

  const getMachineTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      DRYER: "Dryer (Pengering)",
      HUSKER: "Husker (Pecah Kulit)",
      POLISHER: "Polisher (Penyosoh)",
      COLOR_SORTER: "Color Sorter",
      CLASSIFIER: "Classifier",
      PACKER: "Packer (Pengemas)",
    };
    return types[type] || type;
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-200">Status Mesin Pengolahan</h3>
        <p className="text-xs text-slate-500">Kondisi real-time mesin dan kapasitas pengolahan saat ini</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {machines.length === 0 ? (
          <div className="col-span-full py-6 text-center text-slate-500 text-xs">
            Tidak ada mesin terdaftar.
          </div>
        ) : (
          machines.map((machine) => {
            const config = getStatusConfig(machine.status);
            const capacityVal = machine.capacityKgPerBatch
              ? `${Number(machine.capacityKgPerBatch).toLocaleString("id-ID")} kg/batch`
              : machine.capacityKgPerHour
              ? `${Number(machine.capacityKgPerHour).toLocaleString("id-ID")} kg/jam`
              : "N/A";

            return (
              <div
                key={machine.id}
                className={cn(
                  "relative bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between gap-3 transition-all duration-300 hover:border-slate-700/60 hover:-translate-y-0.5",
                  machine.status === "BREAKDOWN" && "border-rose-950/50 bg-rose-950/5"
                )}
              >
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[10px] text-slate-500 font-bold tracking-wider">
                      {machine.code}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold border tracking-wider",
                        config.bg,
                        config.color
                      )}
                    >
                      {config.icon}
                      {config.label}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 tracking-tight leading-tight pt-1">
                    {machine.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium leading-none">
                    {getMachineTypeLabel(machine.type)}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-900/60 flex justify-between items-center text-[10px]">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider">Kapasitas</span>
                  <span className="font-mono font-bold text-slate-300">{capacityVal}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
