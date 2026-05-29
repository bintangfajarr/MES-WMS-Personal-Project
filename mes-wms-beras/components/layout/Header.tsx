"use client";

import { useSession, signOut } from "next-auth/react";
import { Menu, Bell, LogOut, AlertTriangle, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { useAlerts } from "@/hooks/useAlerts";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { data: session } = useSession();
  const { alerts, dismissAlert, triggerAlertCheck, loading } = useAlerts();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-500/15 text-purple-400 border-purple-500/25",
    OPR_PROD: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    OPR_WHS: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    DRIVER: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
  };

  const roleLabels: Record<string, string> = {
    ADMIN: "Admin",
    OPR_PROD: "Production",
    OPR_WHS: "Warehouse",
    DRIVER: "Driver",
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeAlertsCount = alerts.length;

  return (
    <header className="sticky top-0 z-35 h-14 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-4 lg:px-6">
      {/* Left: Hamburger + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Right: Alert + User Info + Logout */}
      <div className="flex items-center gap-3">
        {/* Alert Bell & Notification Center Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={cn(
              "relative p-2 rounded-lg text-slate-400 hover:text-white transition-colors",
              dropdownOpen ? "bg-slate-850 text-white" : "hover:bg-slate-800"
            )}
            aria-label="Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            {activeAlertsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 flex items-center justify-center text-[9px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-slate-900 animate-pulse">
                {activeAlertsCount > 9 ? "9+" : activeAlertsCount}
              </span>
            )}
          </button>

          {/* Sleek Notification Dropdown Panel */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Header */}
              <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200 text-sm">Notifikasi</span>
                  {activeAlertsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold">
                      {activeAlertsCount} Baru
                    </span>
                  )}
                </div>
                <button
                  onClick={() => triggerAlertCheck()}
                  className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md transition-all uppercase tracking-wider"
                  title="Jalankan Pengecekan Stok & Status"
                >
                  <RefreshCw size={10} className={loading ? "animate-spin" : ""} />
                  Cek Sistem
                </button>
              </div>

              {/* Alerts List */}
              <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-850">
                {alerts.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-slate-850/50 flex items-center justify-center">
                      <Bell size={18} className="text-slate-600" />
                    </div>
                    <p className="text-xs font-semibold">Semua sistem aman!</p>
                    <p className="text-[10px] text-slate-600">Tidak ada notifikasi aktif saat ini.</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="px-4 py-3.5 hover:bg-slate-850/40 transition-colors flex items-start gap-3 relative group"
                    >
                      <div className="w-6 h-6 rounded-md bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      </div>
                      <div className="flex-grow pr-6 space-y-1">
                        <p className="text-xs text-slate-300 leading-normal font-medium">
                          {alert.message}
                        </p>
                        <span className="block text-[9px] text-slate-500 font-mono">
                          {new Date(alert.createdAt).toLocaleString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="absolute top-3 right-3 p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Tandai Selesai"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-800" />

        {/* User Info */}
        {session?.user && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-white leading-tight">
                {session.user.name}
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded border mt-0.5",
                  roleColors[session.user.role] || "bg-slate-800 text-slate-400"
                )}
              >
                {roleLabels[session.user.role] || session.user.role}
              </span>
            </div>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm">
              <span className="text-xs font-bold text-white">
                {session.user.name?.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
