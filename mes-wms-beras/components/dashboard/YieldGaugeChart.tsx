"use client";

import { cn } from "@/lib/utils";

interface YieldGaugeChartProps {
  value: number; // Percentage e.g. 68.5
  title?: string;
  subtitle?: string;
}

export default function YieldGaugeChart({
  value = 0,
  title = "Efisiensi Yield Rata-rata",
  subtitle = "Berdasarkan Work Order yang selesai",
}: YieldGaugeChartProps) {
  // Clamp value between 0 and 100
  const clampedValue = Math.min(Math.max(value, 0), 100);

  // SVG calculations for a semi-circle gauge (180 degrees)
  // Radius = 40, Center = (50, 50)
  // Path starts at (10, 50) and arcs to (90, 50)
  const radius = 40;
  const strokeWidth = 8;
  const arcLength = Math.PI * radius; // 125.66
  
  // Calculate dash offset based on percentage
  const strokeDashoffset = arcLength - (clampedValue / 100) * arcLength;

  // Determine feedback categories
  const getRating = (val: number) => {
    if (val < 60) return { label: "RENDAH", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" };
    if (val < 70) return { label: "STANDAR", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" };
    return { label: "SANGAT BAIK", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" };
  };

  const rating = getRating(clampedValue);

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between h-full space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-200">{title}</h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>

      <div className="relative flex flex-col items-center justify-center flex-grow py-2">
        {/* SVG Gauge */}
        <svg viewBox="0 0 100 55" className="w-full max-w-[220px] overflow-visible">
          <defs>
            {/* Emerald Gradient */}
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Background Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Foreground Colored Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Dynamic Display inside the Gauge */}
        <div className="absolute bottom-4 flex flex-col items-center">
          <span className="text-3xl font-extrabold text-white tracking-tight">
            {clampedValue.toFixed(1)}%
          </span>
          <span
            className={cn(
              "mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border tracking-wider",
              rating.bg,
              rating.color
            )}
          >
            {rating.label}
          </span>
        </div>
      </div>

      <div className="flex justify-between text-[10px] text-slate-500 font-semibold px-4 pt-2 border-t border-slate-800/50">
        <span>MIN: 0%</span>
        <span>TARGET: &gt;70%</span>
        <span>MAX: 100%</span>
      </div>
    </div>
  );
}
