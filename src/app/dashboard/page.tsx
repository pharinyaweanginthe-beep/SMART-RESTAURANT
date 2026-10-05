"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Table as TableIcon,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardData {
  kpi: {
    todayRevenue: number;
    totalOrdersCount: number;
    avgOrderValue: number;
    totalTables: number;
    occupiedTables: number;
    lowStockCount: number;
  };
  topSelling: { name: string; totalQty: number; totalRevenue: number }[];
  recentOrders: any[];
  chartData: { date: string; sales: number }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium animate-pulse">
        กำลังโหลดข้อมูลแดชบอร์ดภาพรวมร้านอาหาร...
      </div>
    );
  }

  const kpi = data?.kpi || {
    todayRevenue: 0,
    totalOrdersCount: 0,
    avgOrderValue: 0,
    totalTables: 0,
    occupiedTables: 0,
    lowStockCount: 0,
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-electric-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-gold-400 font-semibold text-xs mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Executive Dashboard</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">ภาพรวมผลการดำเนินงานร้านอาหาร</h1>
          <p className="text-xs text-slate-300 mt-1">ข้อมูลวิเคราะห์ยอดขาย ออเดอร์เรียลไทม์ และสต็อกวัตถุดิบแม่นยำ 100%</p>
        </div>
        <div className="flex items-center space-x-3 bg-white/10 backdrop-blur px-4 py-2 rounded-2xl border border-white/10">
          <Clock className="w-4 h-4 text-electric-300" />
          <span className="text-xs font-mono font-medium">
            อัปเดตล่าสุด: {new Date().toLocaleTimeString("th-TH")}
          </span>
        </div>
      </div>

      {/* Top KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card card-hover space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">ยอดขายวันนี้</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-navy-900">฿{kpi.todayRevenue.toLocaleString()}</div>
            <p className="text-[10px] text-emerald-600 font-medium mt-1">คำนวณจากออเดอร์ชำระเงินจริง</p>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card card-hover space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">จำนวนออเดอร์</span>
            <div className="w-9 h-9 rounded-xl bg-electric-50 text-electric-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-navy-900">{kpi.totalOrdersCount} บิล</div>
            <p className="text-[10px] text-electric-600 font-medium mt-1">ออเดอร์ทั้งหมดวันนี้</p>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card card-hover space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">ยอดเฉลี่ยต่อบิล (AOV)</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-navy-900">฿{Math.round(kpi.avgOrderValue).toLocaleString()}</div>
            <p className="text-[10px] text-purple-600 font-medium mt-1">ค่าเฉลี่ยความคุ้มค่าต่อบิล</p>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card card-hover space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">การใช้งานโต๊ะ</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TableIcon className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-navy-900">
              {kpi.occupiedTables} / {kpi.totalTables} โต๊ะ
            </div>
            <p className="text-[10px] text-blue-600 font-medium mt-1">
              อัตราการครองโต๊ะ {kpi.totalTables > 0 ? Math.round((kpi.occupiedTables / kpi.totalTables) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* KPI 5 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card card-hover space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">วัตถุดิบใกล้หมด</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-navy-900">{kpi.lowStockCount} รายการ</div>
            <p className="text-[10px] text-amber-600 font-medium mt-1">ต่ำกว่าเกณฑ์ขั้นต่ำ (Min Stock)</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart & Top Menu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Performance Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-navy-900">แนวโน้มยอดขาย (Sales Trend 7 Days)</h3>
              <p className="text-xs text-slate-400">กราฟแสดงรายได้ย้อนหลัง 7 วันจากระบบชำระเงินจริง</p>
            </div>
          </div>
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.chartData || []}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    borderRadius: "12px",
                    color: "#FFF",
                    fontSize: "12px",
                    border: "none",
                  }}
                  formatter={(val: any) => [`฿${Number(val).toLocaleString()}`, "ยอดขาย"]}
                />
                <Area type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Menu Items */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <div>
            <h3 className="text-sm font-bold text-navy-900">เมนูขายดีประจำร้าน (Top Selling)</h3>
            <p className="text-xs text-slate-400">เรียงตามยอดขายสะสม</p>
          </div>
          <div className="space-y-3">
            {data?.topSelling.length === 0 ? (
              <div className="text-xs text-slate-400 py-8 text-center">ยังไม่มีข้อมูลยอดขาย</div>
            ) : (
              data?.topSelling.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-lg bg-electric-100 text-electric-700 font-bold text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-navy-900">{item.name}</p>
                      <p className="text-[10px] text-slate-400">ขายได้ {item.totalQty} จาน</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-electric-600">฿{item.totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Feed */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-navy-900">รายการออเดอร์ล่าสุด (Recent Real-Time Orders)</h3>
            <p className="text-xs text-slate-400">เชื่อมโยงข้อมูลจาก Customer QR Ordering & KDS</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-medium text-[11px] uppercase tracking-wider">
                <th className="pb-3 px-3">เลขที่ออเดอร์</th>
                <th className="pb-3 px-3">โต๊ะ</th>
                <th className="pb-3 px-3">ลูกค้า</th>
                <th className="pb-3 px-3">รายการอาหาร</th>
                <th className="pb-3 px-3 text-right">ยอดรวม</th>
                <th className="pb-3 px-3 text-center">สถานะออเดอร์</th>
                <th className="pb-3 px-3 text-center">สถานะชำระเงิน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {data?.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">ยังไม่มีรายการออเดอร์</td>
                </tr>
              ) : (
                data?.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-navy-900">{order.orderNumber}</td>
                    <td className="py-3 px-3 font-semibold text-electric-600">โต๊ะ {order.table?.number}</td>
                    <td className="py-3 px-3 text-slate-600">{order.customerName || "ลูกค้าทั่วไป"}</td>
                    <td className="py-3 px-3 text-slate-500 truncate max-w-xs">
                      {order.orderItems?.map((i: any) => `${i.menuItem.name} (x${i.quantity})`).join(", ")}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-navy-900">฿{order.netAmount.toLocaleString()}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          order.paymentStatus === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
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
