"use client";

import { useEffect, useState } from "react";
import { ChefHat, Clock, CheckCircle2, Flame, Bell, Sparkles } from "lucide-react";

interface OrderItem {
  id: string;
  quantity: number;
  specialNotes?: string;
  status: string;
  menuItem: { name: string };
}

interface Order {
  id: string;
  orderNumber: string;
  table: { number: string };
  createdAt: string;
  status: string;
  orderItems: OrderItem[];
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKitchenOrders = async () => {
    try {
      const res = await fetch("/api/kitchen");
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenOrders();

    // Subscribe to Realtime SSE Events
    const eventSource = new EventSource("/api/realtime");

    const handleUpdate = () => {
      fetchKitchenOrders();
    };

    eventSource.addEventListener("order_created", handleUpdate);
    eventSource.addEventListener("order_updated", handleUpdate);

    return () => {
      eventSource.close();
    };
  }, []);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await fetch("/api/kitchen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      fetchKitchenOrders();
    } catch (e) {
      console.error(e);
    }
  };

  const waitingOrders = orders.filter((o) => o.status === "PENDING" || o.status === "CONFIRMED");
  const cookingOrders = orders.filter((o) => o.status === "COOKING");
  const readyOrders = orders.filter((o) => o.status === "READY");

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 font-medium animate-pulse">
        กำลังโหลดระบบจอแสดงผลห้องครัว (Kitchen Display System)...
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4 font-sans overflow-hidden">
      {/* KDS Header Banner */}
      <div className="bg-navy-950 text-white rounded-3xl p-4 border border-navy-800 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">KITCHEN DISPLAY SYSTEM (KDS)</h1>
            <p className="text-xs text-slate-400">ระบบจอห้องครัวสั่งการเรียลไทม์ (Real-Time Live Order Hub)</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs font-semibold">
          <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-4 h-4" />
            <span>รอทำ: {waitingOrders.length}</span>
          </span>
          <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Flame className="w-4 h-4" />
            <span>กำลังปรุง: {cookingOrders.length}</span>
          </span>
          <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" />
            <span>พร้อมเสิร์ฟ: {readyOrders.length}</span>
          </span>
        </div>
      </div>

      {/* 3 Columns Grid Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
        {/* COLUMN 1: WAITING */}
        <div className="bg-slate-100/80 rounded-3xl p-4 border border-slate-200/80 flex flex-col space-y-3 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 px-1">
            <span className="font-bold text-xs text-amber-800 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>รอดำเนินการ (WAITING)</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-800">
              {waitingOrders.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 p-1">
            {waitingOrders.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">ไม่มีออเดอร์ใหม่</div>
            ) : (
              waitingOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl p-4 border border-amber-200 shadow-md space-y-3">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                    <div>
                      <span className="font-bold text-sm text-navy-900">{order.orderNumber}</span>
                      <p className="text-[10px] text-slate-400">
                        {new Date(order.createdAt).toLocaleTimeString("th-TH")}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      โต๊ะ {order.table?.number}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {order.orderItems?.map((item) => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-navy-900">{item.menuItem.name}</span>
                          {item.specialNotes && (
                            <p className="text-[10px] text-amber-600 font-medium">*{item.specialNotes}</p>
                          )}
                        </div>
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                          x{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleUpdateStatus(order.id, "COOKING")}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-amber-500/20 transition"
                  >
                    <Flame className="w-4 h-4" />
                    <span>เริ่มทำอาหาร (Start Cooking)</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 2: COOKING */}
        <div className="bg-slate-100/80 rounded-3xl p-4 border border-slate-200/80 flex flex-col space-y-3 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 px-1">
            <span className="font-bold text-xs text-blue-800 flex items-center space-x-1.5">
              <Flame className="w-4 h-4 text-blue-600" />
              <span>กำลังปรุง (COOKING)</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-200 text-blue-800">
              {cookingOrders.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 p-1">
            {cookingOrders.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">ไม่มีรายการกำลังทำ</div>
            ) : (
              cookingOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl p-4 border border-blue-200 shadow-md space-y-3">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                    <div>
                      <span className="font-bold text-sm text-navy-900">{order.orderNumber}</span>
                      <p className="text-[10px] text-slate-400">
                        {new Date(order.createdAt).toLocaleTimeString("th-TH")}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                      โต๊ะ {order.table?.number}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {order.orderItems?.map((item) => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-navy-900">{item.menuItem.name}</span>
                          {item.specialNotes && (
                            <p className="text-[10px] text-blue-600 font-medium">*{item.specialNotes}</p>
                          )}
                        </div>
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                          x{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleUpdateStatus(order.id, "READY")}
                    className="w-full py-2.5 bg-electric-600 hover:bg-electric-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-electric-600/20 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>เสร็จแล้ว (Mark Ready)</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 3: READY */}
        <div className="bg-slate-100/80 rounded-3xl p-4 border border-slate-200/80 flex flex-col space-y-3 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 px-1">
            <span className="font-bold text-xs text-emerald-800 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>พร้อมเสิร์ฟ (READY)</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-800">
              {readyOrders.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 p-1">
            {readyOrders.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">ไม่มีรายการพร้อมเสิร์ฟ</div>
            ) : (
              readyOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-md space-y-3">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                    <div>
                      <span className="font-bold text-sm text-navy-900">{order.orderNumber}</span>
                      <p className="text-[10px] text-slate-400">
                        {new Date(order.createdAt).toLocaleTimeString("th-TH")}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      โต๊ะ {order.table?.number}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {order.orderItems?.map((item) => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-navy-900">{item.menuItem.name}</span>
                        </div>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          x{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleUpdateStatus(order.id, "SERVED")}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/20 transition"
                  >
                    <Bell className="w-4 h-4 animate-bounce" />
                    <span>เรียกเสิร์ฟ (Call Serve)</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
