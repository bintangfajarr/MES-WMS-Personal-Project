"use client";

import { useState, useEffect } from "react";
import { Package, MapPin, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";

interface InboundFGFormProps {
  batch: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function InboundFGForm({
  batch,
  onSuccess,
  onCancel,
}: InboundFGFormProps) {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  const [form, setForm] = useState({
    batchId: batch.id,
    locationId: "",
    confirmedQty: batch.totalSak,
    condition: "BAIK",
    notes: "",
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await fetch("/api/master-data/locations");
      const json = await res.json();
      if (json.success) {
        // Only show empty FG locations
        setLocations(
          json.data.filter(
            (loc: any) =>
              loc.type === "FINISHED_GOODS" && loc.status === "KOSONG"
          )
        );
      }
    } catch {
      toast.error("Gagal memuat data lokasi");
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.locationId) {
      toast.error("Pilih lokasi gudang terlebih dahulu");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/wms/rice-stock/inbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Batch ${batch.batchNumber} diterima ke gudang`);
        onSuccess();
      } else {
        toast.error(json.error || "Gagal menerima batch");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg mx-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">
                Terima ke Gudang
              </h3>
              <p className="text-xs text-slate-400">
                {batch.batchNumber} — {batch.product?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Batch Info */}
          <div className="bg-slate-800/50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Produk</span>
              <span className="text-white">{batch.product?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Ukuran Kemasan</span>
              <span className="text-white">
                {Number(batch.packagingSize)} kg
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Jumlah Sak (Produksi)</span>
              <span className="text-white font-semibold">
                {batch.totalSak} sak
              </span>
            </div>
          </div>

          {/* Location Select */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              <MapPin className="w-3.5 h-3.5 inline mr-1" />
              Lokasi Gudang
            </label>
            <select
              value={form.locationId}
              onChange={(e) =>
                setForm({ ...form, locationId: e.target.value })
              }
              className="w-full bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2.5 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={loadingLocations}
            >
              <option value="">
                {loadingLocations
                  ? "Memuat lokasi..."
                  : "Pilih lokasi kosong"}
              </option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.code} — {loc.name} (Kapasitas: {loc.capacitySak} sak)
                </option>
              ))}
            </select>
            {locations.length === 0 && !loadingLocations && (
              <p className="text-xs text-yellow-400 mt-1">
                Tidak ada lokasi FG yang kosong saat ini
              </p>
            )}
          </div>

          {/* Confirmed Qty */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Jumlah Konfirmasi (Sak)
            </label>
            <input
              type="number"
              value={form.confirmedQty}
              onChange={(e) =>
                setForm({
                  ...form,
                  confirmedQty: parseInt(e.target.value) || 0,
                })
              }
              min={1}
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2.5 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Kondisi Barang
            </label>
            <select
              value={form.condition}
              onChange={(e) =>
                setForm({ ...form, condition: e.target.value })
              }
              className="w-full bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2.5 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="BAIK">Baik</option>
              <option value="MINOR_DAMAGE">Kerusakan Minor</option>
              <option value="WET">Basah/Lembab</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Catatan (Opsional)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm({ ...form, notes: e.target.value })
              }
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2.5 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              placeholder="Catatan tambahan..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !form.locationId}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {loading ? "Memproses..." : "Terima ke Gudang"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
