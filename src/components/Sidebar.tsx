"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  Layers,
  Table as TableIcon,
  ChefHat,
  Package,
  Users,
  BarChart3,
  TrendingUp,
  Settings as SettingsIcon,
  UserCheck,
  Building2,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { clsx } from "clsx";

interface SidebarProps {
  userRole?: string;
  userName?: string;
  onLogout?: () => void;
}

export function Sidebar({ userRole = "ADMIN", userName = "ผู้ใช้งาน", onLogout }: SidebarProps) {
  const pathname = usePathname();

  const mainNav = [
    { name: "แดชบอร์ด (Dashboard)", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER"] },
    { name: "ระบบ POS (แคชเชียร์)", href: "/pos", icon: ShoppingCart, roles: ["ADMIN", "MANAGER", "CASHIER"] },
    { name: "จัดการออเดอร์ (Orders)", href: "/orders", icon: Layers, roles: ["ADMIN", "MANAGER", "CASHIER", "STAFF"] },
    { name: "ห้องครัว (Kitchen KDS)", href: "/kitchen", icon: ChefHat, roles: ["ADMIN", "MANAGER", "KITCHEN"] },
    { name: "ผังโต๊ะอาหาร (Tables)", href: "/tables", icon: TableIcon, roles: ["ADMIN", "MANAGER", "CASHIER", "STAFF"] },
    { name: "จัดการเมนู (Menu)", href: "/menu", icon: UtensilsCrossed, roles: ["ADMIN", "MANAGER"] },
    { name: "คลังวัตถุดิบ (Inventory)", href: "/inventory", icon: Package, roles: ["ADMIN", "MANAGER"] },
    { name: "ระบบสมาชิก (Members)", href: "/members", icon: Users, roles: ["ADMIN", "MANAGER"] },
    { name: "รายงานยอดขาย (Reports)", href: "/reports", icon: BarChart3, roles: ["ADMIN", "MANAGER", "CASHIER"] },
    { name: "วิเคราะห์การลงทุน (Investment)", href: "/investment", icon: TrendingUp, roles: ["ADMIN", "MANAGER"] },
    { name: "ตั้งค่าระบบ (Settings)", href: "/settings", icon: SettingsIcon, roles: ["ADMIN", "MANAGER"] },
  ];

  const adminNav = [
    { name: "จัดการผู้ใช้ (Users)", href: "/admin/users", icon: UserCheck, roles: ["ADMIN"] },
    { name: "จัดการสาขา (Branches)", href: "/admin/branches", icon: Building2, roles: ["ADMIN"] },
  ];

  const filterByRole = (items: typeof mainNav) => {
    if (userRole === "ADMIN") return items;
    return items.filter((item) => item.roles.includes(userRole));
  };

  const allowedMain = filterByRole(mainNav);
  const allowedAdmin = filterByRole(adminNav);

  return (
    <aside className="w-64 bg-navy-950 text-white flex flex-col min-h-screen border-r border-navy-800 shadow-xl select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-navy-800/80 flex items-center space-x-3 bg-navy-900/60 backdrop-blur">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-electric-600 to-electric-400 flex items-center justify-center shadow-lg shadow-electric-600/30">
          <UtensilsCrossed className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-base tracking-wide text-white leading-tight">SMART RESTAURANT</h1>
          <p className="text-[10px] text-electric-400 font-medium">ระบบบริหารจัดการร้านอาหาร</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">เมนูหลัก</p>
          <nav className="space-y-1">
            {allowedMain.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group",
                    isActive
                      ? "bg-electric-600 text-white shadow-md shadow-electric-600/30 font-semibold"
                      : "text-slate-300 hover:bg-navy-800/60 hover:text-white"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={clsx("w-4 h-4 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-400 group-hover:text-electric-400")} />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {allowedAdmin.length > 0 && (
          <div>
            <p className="px-3 text-[11px] font-semibold text-gold-400 uppercase tracking-wider mb-2">ระบบผู้ดูแล (Admin)</p>
            <nav className="space-y-1">
              {allowedAdmin.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group",
                      isActive
                        ? "bg-gold-600 text-white shadow-md shadow-gold-600/30 font-semibold"
                        : "text-slate-300 hover:bg-navy-800/60 hover:text-white"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={clsx("w-4 h-4 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-gold-400")} />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-navy-800/80 bg-navy-900/40 flex items-center justify-between">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-navy-800 border border-navy-700 flex items-center justify-center font-bold text-xs text-electric-400">
            {userName.charAt(0)}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-white truncate">{userName}</p>
            <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-navy-800 text-electric-300 border border-electric-500/30">
              {userRole}
            </span>
          </div>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            title="ออกจากระบบ"
            className="p-2 rounded-lg text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
