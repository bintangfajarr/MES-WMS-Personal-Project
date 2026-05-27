"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Wheat,
  Truck,
  Factory,
  ClipboardList,
  Settings,
  ChevronDown,
  ChevronRight,
  Boxes,
  Warehouse,
  FileText,
  CheckCircle,
  BarChart3,
  Users,
  MapPin,
  Box,
  Cog,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: { label: string; href: string }[];
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    label: "WMS",
    icon: <Package className="w-4 h-4" />,
    children: [
      { label: "Paddy Warehouse (RM)", href: "/wms/paddy-warehouse" },
      { label: "Paddy Receiving", href: "/wms/paddy-warehouse/incoming" },
      { label: "Rice Warehouse (FG)", href: "/wms/rice-warehouse" },
      { label: "Rice Inbound", href: "/wms/rice-warehouse/inbound" },
      { label: "Stock Opname", href: "/wms/rice-warehouse/stock-opname" },
      { label: "Delivery Orders", href: "/wms/delivery" },
    ],
  },
  {
    label: "MES",
    icon: <Factory className="w-4 h-4" />,
    children: [
      { label: "Work Orders", href: "/mes/work-orders" },
      { label: "Drying", href: "/mes/production/drying" },
      { label: "Husking", href: "/mes/production/husking" },
      { label: "Polishing", href: "/mes/production/polishing" },
      { label: "Sorting & Grading", href: "/mes/production/sorting" },
      { label: "Packaging", href: "/mes/production/packaging" },
      { label: "Machine Status", href: "/mes/machines" },
    ],
  },
  {
    label: "QC",
    icon: <CheckCircle className="w-4 h-4" />,
    children: [
      { label: "Incoming QC", href: "/qc/incoming" },
      { label: "Production QC", href: "/qc/production" },
    ],
  },
  {
    label: "Reports",
    icon: <BarChart3 className="w-4 h-4" />,
    children: [
      { label: "Production & Yield", href: "/reports/yield" },
      { label: "Inventory", href: "/reports/inventory" },
      { label: "Delivery", href: "/reports/delivery" },
    ],
  },
  {
    label: "Master Data",
    icon: <Settings className="w-4 h-4" />,
    adminOnly: true,
    children: [
      { label: "Products", href: "/master-data/products" },
      { label: "Suppliers", href: "/master-data/suppliers" },
      { label: "Customers", href: "/master-data/customers" },
      { label: "Machines", href: "/master-data/machines" },
      { label: "Warehouse Locations", href: "/master-data/locations" },
      { label: "Packaging Materials", href: "/master-data/packaging-materials" },
      { label: "User Management", href: "/master-data/users" },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    // Auto-expand the section that contains the current page
    const initial: Record<string, boolean> = {};
    navItems.forEach((item) => {
      if (item.children?.some((child) => pathname.startsWith(child.href))) {
        initial[item.label] = true;
      }
    });
    return initial;
  });

  const toggleExpand = (label: string) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const filteredNavItems = navItems.filter((item) => {
    if (item.adminOnly && session?.user?.role !== "ADMIN") return false;
    return true;
  });

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20">
            <Wheat className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-white truncate">
              Beras Nusantara
            </h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
              MES + WMS
            </p>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
          {filteredNavItems.map((item) => {
            if (item.href) {
              // Single link (Dashboard)
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                    isActive(item.href)
                      ? "bg-emerald-500/10 text-emerald-400 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            }

            // Expandable group
            const isGroupActive = item.children?.some((child) =>
              isActive(child.href)
            );
            const isExpanded = expanded[item.label] ?? false;

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleExpand(item.label)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all duration-150",
                    isGroupActive
                      ? "text-emerald-400"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  )}
                >
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>

                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-800 pl-3">
                    {item.children?.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onClose}
                        className={cn(
                          "block px-3 py-2 rounded-md text-[13px] transition-all duration-150",
                          isActive(child.href)
                            ? "text-emerald-400 bg-emerald-500/5 font-medium"
                            : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/30"
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800">
          <p className="text-[10px] text-slate-600 text-center">v1.0.0</p>
        </div>
      </aside>
    </>
  );
}
