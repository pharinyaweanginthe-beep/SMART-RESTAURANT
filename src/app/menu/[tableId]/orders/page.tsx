"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ClipboardList, Clock } from "lucide-react";
import { CustomerMenuShell } from "@/components/CustomerMenuShell";

interface CustomerOrder {
  id: string;
  orderNumber: string;
  netAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  PENDING: "รับออเดอร์แล้ว",
  CONFIRMED: "ยืนยันรายการ",
  COOKING: "กำลังทำอาหาร",
  READY: "อาหารพร้อมเสิร์ฟ",
  SERVED: "เสิร์ฟแล้ว",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
};

export default function CustomerOrderHistoryPage() {
  const params = useParams<{ tableId: string }>();
  const searchParams = useSearchParams();
  const tableRef = params.tableId;
  const qrToken = searchParams.get("qr") || "";
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [restaurantName, setRestaurantName] = useState("ร้านอาหาร");
  const [tableNumber, setTableNumber] = useState(tableRef);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const query = `?qr=${encodeURIComponent(qrToken)}`;

  const fetchOrders = useCallback(async () => {
    if (!qrToken) {
      setError("QR Code ไม่ถูกต้อง กรุณาสแกน QR Code ที่โต๊ะอีกครั้ง");
      setLoading(false);
      return;
    }
    try {
      const [orderResponse, contextResponse] = await Promise.all([
        fetch(`/api/customer/orders?table=${encodeURIComponent(tableRef)}&qr=${encodeURIComponent(qrToken)}`),
        fetch(`/api/customer/menu/${encodeURIComponent(tableRef)}?qr=${encodeURIComponent(qrToken)}`),
      ]);
      const [orderResult, contextResult] = await Promise.all([orderResponse.json(), contextResponse.json()]);
      if (!orderResponse.ok || !orderResult.success) throw new Error(orderResult.error || "ไม่สามารถโหลดประวัติได้");
      setOrders(orderResult.data);
      if (contextResponse.ok && contextResult.success) {
        setRestaurantName(contextResult.data.restaurant.name);
        setTableNumber(contextResult.data.table.number);
      }
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "ไม่สามารถโหลดประวัติได้");
    } finally {
      setLoading(false);
    }
  }, [qrToken, tableRef]);

  useEffect(() => {
    fetchOrders();
    const eventSource = new EventSource(
      `/api/realtime?table=${encodeURIComponent(tableRef)}&qr=${encodeURIComponent(qrToken)}`
    );
    eventSource.addEventListener("order_updated", fetchOrders);
    eventSource.addEventListener("order_created", fetchOrders);
    return () => eventSource.close();
  }, [fetchOrders, qrToken, tableRef]);

  return (
    <CustomerMenuShell
      tableRef={tableRef}
      qrToken={qrToken}
      tableNumber={tableNumber}
      restaurantName={restaurantName}
    >
      <main className="min-h-screen px-4 pb-32 pt-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl bg-electric-50 p-3 text-electric-600"><ClipboardList className="h-5 w-5" /></div>
          <div><h1 className="text-xl font-bold">รายการที่สั่ง</h1><p className="text-xs text-slate-500">โต๊ะ {tableNumber}</p></div>
        </div>
        {error && <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((key) => <div key={key} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}</div>
        ) : !error && orders.length === 0 ? (
          <div className="rounded-3xl bg-slate-50 p-8 text-center">
            <ClipboardList className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <p className="text-sm font-semibold">ยังไม่มีรายการสั่งอาหาร</p>
            <Link href={`/menu/${encodeURIComponent(tableRef)}${query}`} className="mt-4 inline-block rounded-xl bg-electric-600 px-4 py-2 text-xs font-bold text-white">เลือกอาหาร</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link key={order.id} href={`/order/${order.id}?table=${encodeURIComponent(tableRef)}&qr=${encodeURIComponent(qrToken)}`} className="block rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-electric-200">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-sm font-bold">#{order.orderNumber}</p><p className="mt-1 flex items-center gap-1 text-[10px] text-slate-400"><Clock className="h-3 w-3" />{new Date(order.createdAt).toLocaleString("th-TH")}</p></div>
                  <div className="text-right"><p className="text-sm font-bold text-electric-700">฿{order.netAmount.toLocaleString()}</p><p className="mt-1 text-[10px] font-semibold text-slate-600">{statusLabels[order.status] || order.status}</p></div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </CustomerMenuShell>
  );
}
