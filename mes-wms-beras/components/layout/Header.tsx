"use client";

import { useSession, signOut } from "next-auth/react";
import { Menu, Bell, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onToggleSidebar: () => void;
  alertCount?: number;
}

export default function Header({ onToggleSidebar, alertCount = 0 }: HeaderProps) {
  const { data: session } = useSession();

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

  return (
    <header className="sticky top-0 z-30 h-14 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-4 lg:px-6">
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
        {/* Alert Bell */}
        <button
          className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4.5 h-4.5" />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 flex items-center justify-center text-[9px] font-bold text-white bg-red-500 rounded-full ring-2 ring-slate-900">
              {alertCount > 9 ? "9+" : alertCount}
            </span>
          )}
        </button>

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
