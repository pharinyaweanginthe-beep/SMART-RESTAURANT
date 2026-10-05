"use client";

import { useEffect, useState } from "react";
import { Package, AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCw, Plus, ShieldAlert } from "lucide-react";

interface InventoryItem {
  id: string;
  quantity: number;
  lastUpdated: string;
  ingredient: {
    id: string;
    name: string;
    sku: string;
    unit: string;
    minStock: number;
    costPerUnit: number;
    supplier?: { name: string };
  };
  transactions: any[];
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Stock Adjustment Modal State
  const [selectedInv, setSelectedInv] = useState<InventoryItem | null>(null);
  const [txType, setTxType] = useState<"IN" | "OUT" | "ADJUSTMENT">("IN");
  const [txAmount, setTxAmount] = useState("");
  const [txNote, setTxNote] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchInventory = async () => {
    try {
      const res = await fetch("/api/inventory");
      const data = await res.json();
      if (data.success) setItems(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInv || !txAmount) return;
    setErrorMsg("");

    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryId: selectedInv.id,
          type: txType,
          amount: parseFloat(txAmount),
          note: txNote || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error || "เกิดข้อผิดพลาดในการบันทึกสต็อก");
      } else {
        setSelectedInv(null);
        setTxAmount("");
        setTxNote("");
        fetchInventory();
      }
    } catch (err: any) {
      setErrorMsg("ไม่สามารถทำรายการได้");
    }
  };

  const lowStockCount = items.filter((i) => i.quantity <= i.ingredient.minStock).length;

  if (loading) {
    return <div className="p-8 text-center text-slate-400 font-medium animate-pulse">กำลังโหลดคลังวัตถุดิบ...</div>;
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-card">
        <div>
          <h1 className="text-xl font-bold text-navy-900 flex items-center space-x-2">
            <Package className="w-6 h-6 text-electric-600" />
            <span>จัดการคลังวัตถุดิบและสูตรอาหาร (Inventory & Recipe BOM)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">ตัดสต็อกวัตถุดิบตามสูตรอัตโนมัติ และระบบเตือนสินค้าใกล้หมด</p>
        </div>

        {lowStockCount > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-center space-x-2 text-xs text-amber-900 font-bold">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>มีวัตถุดิบต่ำกว่าเกณฑ์ขั้นต่ำ {lowStockCount} รายการ!</span>
          </div>
        )}
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 space-y-4">
        <h3 className="text-sm font-bold text-navy-900">รายการวัตถุดิบในคลัง (Stock Items)</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-medium text-[11px] uppercase tracking-wider">
                <th className="pb-3 px-3">SKU</th>
                <th className="pb-3 px-3">ชื่อวัตถุดิบ</th>
                <th className="pb-3 px-3">ซัพพลายเออร์</th>
                <th className="pb-3 px-3 text-right">จำนวนคงเหลือ</th>
                <th className="pb-3 px-3 text-right">เกณฑ์ขั้นต่ำ (Min)</th>
                <th className="pb-3 px-3 text-right">ต้นทุน/หน่วย</th>
                <th className="pb-3 px-3 text-center">สถานะสต็อก</th>
                <th className="pb-3 px-3 text-center">จัดการสต็อก</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {items.map((inv) => {
                const isLow = inv.quantity <= inv.ingredient.minStock;
                return (
                  <tr key={inv.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-3 font-mono text-slate-500">{inv.ingredient.sku}</td>
                    <td className="py-3.5 px-3 font-bold text-navy-900">{inv.ingredient.name}</td>
                    <td className="py-3.5 px-3 text-slate-500">{inv.ingredient.supplier?.name || "-"}</td>
                    <td className="py-3.5 px-3 text-right font-bold text-electric-600">
                      {inv.quantity.toLocaleString()} {inv.ingredient.unit}
                    </td>
                    <td className="py-3.5 px-3 text-right text-slate-500">
                      {inv.ingredient.minStock.toLocaleString()} {inv.ingredient.unit}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-600">
                      ฿{inv.ingredient.costPerUnit}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {isLow ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                          วัตถุดิบใกล้หมด
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ปกติ
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => setSelectedInv(inv)}
                        className="px-3 py-1.5 bg-electric-50 hover:bg-electric-100 text-electric-700 font-bold rounded-xl text-[11px] transition"
                      >
                        รับเข้า/เบิก/ปรับสต็อก
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Transaction Modal */}
      {selectedInv && (
        <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleTransactionSubmit} className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-navy-900">
              ทำรายการสต็อก: {selectedInv.ingredient.name}
            </h3>

            {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}

            <div>
              <label className="block text-xs font-semibold mb-1">ประเภทรายการ</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTxType("IN")}
                  className={`py-2 rounded-xl border text-xs font-bold ${
                    txType === "IN" ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-50 text-slate-700"
                  }`}
                >
                  รับสินค้าเข้า (IN)
                </button>
                <button
                  type="button"
                  onClick={() => setTxType("OUT")}
                  className={`py-2 rounded-xl border text-xs font-bold ${
                    txType === "OUT" ? "bg-rose-600 text-white border-rose-600" : "bg-slate-50 text-slate-700"
                  }`}
                >
                  ตัดเบิกสต็อก (OUT)
                </button>
                <button
                  type="button"
                  onClick={() => setTxType("ADJUSTMENT")}
                  className={`py-2 rounded-xl border text-xs font-bold ${
                    txType === "ADJUSTMENT" ? "bg-electric-600 text-white border-electric-600" : "bg-slate-50 text-slate-700"
                  }`}
                >
                  ปรับยอด (ADJUST)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                จำนวน ({selectedInv.ingredient.unit})
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                placeholder="ระบุจำนวน..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">หมายเหตุ</label>
              <input
                type="text"
                value={txNote}
                onChange={(e) => setTxNote(e.target.value)}
                placeholder="เหตุผลการปรับปรุงสต็อก..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-electric-600 text-white font-bold rounded-xl text-xs hover:bg-electric-700 transition"
              >
                บันทึกรายการ
              </button>
              <button
                type="button"
                onClick={() => setSelectedInv(null)}
                className="px-4 py-2.5 bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-300 transition"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
