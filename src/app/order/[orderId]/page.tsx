"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Check, ChefHat, ClipboardList, Clock } from "lucide-react";
import { CustomerMenuShell } from "@/components/CustomerMenuShell";

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  serviceCharge: number;
  netAmount: number;
  table: { id: string; number: string };
  branch: { name: string; restaurant: { name: string } };
  orderItems: {
    id: string;
    quantity: number;
    price: number;
    specialNotes?: string | null;
    selectedOptions?: string | null;
    menuItem: { name: string };
  }[];
}

const steps = [
  { key: "PENDING", label: "สั่งอาหาร", detail: "รับออเดอร์แล้ว" },
  { key: "CONFIRMED", label: "รับออเดอร์", detail: "ร้านยืนยันรายการ" },
  { key: "COOKING", label: "กำลังทำอาหาร", detail: "กำลังเตรียมอาหาร 👨‍🍳" },
  { key: "READY", label: "อาหารพร้อมเสิร์ฟ", detail: "อาหารพร้อมเสิร์ฟ 🍽️" },
  { key: "SERVED", label: "เสิร์ฟแล้ว", detail: "เสิร์ฟแล้ว ✓" },
  { key: "COMPLETED", label: "ชำระเงิน", detail: "เสร็จสิ้น" },
];

export default function OrderTrackingPage() {
  const params = useParams<{ orderId: string }>();
  const searchParams = useSearchParams();
  const orderId = params.orderId;
  const tableRef = searchParams.get("table") || "";
  const qrToken = searchParams.get("qr") || "";
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [requesting, setRequesting] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (tableRef) params.set("table", tableRef);
      if (qrToken) params.set("qr", qrToken);
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}?${params}`);
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "ไม่พบข้อมูลออเดอร์");
      setOrder(result.data);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "ไม่สามารถโหลดสถานะออเดอร์ได้");
    } finally {
      setLoading(false);
    }
  }, [orderId, qrToken, tableRef]);

  useEffect(() => {
    fetchOrder();
    if (!tableRef || !qrToken) return;
    const events = new EventSource(
      `/api/realtime?table=${encodeURIComponent(tableRef)}&qr=${encodeURIComponent(qrToken)}`
    );
    events.addEventListener("order_updated", fetchOrder);
    return () => events.close();
  }, [fetchOrder, qrToken, tableRef]);

  const requestBill = async () => {
    setRequesting(true);
    setRequestMessage("");
    try {
      const response = await fetch("/api/customer/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: tableRef, qr: qrToken, type: "BILL", orderId }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "ไม่สามารถเรียกเช็คบิลได้");
      setRequestMessage("เรียกพนักงานเช็คบิลแล้ว");
    } catch (requestError) {
      setRequestMessage(requestError instanceof Error ? requestError.message : "ไม่สามารถเรียกเช็คบิลได้");
    } finally {
      setRequesting(false);
    }
  };

  const currentIndex = order ? steps.findIndex((step) => step.key === order.status) : -1;
  const tableNumber = order?.table.number || tableRef;
  const restaurantName = order?.branch.restaurant.name || "ร้านอาหาร";

  return (
    <CustomerMenuShell
      tableRef={tableRef || "unknown"}
      qrToken={qrToken}
      tableNumber={tableNumber}
      restaurantName={restaurantName}
    >
      <main className="min-h-screen px-4 pb-32 pt-4">
        {loading ? (
          <div className="space-y-4"><div className="h-44 animate-pulse rounded-3xl bg-slate-100" /><div className="h-64 animate-pulse rounded-3xl bg-slate-100" /></div>
        ) : error || !order ? (
          <div className="rounded-3xl bg-red-50 p-6 text-center text-sm text-red-700">{error || "ไม่พบข้อมูลออเดอร์"}</div>
        ) : (
          <>
            <header className="rounded-3xl bg-navy-950 p-6 text-center text-white shadow-xl">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500"><Check className="h-7 w-7" /></div>
              <h1 className="mt-3 text-xl font-bold">สั่งอาหารสำเร็จ</h1>
              <p className="mt-1 font-mono text-sm font-semibold text-electric-300">#{order.orderNumber}</p>
              <p className="mt-2 text-xs text-slate-300">โต๊ะ {order.table.number} · ยอดรวม ฿{order.netAmount.toLocaleString()}</p>
            </header>

            <section className="mt-4 rounded-3xl border border-slate-100 bg-white p-5">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold"><ChefHat className="h-4 w-4 text-electric-600" />สถานะออเดอร์</h2>
                <span className="rounded-full bg-electric-50 px-3 py-1 text-[10px] font-bold text-electric-700">
                  {steps[currentIndex]?.detail || order.status}
                </span>
              </div>
              <div className="space-y-5">
                {steps.map((step, index) => {
                  const done = index <= currentIndex;
                  const active = index === currentIndex;
                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-electric-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                        {done ? <Check className="h-4 w-4" /> : index + 1}
                      </span>
                      <span className={`text-xs ${active ? "font-bold text-electric-700" : done ? "font-semibold text-slate-700" : "text-slate-400"}`}>{step.label}</span>
                      {active && <span className="ml-auto text-[10px] text-electric-600">กำลังดำเนินการ</span>}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="mt-4 rounded-3xl border border-slate-100 bg-white p-5">
              <h2 className="mb-3 text-sm font-bold">รายการอาหาร</h2>
              <div className="divide-y divide-slate-100">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between gap-4 py-3 text-xs">
                    <div><p className="font-semibold">{item.menuItem.name} × {item.quantity}</p>{item.specialNotes && <p className="mt-1 text-[10px] text-slate-500">{item.specialNotes}</p>}</div>
                    <span className="shrink-0 font-semibold">฿{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between border-t pt-3 text-sm font-bold"><span>ยอดรวม</span><span className="text-electric-700">฿{order.netAmount.toLocaleString()}</span></div>
            </section>

            {order.paymentStatus !== "PAID" && (
              <button onClick={requestBill} disabled={requesting} className="mt-4 min-h-14 w-full rounded-2xl bg-gold-600 px-5 text-sm font-bold text-white disabled:opacity-60">
                {requesting ? "กำลังเรียกพนักงาน..." : "💳 เรียกเช็คบิล"}
              </button>
            )}
            {requestMessage && <p className="mt-2 rounded-xl bg-emerald-50 p-3 text-center text-xs text-emerald-700">{requestMessage}</p>}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link href={`/menu/${encodeURIComponent(tableRef)}?qr=${encodeURIComponent(qrToken)}`} className="rounded-xl border border-slate-200 py-3 text-center text-xs font-semibold">สั่งเพิ่ม</Link>
              <Link href={`/menu/${encodeURIComponent(tableRef)}/orders?qr=${encodeURIComponent(qrToken)}`} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-xs font-semibold"><ClipboardList className="h-4 w-4" />รายการที่สั่ง</Link>
            </div>
            <p className="mt-4 flex items-center justify-center gap-1 text-[10px] text-slate-400"><Clock className="h-3 w-3" />ระบบอัปเดตสถานะแบบเรียลไทม์</p>
          </>
        )}
      </main>
    </CustomerMenuShell>
  );
}
