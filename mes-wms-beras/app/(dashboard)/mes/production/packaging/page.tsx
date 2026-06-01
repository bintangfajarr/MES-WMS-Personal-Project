"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Send, ListChecks, Clock, Package, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";

const inputCls =
  "w-full px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder:text-slate-500";
const labelCls = "text-xs font-semibold text-slate-400 uppercase tracking-wider";

interface PackagingItem {
  productId: string;
  packagingSize: number;
  totalSak: number;
}

interface MaterialUsage {
  materialId: string;
  qty: number;
}

export default function PackagingPage() {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [workOrderId, setWorkOrderId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PackagingItem[]>([
    { productId: "", packagingSize: 5, totalSak: 0 },
  ]);
  const [matUsage, setMatUsage] = useState<MaterialUsage[]>([
    { materialId: "", qty: 0 },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [woRes, prodRes, matRes] = await Promise.all([
          fetch("/api/mes/work-orders?status=IN_PROGRESS"),
          fetch("/api/master-data/products"),
          fetch("/api/master-data/packaging-materials"),
        ]);
        const woData = await woRes.json();
        const prodData = await prodRes.json();
        const matData = await matRes.json();
        if (woData.success) setWorkOrders(woData.data || []);
        if (prodData.success) setProducts(prodData.data || []);
        if (matData.success) setMaterials(matData.data || []);
      } catch {
        toast.error("Gagal memuat data referensi");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Item handlers
  const addItem = () => setItems((prev) => [...prev, { productId: "", packagingSize: 5, totalSak: 0 }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof PackagingItem, value: string | number) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  // Material handlers
  const addMat = () => setMatUsage((prev) => [...prev, { materialId: "", qty: 0 }]);
  const removeMat = (idx: number) => setMatUsage((prev) => prev.filter((_, i) => i !== idx));
  const updateMat = (idx: number, field: keyof MaterialUsage, value: string | number) => {
    setMatUsage((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workOrderId) { toast.error("Pilih Work Order"); return; }
    if (items.some((i) => !i.productId || i.totalSak <= 0)) { toast.error("Lengkapi semua item produk"); return; }

    setSubmitting(true);
    try {
      const payload = {
        workOrderId,
        items: items.map((i) => ({
          productId: i.productId,
          packagingSize: Number(i.packagingSize),
          totalSak: Number(i.totalSak),
        })),
        materials: matUsage
          .filter((m) => m.materialId && m.qty > 0)
          .map((m) => ({ materialId: m.materialId, qty: Number(m.qty) })),
        notes: notes || undefined,
      };

      const res = await fetch("/api/mes/production-logs/packaging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Log pengemasan berhasil disimpan! Work Order selesai.");
        setWorkOrderId("");
        setNotes("");
        setItems([{ productId: "", packagingSize: 5, totalSak: 0 }]);
        setMatUsage([{ materialId: "", qty: 0 }]);
      } else {
        toast.error(data.error || "Gagal menyimpan log pengemasan");
      }
    } catch {
      toast.error("Gagal terhubung ke server");
    } finally {
      setSubmitting(false);
    }
  };

  // Preview calculations
  const totalSak = items.reduce((sum, i) => sum + Number(i.totalSak || 0), 0);
  const totalWeight = items.reduce((sum, i) => sum + Number(i.totalSak || 0) * Number(i.packagingSize || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-sm text-slate-400 mt-3">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Log Pengemasan (Packaging)"
        description="Catat proses pengemasan beras ke dalam karung/plastik. Ini adalah langkah terakhir — WO akan otomatis selesai. Syarat: Step Sortasi & Grading sudah selesai."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Reference */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <ListChecks className="w-4 h-4 text-emerald-400" /> Referensi
          </h3>
          <div className="space-y-1.5">
            <label className={labelCls}>Work Order *</label>
            <select value={workOrderId} onChange={(e) => setWorkOrderId(e.target.value)} required className={inputCls}>
              <option value="">Pilih Work Order</option>
              {workOrders.map((wo) => (
                <option key={wo.id} value={wo.id}>{wo.woNumber} — {wo.paddyLot?.lotNumber || "N/A"}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Items */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" /> Item Produk
            </h3>
            <button type="button" onClick={addItem} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Tambah Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-3 items-end bg-slate-950/30 p-3 rounded-lg border border-slate-800/50">
                <div className="col-span-5 space-y-1">
                  <label className={`${labelCls} text-[10px]`}>Produk *</label>
                  <select value={item.productId} onChange={(e) => updateItem(idx, "productId", e.target.value)} required className={inputCls}>
                    <option value="">Pilih Produk</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3 space-y-1">
                  <label className={`${labelCls} text-[10px]`}>Kemasan (kg) *</label>
                  <select value={item.packagingSize} onChange={(e) => updateItem(idx, "packagingSize", Number(e.target.value))} className={inputCls}>
                    <option value={5}>5 kg</option>
                    <option value={10}>10 kg</option>
                    <option value={25}>25 kg</option>
                    <option value={50}>50 kg</option>
                  </select>
                </div>
                <div className="col-span-3 space-y-1">
                  <label className={`${labelCls} text-[10px]`}>Jumlah Sak *</label>
                  <input type="number" value={item.totalSak || ""} onChange={(e) => updateItem(idx, "totalSak", parseInt(e.target.value) || 0)} min="1" required placeholder="0" className={inputCls} />
                </div>
                <div className="col-span-1 flex justify-center">
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Materials */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" /> Bahan Kemasan yang Digunakan
            </h3>
            <button type="button" onClick={addMat} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Tambah Bahan
            </button>
          </div>

          <div className="space-y-3">
            {matUsage.map((mat, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-3 items-end bg-slate-950/30 p-3 rounded-lg border border-slate-800/50">
                <div className="col-span-7 space-y-1">
                  <label className={`${labelCls} text-[10px]`}>Bahan Kemasan</label>
                  <select value={mat.materialId} onChange={(e) => updateMat(idx, "materialId", e.target.value)} className={inputCls}>
                    <option value="">Pilih Bahan</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>{m.code} — {m.name} (Stok: {m.currentStock})</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-4 space-y-1">
                  <label className={`${labelCls} text-[10px]`}>Jumlah Terpakai</label>
                  <input type="number" value={mat.qty || ""} onChange={(e) => updateMat(idx, "qty", parseInt(e.target.value) || 0)} min="0" placeholder="0" className={inputCls} />
                </div>
                <div className="col-span-1 flex justify-center">
                  {matUsage.length > 1 && (
                    <button type="button" onClick={() => removeMat(idx)} className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Clock className="w-4 h-4 text-emerald-400" /> Catatan
          </h3>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Catatan tambahan..." className={`${inputCls} resize-none`} />
        </div>

        {/* Preview */}
        {totalSak > 0 && (
          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Total Sak</p>
              <p className="text-lg font-bold text-white">{totalSak.toLocaleString("id-ID")} Sak</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Total Berat</p>
              <p className="text-lg font-bold text-emerald-400">{totalWeight.toLocaleString("id-ID")} kg</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Jumlah Jenis</p>
              <p className="text-lg font-bold text-amber-400">{items.filter((i) => i.productId).length} Produk</p>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-white disabled:opacity-50 transition-colors shadow-lg shadow-emerald-500/20">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Simpan & Selesaikan WO
          </button>
        </div>
      </form>
    </div>
  );
}
