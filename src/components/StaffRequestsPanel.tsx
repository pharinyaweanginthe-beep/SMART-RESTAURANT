"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing, CheckCircle2, ClipboardCheck } from "lucide-react";

interface StaffRequest {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  table: { number: string };
}

interface BillRequest {
  id: string;
  status: string;
  createdAt: string;
  table: { number: string };
  order?: { orderNumber: string; netAmount: number } | null;
}

export function StaffRequestsPanel() {
  const [staffRequests, setStaffRequests] = useState<StaffRequest[]>([]);
  const [billRequests, setBillRequests] = useState<BillRequest[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/customer/requests");
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "โหลดคำขอจากลูกค้าไม่สำเร็จ");
      setStaffRequests(result.data.staffRequests);
      setBillRequests(result.data.billRequests);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "โหลดคำขอจากลูกค้าไม่สำเร็จ");
    }
  }, []);

  useEffect(() => {
    load();
    const events = new EventSource("/api/realtime");
    events.addEventListener("staff_request", load);
    events.addEventListener("bill_request", load);
    return () => events.close();
  }, [load]);

  const updateStatus = async (kind: "STAFF" | "BILL", requestId: string, status: string) => {
    try {
      const response = await fetch("/api/customer/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, requestId, status }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "อัปเดตคำขอไม่สำเร็จ");
      await load();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "อัปเดตคำขอไม่สำเร็จ");
    }
  };

  if (!staffRequests.length && !billRequests.length && !error) return null;

  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50/60 p-5">
      <div className="mb-3 flex items-center gap-2">
        <BellRing className="h-5 w-5 text-amber-600" />
        <h2 className="text-sm font-bold text-navy-900">คำขอจากลูกค้า</h2>
      </div>
      {error && <p className="mb-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {staffRequests.map((request) => (
          <article key={request.id} className="rounded-2xl border border-amber-100 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold">โต๊ะ {request.table.number} · {request.type === "WATER" ? "ขอน้ำ" : request.type === "CUTLERY" ? "ขอช้อน/ส้อม" : "เรียกพนักงาน"}</p>
                <p className="mt-1 text-[10px] text-slate-400">{new Date(request.createdAt).toLocaleTimeString("th-TH")}</p>
              </div>
              <span className="rounded-full bg-amber-100 px-2 py-1 text-[9px] font-bold text-amber-800">{request.status}</span>
            </div>
            <div className="mt-3 flex gap-2">
              {request.status === "REQUESTED" && <button onClick={() => updateStatus("STAFF", request.id, "PROCESSING")} className="rounded-lg bg-electric-600 px-3 py-2 text-[10px] font-bold text-white">รับคำขอ</button>}
              <button onClick={() => updateStatus("STAFF", request.id, "COMPLETED")} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-bold text-white"><CheckCircle2 className="h-3 w-3" />เสร็จแล้ว</button>
            </div>
          </article>
        ))}
        {billRequests.map((request) => (
          <article key={request.id} className="rounded-2xl border border-purple-100 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold">โต๊ะ {request.table.number} · ขอเช็คบิล</p>
                <p className="mt-1 text-[10px] text-slate-500">{request.order?.orderNumber || "รายการโต๊ะ"} {request.order && `· ฿${request.order.netAmount.toLocaleString()}`}</p>
              </div>
              <span className="rounded-full bg-purple-100 px-2 py-1 text-[9px] font-bold text-purple-800">{request.status}</span>
            </div>
            <div className="mt-3 flex gap-2">
              {request.status === "REQUESTED" && <button onClick={() => updateStatus("BILL", request.id, "PROCESSING")} className="rounded-lg bg-electric-600 px-3 py-2 text-[10px] font-bold text-white">กำลังดำเนินการ</button>}
              {request.status === "PAID" && <button onClick={() => updateStatus("BILL", request.id, "COMPLETED")} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-bold text-white"><ClipboardCheck className="h-3 w-3" />ปิดคำขอ</button>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
