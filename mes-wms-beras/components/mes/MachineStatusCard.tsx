"use client";

import { useState } from "react";
import { Machine, MachineStatus, DowntimeReason } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/shared/StatusBadge";
import { MACHINE_TYPE_LABEL } from "@/lib/constants/status";
import { Cpu, AlertTriangle, Play, Pause, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MachineStatusCardProps {
  machine: Machine;
  onRefresh?: () => void;
}

export default function MachineStatusCard({ machine, onRefresh }: MachineStatusCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState<DowntimeReason>("BREAKDOWN");
  const [notes, setNotes] = useState("");

  const handleRecordDowntime = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/mes/machine-logs/downtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machineId: machine.id,
          reason,
          notes,
          startTime: new Date(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Mesin ${machine.name} berhasil dicatat downtime (${reason})`);
        setIsOpen(false);
        setNotes("");
        onRefresh?.();
      } else {
        toast.error(json.error || "Gagal mencatat downtime");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveDowntime = async () => {
    setIsSubmitting(true);
    try {
      // Typically resolves by updating status back to ACTIVE
      const res = await fetch(`/api/master-data/machines/${machine.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Mesin ${machine.name} kembali aktif`);
        onRefresh?.();
      } else {
        toast.error(json.error || "Gagal mengaktifkan mesin");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: MachineStatus) => {
    switch (status) {
      case "ACTIVE":
        return "border-emerald-500/30 bg-emerald-950/10 hover:border-emerald-500/50";
      case "MAINTENANCE":
        return "border-yellow-500/30 bg-yellow-950/10 hover:border-yellow-500/50";
      case "BREAKDOWN":
        return "border-red-500/30 bg-red-950/10 hover:border-red-500/50";
      default:
        return "border-slate-800 bg-slate-900/30 hover:border-slate-700";
    }
  };

  const isDowntime = machine.status === "BREAKDOWN" || machine.status === "MAINTENANCE";

  return (
    <>
      <Card
        onClick={() => !isDowntime && setIsOpen(true)}
        className={`group transition-all duration-300 border cursor-pointer ${getStatusColor(
          machine.status as MachineStatus
        )}`}
      >
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-400 group-hover:text-emerald-400 transition-colors">
              <Cpu className="w-5 h-5" />
            </div>
            <StatusBadge status={machine.status} type="machine" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-100">{machine.name}</CardTitle>
              <span className="text-[10px] font-mono text-slate-500">{machine.code}</span>
            </div>
            <p className="text-xs text-slate-400">
              Tipe: {MACHINE_TYPE_LABEL[machine.type] || machine.type}
            </p>
          </div>

          {machine.capacityKgPerBatch && (
            <p className="text-xs text-slate-500">
              Kapasitas: {Number(machine.capacityKgPerBatch).toLocaleString()} kg/batch
            </p>
          )}
          {machine.capacityKgPerHour && (
            <p className="text-xs text-slate-500">
              Kapasitas: {Number(machine.capacityKgPerHour).toLocaleString()} kg/jam
            </p>
          )}

          {isDowntime ? (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleResolveDowntime();
              }}
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs py-1.5 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              Aktifkan Mesin
            </Button>
          ) : (
            <div className="text-[10px] text-slate-500 text-center italic opacity-0 group-hover:opacity-100 transition-opacity">
              Klik untuk catat downtime / breakdown
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Downtime Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Catat Downtime - {machine.name}
            </DialogTitle>
            <DialogDescription className="text-slate-450">
              Gunakan formulir ini untuk mencatat masalah atau pemeliharaan berkala pada mesin. Status mesin akan otomatis berubah.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-slate-350">Alasan Downtime</Label>
              <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value as DowntimeReason)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 transition-colors"
              >
                <option value="BREAKDOWN">Kerusakan / Breakdown</option>
                <option value="MAINTENANCE">Pemeliharaan / Maintenance</option>
                <option value="SETUP">Pengaturan / Setup</option>
                <option value="LAINNYA">Lain-lain</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-slate-350">Catatan Detail Kendala</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Masukkan keterangan kerusakan atau pemeliharaan..."
                className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 rounded-xl resize-none"
              />
            </div>
          </div>

          <DialogFooter className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="border-slate-800 hover:bg-slate-800/50 text-slate-400 hover:text-white rounded-xl"
            >
              Batal
            </Button>
            <Button
              onClick={handleRecordDowntime}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mencatat...
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  Hentikan Mesin
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
