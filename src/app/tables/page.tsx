"use client";

import { useEffect, useState } from "react";
import { Table as TableIcon, QrCode, Plus, UserCheck, RefreshCw, Power } from "lucide-react";
import { QRCodeModal } from "@/components/QRCodeModal";

interface Table {
  id: string;
  number: string;
  qrToken: string;
  capacity: number;
  status: "AVAILABLE" | "OCCUPIED" | "WAITING_PAYMENT" | "RESERVED" | "OUT_OF_SERVICE";
  orders: any[];
}

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQrTable, setSelectedQrTable] = useState<{ number: string; qrToken: string } | null>(null);

  const fetchTables = async () => {
    try {
      const res = await fetch("/api/tables");
      const data = await res.json();
      if (data.success) setTables(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleUpdateTableStatus = async (tableId: string, status: string) => {
    try {
      await fetch(`/api/tables/${tableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchTables();
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">ว่าง (AVAILABLE)</span>;
      case "OCCUPIED":
        return <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">มีลูกค้า (OCCUPIED)</span>;
      case "WAITING_PAYMENT":
        return <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">รอชำระเงิน (WAITING PAYMENT)</span>;
      case "RESERVED":
        return <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">จองแล้ว (RESERVED)</span>;
      default:
        return <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-300">งดบริการ (OUT OF SERVICE)</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 font-medium animate-pulse">
        กำลังโหลดข้อมูลผังโต๊ะอาหาร...
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-card">
        <div>
          <h1 className="text-xl font-bold text-navy-900 flex items-center space-x-2">
            <TableIcon className="w-6 h-6 text-electric-600" />
            <span>จัดการผังโต๊ะอาหาร (Table Management)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            สถานะโต๊ะเรียลไทม์ และระบบพิมพ์ QR Code สำหรับเปิดโต๊ะรับออเดอร์
          </p>
        </div>
        <button
          onClick={fetchTables}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-xs flex items-center space-x-2 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      {/* Grid of Tables */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-3xl p-5 border border-slate-200 shadow-card hover:shadow-lg transition space-y-4 flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-2xl font-bold text-navy-900 font-mono">โต๊ะ {t.number}</span>
                <p className="text-xs text-slate-400 font-medium mt-0.5">ความจุ: {t.capacity} ที่นั่ง</p>
              </div>
              {getStatusBadge(t.status)}
            </div>

            {/* Active order snippet if any */}
            {t.orders && t.orders.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between text-navy-900 font-bold">
                  <span>#{t.orders[0].orderNumber}</span>
                  <span className="text-electric-600">฿{t.orders[0].netAmount.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  {t.orders[0].orderItems?.map((i: any) => i.menuItem.name).join(", ")}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                onClick={() => setSelectedQrTable({ number: t.number, qrToken: t.qrToken })}
                className="py-2 px-3 bg-electric-50 hover:bg-electric-100 text-electric-700 font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition"
              >
                <QrCode className="w-4 h-4" />
                <span>ดู QR Code</span>
              </button>

              {t.status === "AVAILABLE" ? (
                <button
                  onClick={() => handleUpdateTableStatus(t.id, "OCCUPIED")}
                  className="py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl flex items-center justify-center space-x-1 transition"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>เปิดโต๊ะ</span>
                </button>
              ) : (
                <button
                  onClick={() => handleUpdateTableStatus(t.id, "AVAILABLE")}
                  className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl flex items-center justify-center space-x-1 transition"
                >
                  <Power className="w-4 h-4" />
                  <span>ปิดโต๊ะ</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* QR Modal */}
      {selectedQrTable && (
        <QRCodeModal
          isOpen={!!selectedQrTable}
          onClose={() => setSelectedQrTable(null)}
          tableNumber={selectedQrTable.number}
          qrToken={selectedQrTable.qrToken}
        />
      )}
    </div>
  );
}
