"use client";

import { format } from "date-fns";

interface BatchSuggestion {
  batchId: string;
  batchNumber: string;
  availableSak: number;
  suggestedSak: number;
  locationCode: string;
  expiryDate: string;
}

interface FIFOBatchSelectorProps {
  batches: BatchSuggestion[];
  onUpdateQty: (batchId: string, newQty: number) => void;
}

export default function FIFOBatchSelector({ batches, onUpdateQty }: FIFOBatchSelectorProps) {
  if (!batches || batches.length === 0) {
    return (
      <div className="text-center py-4 bg-slate-950/20 border border-slate-800 rounded-lg text-slate-500 text-xs">
        Tidak ada batch yang disarankan. Silakan periksa stok produk di gudang.
      </div>
    );
  }

  return (
    <div className="border border-slate-800/80 rounded-lg overflow-hidden text-xs bg-slate-900/20">
      <div className="grid grid-cols-5 bg-slate-850 p-2 text-slate-400 font-medium border-b border-slate-800">
        <div>Nomor Batch</div>
        <div>Lokasi</div>
        <div>Tersedia (Sistem)</div>
        <div>Tgl Kadaluarsa</div>
        <div className="text-right">Kirim (Sak)</div>
      </div>

      {batches.map((batch) => (
        <div
          key={batch.batchId}
          className="grid grid-cols-5 p-2 items-center text-slate-300 border-b border-slate-800/50 last:border-none"
        >
          <div className="font-mono text-emerald-400 font-medium">{batch.batchNumber}</div>
          <div className="text-slate-400">{batch.locationCode}</div>
          <div>{batch.availableSak} sak</div>
          <div className="text-slate-400">
            {format(new Date(batch.expiryDate), "dd/MM/yyyy")}
          </div>
          <div className="flex justify-end">
            <input
              type="number"
              min="0"
              max={batch.availableSak}
              value={batch.suggestedSak}
              onChange={(e) => onUpdateQty(batch.batchId, parseInt(e.target.value, 10) || 0)}
              className="w-16 px-1.5 py-0.5 rounded text-right bg-slate-800 border border-slate-700 text-white font-bold focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
