"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import MachineStatusCard from "@/components/mes/MachineStatusCard";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import { Cpu, AlertTriangle, ShieldCheck, History, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/date";

interface Machine {
  id: string;
  code: string;
  name: string;
  type: string;
  capacityKgPerBatch: any;
  capacityKgPerHour: any;
  status: string;
}

interface DowntimeLog {
  id: string;
  machine: {
    name: string;
    code: string;
  };
  reason: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  notes: string | null;
}

export default function MachinesDashboardPage() {
  const [machines, setMachines] = useState<any[]>([]);
  const [recentDowntimes, setRecentDowntimes] = useState<DowntimeLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [mRes, dRes] = await Promise.all([
        fetch("/api/master-data/machines"),
        fetch("/api/mes/machine-logs/downtime/recent"), // Let's support a recent route or mock it safely
      ]);
      
      const mJson = await mRes.json();
      if (mJson.success) setMachines(mJson.data);

      // We can fallback to fetching machine logs individually if a global recent route isn't active
      if (dRes.status === 200) {
        const dJson = await dRes.json();
        if (dJson.success) setRecentDowntimes(dJson.data);
      } else {
        // Safe fallback - fetch from general machines log endpoint or mock empty
        setRecentDowntimes([]);
      }
    } catch (e) {
      console.error("Failed to fetch machine page data", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = {
    total: machines.length,
    active: machines.filter((m) => m.status === "ACTIVE").length,
    breakdown: machines.filter((m) => m.status === "BREAKDOWN").length,
    maintenance: machines.filter((m) => m.status === "MAINTENANCE").length,
  };

  const columns = [
    {
      header: "Mesin",
      cell: (row: DowntimeLog) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-200">{row.machine?.name}</span>
          <span className="text-[10px] font-mono text-slate-550">{row.machine?.code}</span>
        </div>
      ),
    },
    {
      header: "Alasan",
      cell: (row: DowntimeLog) => <StatusBadge status={row.reason} type="machine" />,
    },
    {
      header: "Mulai",
      cell: (row: DowntimeLog) => (
        <span className="text-xs text-slate-400">{new Date(row.startTime).toLocaleString()}</span>
      ),
    },
    {
      header: "Selesai / Durasi",
      cell: (row: DowntimeLog) => (
        <span className="text-xs text-slate-400">
          {row.endTime ? (
            <span className="text-emerald-400 font-medium">
              Selesai ({row.duration} menit)
            </span>
          ) : (
            <span className="text-red-400 font-medium animate-pulse">
              Aktif
            </span>
          )}
        </span>
      ),
    },
    {
      header: "Keterangan",
      cell: (row: DowntimeLog) => (
        <span className="text-xs text-slate-400 truncate max-w-xs block">
          {row.notes || "-"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Status Mesin Produksi (MES)"
        description="Monitor status operasional mesin pabrik giling dan catat insiden downtime"
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-550 block font-semibold uppercase tracking-wider">Total Mesin</span>
            <h3 className="text-xl font-bold text-white">{stats.total}</h3>
          </div>
          <Cpu className="w-8 h-8 text-slate-700" />
        </div>

        <div className="bg-emerald-950/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] text-emerald-400/70 block font-semibold uppercase tracking-wider">Aktif (Running)</span>
            <h3 className="text-xl font-bold text-emerald-400">{stats.active}</h3>
          </div>
          <ShieldCheck className="w-8 h-8 text-emerald-500/20" />
        </div>

        <div className="bg-red-950/10 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] text-red-400/70 block font-semibold uppercase tracking-wider">Breakdown / Rusak</span>
            <h3 className="text-xl font-bold text-red-400">{stats.breakdown}</h3>
          </div>
          <AlertTriangle className="w-8 h-8 text-red-500/20" />
        </div>

        <div className="bg-yellow-950/10 border border-yellow-500/20 rounded-2xl p-4 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] text-yellow-400/70 block font-semibold uppercase tracking-wider">Maintenance</span>
            <h3 className="text-xl font-bold text-yellow-400">{stats.maintenance}</h3>
          </div>
          <Clock className="w-8 h-8 text-yellow-500/20" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Machine Cards Grid */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 border-b border-slate-850 pb-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            Kartu Operasional Mesin
          </h3>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-36 bg-slate-900/50 border border-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : machines.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/20 border border-slate-800 rounded-2xl text-slate-500">
              Tidak ada data mesin ditemukan.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {machines.map((m) => (
                <MachineStatusCard key={m.id} machine={m} onRefresh={fetchData} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Downtime Activity */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 border-b border-slate-850 pb-2">
            <History className="w-4 h-4 text-emerald-400" />
            Insiden Downtime Terbaru
          </h3>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-900/50 border border-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentDowntimes.length === 0 ? (
            <div className="p-6 text-center bg-slate-900/20 border border-slate-800 rounded-2xl text-slate-500 text-xs italic">
              Belum ada riwayat insiden downtime terekam.
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {recentDowntimes.map((log) => (
                <div key={log.id} className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 text-xs">{log.machine?.name}</span>
                    <StatusBadge status={log.reason} type="machine" />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Mulai: {new Date(log.startTime).toLocaleString()}
                  </p>
                  {log.endTime ? (
                    <p className="text-[10px] text-emerald-400">
                      Selesai: {new Date(log.endTime).toLocaleString()} ({log.duration} menit)
                    </p>
                  ) : (
                    <p className="text-[10px] text-red-400 animate-pulse font-medium">
                      Masih Berjalan (Sedang downtime)
                    </p>
                  )}
                  {log.notes && (
                    <p className="text-[10px] bg-slate-950 p-2 rounded-lg text-slate-400 mt-1 border border-slate-900">
                      {log.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
