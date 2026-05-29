"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StockSummaryCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: ReactNode;
  theme?: "emerald" | "blue" | "amber" | "rose" | "indigo" | "slate";
}

export default function StockSummaryCard({
  title,
  value,
  subtext,
  icon,
  theme = "emerald",
}: StockSummaryCardProps) {
  const themes = {
    emerald: {
      bg: "bg-emerald-500/5 hover:border-emerald-500/30",
      iconBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
      glow: "bg-emerald-500/5",
    },
    blue: {
      bg: "bg-blue-500/5 hover:border-blue-500/30",
      iconBg: "bg-blue-500/10 border-blue-500/20 text-blue-400",
      glow: "bg-blue-500/5",
    },
    amber: {
      bg: "bg-amber-500/5 hover:border-amber-500/30",
      iconBg: "bg-amber-500/10 border-amber-500/20 text-amber-400",
      glow: "bg-amber-500/5",
    },
    rose: {
      bg: "bg-rose-500/5 hover:border-rose-500/30",
      iconBg: "bg-rose-500/10 border-rose-500/20 text-rose-400",
      glow: "bg-rose-500/5",
    },
    indigo: {
      bg: "bg-indigo-500/5 hover:border-indigo-500/30",
      iconBg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
      glow: "bg-indigo-500/5",
    },
    slate: {
      bg: "bg-slate-500/5 hover:border-slate-500/30",
      iconBg: "bg-slate-500/10 border-slate-500/20 text-slate-400",
      glow: "bg-slate-500/5",
    },
  };

  const currentTheme = themes[theme] || themes.slate;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-slate-900/40 border border-slate-800 rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-950/50",
        currentTheme.bg
      )}
    >
      {/* Decorative Glow */}
      <div
        className={cn(
          "absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -z-10",
          currentTheme.glow
        )}
      />

      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            {value}
          </h3>
          {subtext && <p className="text-xs text-slate-400 font-medium">{subtext}</p>}
        </div>

        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center border shrink-0",
            currentTheme.iconBg
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
