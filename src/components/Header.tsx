"use client";

import { useState, useEffect } from "react";
import { Store, Bell, AlertTriangle, RefreshCw, CheckCircle2 } from "lucide-react";

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface HeaderProps {
  currentBranchId?: string;
  onBranchChange?: (branchId: string) => void;
  title?: string;
}

export function Header({ currentBranchId, onBranchChange, title }: HeaderProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [notifications, setNotifications] = useState<
    { id: string; title: string; message: string; type: "alert" | "info" }[]
  >([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  useEffect(() => {
    fetch("/api/branches")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setBranches(data.data);
        }
      })
      .catch(() => {});

    // Subscribe to Realtime SSE events
    const eventSource = new EventSource("/api/realtime");

    eventSource.addEventListener("order_created", (e: any) => {
      const order = JSON.parse(e.data);
      setNotifications((prev) => [
        {
          id: String(Date.now()),
          title: `ออเดอร์ใหม่ #${order.orderNumber}`,
          message: `โต๊ะ ${order.table?.number || ""} สั่งอาหารใหม่ ${order.orderItems?.length || 0} รายการ`,
          type: "info",
        },
        ...prev,
      ]);
    });

    eventSource.addEventListener("inventory_low", (e: any) => {
      const { alerts } = JSON.parse(e.data);
      alerts.forEach((alert: any) => {
        setNotifications((prev) => [
          {
            id: String(Date.now()),
            title: `เตือนวัตถุดิบใกล้หมด!`,
            message: `${alert.ingredientName} เหลือเพียง ${alert.currentQuantity}${alert.unit} (ขั้นต่ำ ${alert.minStock}${alert.unit})`,
            type: "alert",
          },
          ...prev,
        ]);
      });
    });

    eventSource.addEventListener("staff_request", (e: any) => {
      const request = JSON.parse(e.data);
      setNotifications((prev) => [
        {
          id: `staff-${request.id}`,
          title: "มีคำขอจากลูกค้า",
          message: `โต๊ะ ${request.table?.number || ""} · ${
            request.type === "WATER" ? "ขอน้ำ" : request.type === "CUTLERY" ? "ขอช้อน/ส้อม" : "เรียกพนักงาน"
          }`,
          type: "info",
        },
        ...prev,
      ]);
    });

    eventSource.addEventListener("bill_request", (e: any) => {
      const request = JSON.parse(e.data);
      setNotifications((prev) => [
        {
          id: `bill-${request.id}`,
          title: "ลูกค้าเรียกเช็คบิล",
          message: `โต๊ะ ${request.table?.number || ""} · สถานะ ${request.status}`,
          type: "info",
        },
        ...prev,
      ]);
    });

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm sticky top-0 z-30">
      {/* Title */}
      <div className="flex items-center space-x-3">
        <h2 className="text-lg font-bold text-navy-900 tracking-tight">{title || "ระบบบริหารจัดการร้านอาหาร"}</h2>
        <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-electric-50 text-electric-700 border border-electric-200">
          PRO SYSTEM
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-4">
        {/* Branch Selector */}
        <div className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl border border-slate-200 transition">
          <Store className="w-4 h-4 text-electric-600" />
          <select
            value={currentBranchId || ""}
            onChange={(e) => onBranchChange && onBranchChange(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="">ทุกสาขา (All Branches)</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Real-time Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition focus:outline-none"
            title="การแจ้งเตือน Real-time"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Dropdown Menu */}
          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 px-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between px-3 pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-navy-900">การแจ้งเตือนระบบ</span>
                {notifications.length > 0 && (
                  <button
                    onClick={() => setNotifications([])}
                    className="text-[10px] text-slate-400 hover:text-slate-600 font-medium"
                  >
                    ล้างทั้งหมด
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto py-1 space-y-1">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 flex flex-col items-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-1" />
                    ไม่มีการแจ้งเตือนใหม่
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl text-xs flex items-start space-x-2.5 ${
                        n.type === "alert" ? "bg-amber-50 text-amber-900 border border-amber-200/50" : "bg-blue-50 text-blue-900"
                      }`}
                    >
                      {n.type === "alert" ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      ) : (
                        <RefreshCw className="w-4 h-4 text-electric-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-semibold">{n.title}</p>
                        <p className="text-[11px] opacity-80 mt-0.5">{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
