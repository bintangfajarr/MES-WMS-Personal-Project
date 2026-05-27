"use client";

import { X, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: string;
  severity: string;
  message: string;
}

interface AlertBannerProps {
  alerts: Alert[];
  onDismiss?: (id: string) => void;
}

const severityConfig: Record<
  string,
  { bg: string; border: string; text: string; icon: React.ReactNode }
> = {
  CRITICAL: {
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-400",
    icon: <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />,
  },
  WARNING: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-400",
    icon: <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />,
  },
  INFO: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
    icon: <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />,
  },
};

export default function AlertBanner({ alerts, onDismiss }: AlertBannerProps) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {alerts.map((alert) => {
        const config =
          severityConfig[alert.severity] || severityConfig.WARNING;
        return (
          <div
            key={alert.id}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg border",
              config.bg,
              config.border
            )}
          >
            {config.icon}
            <span className={cn("text-sm flex-1", config.text)}>
              {alert.message}
            </span>
            {onDismiss && (
              <button
                onClick={() => onDismiss(alert.id)}
                className="p-1 rounded hover:bg-white/5 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
