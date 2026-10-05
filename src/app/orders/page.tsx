"use client";

import { useEffect, useState } from "react";
import { Layers, Search, Eye, Filter } from "lucide-react";
import { StaffRequestsPanel } from "@/components/StaffRequestsPanel";

interface Order {
  id: string;
  orderNumber: string;
  customerName?: string;
  table: { number: string };
  netAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  orderItems: any[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success) setOrders(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    const matchStatus = !statusFilter || o.status === statusFilter;
    const matchSearch =
      !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.table?.number.includes(search) ||
      (o.customerName && o.customerName.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  if (loading) {
    return <div className="p-8 text-center text-slate-400 font-medium animate-pulse">กำลังโหลดรายการออเดอร์...</div>;
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-card">
        <div>
          <h1 className="text-xl font-bold text-navy-900 flex items-center space-x-2">
            <Layers className="w-6 h-6 text-electric-600" />
            <span>ระบบจัดการออเดอร์ (Order Management)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">ประวัติการสั่งอาหาร ค้นหาออเดอร์ และตรวจสอบสถานะรายการ</p>
        </div>
      </div>

      <StaffRequestsPanel />

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาตามเลขที่ออเดอร์ โต๊ะ หรือชื่อลูกค้า..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
        >
          <option value="">ทุกสถานะ (All Statuses)</option>
          <option value="PENDING">PENDING (รับออเดอร์แล้ว)</option>
          <option value="COOKING">COOKING (กำลังทำอาหาร)</option>
          <option value="READY">READY (อาหารพร้อม)</option>
          <option value="SERVED">SERVED (เสิร์ฟแล้ว)</option>
          <option value="COMPLETED">COMPLETED (เสร็จสิ้น)</option>
          <option value="CANCELLED">CANCELLED (ยกเลิก)</option>
        </select>
      </div>

      {/* Table List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-medium text-[11px] uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4">เลขที่ออเดอร์</th>
                <th className="py-3 px-4">โต๊ะ</th>
                <th className="py-3 px-4">ลูกค้า</th>
                <th className="py-3 px-4">รายการอาหาร</th>
                <th className="py-3 px-4 text-right">ยอดรวมสุทธิ</th>
                <th className="py-3 px-4 text-center">สถานะออเดอร์</th>
                <th className="py-3 px-4 text-center">สถานะชำระเงิน</th>
                <th className="py-3 px-4 text-right">เวลาสั่ง</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    ไม่พบรายการออเดอร์
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-navy-900">{order.orderNumber}</td>
                    <td className="py-3.5 px-4 font-semibold text-electric-600">โต๊ะ {order.table?.number}</td>
                    <td className="py-3.5 px-4 text-slate-600">{order.customerName || "ลูกค้าทั่วไป"}</td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      {order.orderItems?.map((i: any) => `${i.menuItem.name} (x${i.quantity})`).join(", ")}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-navy-900">฿{order.netAmount.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          order.paymentStatus === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 font-mono text-[11px]">
                      {new Date(order.createdAt).toLocaleTimeString("th-TH")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
