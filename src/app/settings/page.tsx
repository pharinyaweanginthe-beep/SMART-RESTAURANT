"use client";

import { useState } from "react";
import { Settings as SettingsIcon, Save, Store, Receipt, Bell, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  const [restaurantName, setRestaurantName] = useState("SMART RESTAURANT");
  const [taxRate, setTaxRate] = useState("7");
  const [serviceCharge, setServiceCharge] = useState("0");
  const [currency, setCurrency] = useState("THB (฿)");
  const [receiptFooter, setReceiptFooter] = useState("ขอบคุณที่ใช้บริการ SMART RESTAURANT");
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="space-y-6 font-sans max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-card">
        <div>
          <h1 className="text-xl font-bold text-navy-900 flex items-center space-x-2">
            <SettingsIcon className="w-6 h-6 text-electric-600" />
            <span>ตั้งค่าระบบร้านอาหาร (System Settings)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">จัดการข้อมูลร้าน ภาษี VAT, Service Charge และใบเสร็จรับเงิน</p>
        </div>
      </div>

      {savedMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold animate-in fade-in">
          บันทึกการตั้งค่าระบบเรียบร้อยแล้ว!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Restaurant Settings */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-navy-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Store className="w-4 h-4 text-electric-600" />
            <span>ข้อมูลทั่วไปของร้านอาหาร (Restaurant Info)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1">ชื่อร้านอาหาร</label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">สกุลเงินประจำระบบ</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Tax & Financial Settings */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-navy-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Receipt className="w-4 h-4 text-electric-600" />
            <span>ภาษีมูลค่าเพิ่ม (VAT) & ค่าบริการ (Service Charge)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1">ภาษีมูลค่าเพิ่ม VAT (%)</label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">ค่าบริการ Service Charge (%)</label>
              <input
                type="number"
                value={serviceCharge}
                onChange={(e) => setServiceCharge(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Receipt Settings */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-navy-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Bell className="w-4 h-4 text-electric-600" />
            <span>ข้อความท้ายใบเสร็จ (Receipt Footer)</span>
          </h3>

          <div>
            <textarea
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-3 bg-electric-600 hover:bg-electric-700 text-white font-bold rounded-2xl text-xs flex items-center space-x-2 shadow-lg shadow-electric-600/30 transition"
        >
          <Save className="w-4 h-4" />
          <span>บันทึกการตั้งค่า</span>
        </button>
      </form>
    </div>
  );
}
