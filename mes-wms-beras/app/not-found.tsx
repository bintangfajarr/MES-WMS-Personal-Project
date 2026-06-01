import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        {/* 404 Visual */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="text-8xl font-black text-slate-800/50 select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-500/5">
                <FileQuestion className="w-8 h-8 text-amber-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
            Halaman yang Anda cari tidak ada atau telah dipindahkan. Silakan
            periksa URL atau kembali ke Dashboard.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-white transition-all duration-200 shadow-lg shadow-emerald-500/20"
          >
            <Home className="w-4 h-4" />
            Ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
