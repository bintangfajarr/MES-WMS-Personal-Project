"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save, AlertTriangle } from "lucide-react";

interface PackagingFormProps {
  workOrderId: string;
  onSuccess: () => void;
}

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface Material {
  id: string;
  name: string;
  code: string;
  currentStock: number;
}

export default function PackagingForm({ workOrderId, onSuccess }: PackagingFormProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [items, setItems] = useState<Array<{ productId: string; packagingSize: number; totalSak: number }>>([
    { productId: "", packagingSize: 5, totalSak: 100 },
  ]);

  const [selectedMaterials, setSelectedMaterials] = useState<Array<{ materialId: string; qty: number }>>([
    { materialId: "", qty: 100 },
  ]);

  const [notes, setNotes] = useState("");
  const [paddyNetWeight, setPaddyNetWeight] = useState(0);

  // Fetch options and initial values
  useEffect(() => {
    async function initForm() {
      try {
        const [pRes, mRes, wRes] = await Promise.all([
          fetch("/api/master-data/products"),
          fetch("/api/master-data/packaging-materials"),
          fetch(`/api/mes/work-orders/${workOrderId}`),
        ]);
        const pJson = await pRes.json();
        const mJson = await mRes.json();
        const wJson = await wRes.json();

        if (pJson.success) setProducts(pJson.data);
        if (mJson.success) setMaterials(mJson.data);
        if (wJson.success && wJson.data) {
          setPaddyNetWeight(Number(wJson.data.paddyLot?.netWeight || 0));
        }
      } catch (err) {
        console.error(err);
        toast.error("Gagal memuat opsi form");
      } finally {
        setIsLoading(false);
      }
    }
    initForm();
  }, [workOrderId]);

  const handleAddItem = () => {
    setItems([...items, { productId: "", packagingSize: 5, totalSak: 100 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleAddMaterial = () => {
    setSelectedMaterials([...selectedMaterials, { materialId: "", qty: 100 }]);
  };

  const handleRemoveMaterial = (index: number) => {
    if (selectedMaterials.length === 1) return;
    setSelectedMaterials(selectedMaterials.filter((_, i) => i !== index));
  };

  const handleMaterialChange = (index: number, field: string, value: any) => {
    const updated = [...selectedMaterials];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedMaterials(updated);
  };

  const calculateTotalWeight = () => {
    return items.reduce((sum, item) => sum + Number(item.totalSak || 0) * Number(item.packagingSize || 0), 0);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (items.some((it) => !it.productId || it.totalSak <= 0 || it.packagingSize <= 0)) {
      toast.error("Lengkapi seluruh baris produk kemasan dengan jumlah positif!");
      return;
    }

    if (selectedMaterials.some((mat) => !mat.materialId || mat.qty <= 0)) {
      toast.error("Lengkapi seluruh konsumsi material kemasan!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/mes/production-logs/packaging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workOrderId,
          items,
          materials: selectedMaterials,
          notes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Catatan Pengemasan & Kelulusan WO berhasil disimpan!");
        onSuccess();
      } else {
        toast.error(json.error || "Gagal menyimpan log");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalWeightKg = calculateTotalWeight();
  const overallYield = paddyNetWeight ? (totalWeightKg / paddyNetWeight) * 100 : 0;
  const isYieldLow = overallYield > 0 && overallYield < 58;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 justify-center text-xs text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
        Memuat data pendukung kemasan...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmitForm} className="space-y-6 text-slate-350 text-xs">
      {/* Products list section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <Label className="text-slate-300 font-semibold">Produk Beras Hasil Kemasan</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddItem}
            className="border-slate-800 hover:bg-slate-800/50 text-slate-400 hover:text-white rounded-lg h-7 px-2.5 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Produk
          </Button>
        </div>

        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end p-3 bg-slate-950/20 border border-slate-900 rounded-xl relative">
            <div>
              <Label className="text-[10px] text-slate-500">Pilih Varian Beras</Label>
              <select
                value={item.productId}
                onChange={(e) => handleItemChange(index, "productId", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="">-- Pilih --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-[10px] text-slate-500">Ukuran Kemasan (kg)</Label>
              <Input
                type="number"
                value={item.packagingSize}
                onChange={(e) => handleItemChange(index, "packagingSize", Number(e.target.value))}
                className="bg-slate-950 border-slate-800 text-slate-100 h-8.5 rounded-lg"
              />
            </div>

            <div>
              <Label className="text-[10px] text-slate-500">Jumlah Karung / Sacks (Sak)</Label>
              <Input
                type="number"
                value={item.totalSak}
                onChange={(e) => handleItemChange(index, "totalSak", Number(e.target.value))}
                className="bg-slate-950 border-slate-800 text-slate-100 h-8.5 rounded-lg"
              />
            </div>

            <div className="flex items-center justify-between pb-1">
              <span className="text-[10px] text-slate-500">
                Subtotal: {(item.totalSak * item.packagingSize).toLocaleString()} kg
              </span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="text-red-500 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Materials usage section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <Label className="text-slate-300 font-semibold">Bahan Pembungkus Digunakan (Packaging Consumption)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddMaterial}
            className="border-slate-800 hover:bg-slate-800/50 text-slate-400 hover:text-white rounded-lg h-7 px-2.5 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Bahan
          </Button>
        </div>

        {selectedMaterials.map((mat, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end p-3 bg-slate-950/20 border border-slate-900 rounded-xl">
            <div>
              <Label className="text-[10px] text-slate-500">Pilih Material Karung / Plastik</Label>
              <select
                value={mat.materialId}
                onChange={(e) => handleMaterialChange(index, "materialId", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="">-- Pilih Material --</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.code}) - Stok: {m.currentStock}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-[10px] text-slate-500">Jumlah Digunakan (pcs/roll)</Label>
              <Input
                type="number"
                value={mat.qty}
                onChange={(e) => handleMaterialChange(index, "qty", Number(e.target.value))}
                className="bg-slate-950 border-slate-800 text-slate-100 h-8.5 rounded-lg"
              />
            </div>

            <div className="flex items-center justify-end pb-1">
              {selectedMaterials.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveMaterial(index)}
                  className="text-red-500 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary section */}
      <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-850 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Total Hasil Kemasan</span>
          <span className="font-bold text-slate-200">{totalWeightKg.toLocaleString()} kg</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Rasio Rendemen Akhir (Overall Yield)</span>
          <span className={`font-bold ${isYieldLow ? "text-red-400 animate-pulse" : "text-emerald-400"}`}>
            {overallYield.toFixed(2)}%
          </span>
        </div>
        {isYieldLow && (
          <div className="flex items-center gap-1.5 text-[10px] text-red-400 bg-red-950/10 border border-red-950/20 p-2.5 rounded-lg mt-2">
            <AlertTriangle className="w-4 h-4 text-red-550 flex-shrink-0" />
            <span>Peringatan: Rendemen keseluruhan (overall yield) di bawah batas standar 58%. Sistem akan menerbitkan peringatan sistem.</span>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Catatan & Masukan Kualitas Akhir</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 rounded-xl text-xs resize-none"
          placeholder="Tuliskan catatan opsional tentang kondisi kemasan atau batch..."
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs py-2.5 flex items-center justify-center gap-1.5 shadow"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Menyimpan & Menyelesaikan Work Order...
          </>
        ) : (
          <>
            <Save className="w-3.5 h-3.5" />
            Selesaikan Pengemasan & Selesaikan WO
          </>
        )}
      </Button>
    </form>
  );
}
