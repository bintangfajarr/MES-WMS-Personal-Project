"use client";

import { useSession } from "next-auth/react";
import {
  Wheat,
  Package,
  ClipboardList,
  Truck,
  AlertTriangle,
  TrendingUp,
  Factory,
  Boxes,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <LoadingSkeleton variant="card" rows={4} />;
  }

  // Placeholder stats — will be replaced with real data in Phase 11
  const stats = [
    {
      label: "Paddy Stock (RM)",
      value: "12,840 kg",
      icon: <Wheat className="w-5 h-5" />,
      color: "from-amber-400 to-amber-600",
      shadowColor: "shadow-amber-500/20",
    },
    {
      label: "Rice Stock (FG)",
      value: "8,450 sak",
      icon: <Package className="w-5 h-5" />,
      color: "from-emerald-400 to-emerald-600",
      shadowColor: "shadow-emerald-500/20",
    },
    {
      label: "Active Work Orders",
      value: "2",
      icon: <Factory className="w-5 h-5" />,
      color: "from-blue-400 to-blue-600",
      shadowColor: "shadow-blue-500/20",
    },
    {
      label: "Pending Deliveries",
      value: "0",
      icon: <Truck className="w-5 h-5" />,
      color: "from-purple-400 to-purple-600",
      shadowColor: "shadow-purple-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${session?.user?.name || "User"}. Here's today's overview.`}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {stat.label}
              </span>
              <div
                className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.color} ${stat.shadowColor} shadow-lg flex items-center justify-center text-white`}
              >
                {stat.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-white tracking-tight">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Placeholder sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Production Chart Placeholder */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Production (7 days)
          </h3>
          <div className="h-48 flex items-center justify-center text-slate-600 text-sm">
            Chart will be implemented in Phase 11
          </div>
        </div>

        {/* Active Work Orders Placeholder */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-400" />
            Active Work Orders
          </h3>
          <div className="h-48 flex items-center justify-center text-slate-600 text-sm">
            Work order list will be implemented in Phase 11
          </div>
        </div>
      </div>

      {/* Alerts Placeholder */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Recent Alerts
        </h3>
        <div className="h-24 flex items-center justify-center text-slate-600 text-sm">
          Alerts will be implemented in Phase 11
        </div>
      </div>
    </div>
  );
}
