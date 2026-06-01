"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-6">
      {/* Error Icon */}
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>

      {/* Message */}
      <div className="text-center space-y-2 max-w-md">
        <h2 className="text-xl font-bold text-white">
          Terjadi Kesalahan
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Maaf, terjadi masalah saat memuat halaman ini. Data Anda aman — silakan
          coba muat ulang.
        </p>
        {error?.message && (
          <p className="text-xs text-slate-600 font-mono mt-2 bg-slate-900 rounded-lg px-3 py-2 border border-slate-800">
            {error.message}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-white transition-all duration-200 shadow-lg shadow-emerald-500/20"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all duration-200"
        >
          <Home className="w-4 h-4" />
          Dashboard
        </Link>
      </div>
    </div>
  );
}
