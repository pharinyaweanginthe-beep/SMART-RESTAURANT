"use client";

import { Printer, X, CheckCircle2 } from "lucide-react";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  menuItem: { name: string };
  specialNotes?: string;
}

interface ReceiptData {
  orderNumber: string;
  restaurantName?: string;
  branchName?: string;
  tableNumber?: string;
  customerName?: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  netAmount: number;
  amountPaid: number;
  changeAmount: number;
  paymentMethod: string;
  createdAt: string;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReceiptData | null;
}

export function ReceiptModal({ isOpen, onClose, data }: ReceiptModalProps) {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-navy-900 text-white p-4 flex items-center justify-between no-print">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-sm">ใบเสร็จรับเงิน (Receipt)</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-navy-800 rounded-lg text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Body for Print */}
        <div id="receipt-print-area" className="p-6 text-slate-800 text-xs font-mono space-y-4">
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
            <h3 className="font-bold text-base font-sans text-navy-900 uppercase tracking-wide">
              {data.restaurantName || "SMART RESTAURANT"}
            </h3>
            <p className="text-[11px] text-slate-500 font-sans">{data.branchName || "สาขาหลัก (สยาม)"}</p>
            <p className="text-[10px] text-slate-400">วันที่: {new Date(data.createdAt).toLocaleString("th-TH")}</p>
          </div>

          <div className="flex justify-between text-[11px] border-b border-dashed border-slate-200 pb-2">
            <div>
              <p>เลขที่: <span className="font-semibold">{data.orderNumber}</span></p>
              <p>โต๊ะ: <span className="font-semibold">{data.tableNumber || "-"}</span></p>
            </div>
            <div className="text-right">
              <p>ชำระด้วย: <span className="font-semibold">{data.paymentMethod}</span></p>
              <p>ผู้สั่ง: {data.customerName || "ลูกค้าทั่วไป"}</p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-300 font-bold text-slate-600">
                <th className="pb-1">รายการ</th>
                <th className="pb-1 text-center">จำนวน</th>
                <th className="pb-1 text-right">รวม (฿)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((item, idx) => (
                <tr key={idx} className="py-1">
                  <td className="py-1">
                    <div>{item.menuItem.name}</div>
                    {item.specialNotes && <div className="text-[10px] text-slate-400">({item.specialNotes})</div>}
                  </td>
                  <td className="py-1 text-center">{item.quantity}</td>
                  <td className="py-1 text-right">{(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary */}
          <div className="pt-2 border-t border-dashed border-slate-300 space-y-1 text-right">
            <div className="flex justify-between">
              <span>ยอดรวมสินค้า:</span>
              <span>฿{data.subtotal.toLocaleString()}</span>
            </div>
            {data.discountAmount > 0 && (
              <div className="flex justify-between text-amber-600 font-semibold">
                <span>ส่วนลด:</span>
                <span>-฿{data.discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-navy-900 pt-1 border-t border-slate-200">
              <span>ยอดชำระสุทธิ:</span>
              <span>฿{data.netAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-[11px] pt-1">
              <span>รับเงิน:</span>
              <span>฿{data.amountPaid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>เงินทอน:</span>
              <span>฿{data.changeAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="text-center pt-4 border-t border-dashed border-slate-300 text-[10px] text-slate-400 font-sans">
            <p>ขอบคุณที่ใช้บริการ SMART RESTAURANT</p>
            <p>กรุณาเก็บบิลไว้เป็นหลักฐาน</p>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex space-x-3 no-print">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-electric-600 hover:bg-electric-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-electric-600/20 transition"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์ใบเสร็จ</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
