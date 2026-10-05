"use client";

import { useEffect, useState } from "react";
import { TrendingUp, AlertCircle, PieChart, ShieldAlert, CheckCircle2, DollarSign, Calculator } from "lucide-react";

interface FinancialData {
  salesTarget: number;
  actualRevenue: number;
  actualCost: number | null;
  actualExpense: number | null;
  netProfit: number | null;
  investorReturn: number | null;
  developerReturn: number | null;
  isRealDataAvailable: boolean;
}

export default function InvestmentPage() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          const rev = res.data.summary?.totalRevenue || 0;
          setData({
            salesTarget: 28000000,
            actualRevenue: rev,
            actualCost: null, // "ยังไม่มีข้อมูล"
            actualExpense: null, // "ยังไม่ได้กำหนด"
            netProfit: null,
            investorReturn: null,
            developerReturn: null,
            isRealDataAvailable: false,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-400 font-medium animate-pulse">กำลังโหลดโมเดลทางการเงิน...</div>;
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-electric-950 rounded-3xl p-6 text-white shadow-xl space-y-2">
        <div className="flex items-center space-x-2 text-gold-400 font-bold text-xs">
          <TrendingUp className="w-4 h-4" />
          <span>INVESTMENT & BUSINESS PRESENTATION MODULE</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight">โมเดลโครงสร้างการลงทุนและการจัดสรรกำไร</h1>
        <p className="text-xs text-slate-300">
          คำนวณและแสดงผลตอบแทนการลงทุนตามสมมติฐานทางธุรกิจ (Investor 75% / Developer 25%)
        </p>
      </div>

      {/* Target & Disclaimers */}
      <div className="bg-amber-50/90 border border-amber-300/80 rounded-3xl p-5 space-y-2 text-amber-900">
        <div className="flex items-center space-x-2 text-xs font-bold text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>ข้อความกำกับสำคัญ (Important Presentation Notices):</span>
        </div>
        <ul className="text-xs space-y-1 list-disc pl-5 font-medium text-amber-800">
          <li>
            <strong className="text-amber-950">Sales Target — สมมติฐานเพื่อการนำเสนอ:</strong> ฿28,000,000 (ยอดขายเป็นเพียงตัวเลขเป้าหมาย ไม่ใช่กำไรสุทธิ)
          </li>
          <li>
            <strong className="text-amber-950">ข้อเสนอเบื้องต้นเพื่อการเจรจา:</strong> โครงสร้างผลตอบแทนขึ้นอยู่กับกำไรสุทธิที่จัดสรรได้จริง (Distributable Profit)
          </li>
          <li>ไม่มีการแสดงผลตอบแทนที่รับประกัน (No Guaranteed Returns)</li>
        </ul>
      </div>

      {/* Sales Target Presentation Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-navy-900 flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-electric-600" />
            <span>เป้าหมายยอดขายเพื่อการนำเสนอ (Sales Target Presentation)</span>
          </h3>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gold-50 text-gold-700 border border-gold-300">
            สมมติฐาน ฿28,000,000
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-slate-400 block mb-1">เป้าหมายยอดขาย (Sales Target)</span>
            <span className="text-xl font-bold text-navy-900">฿28,000,000</span>
            <p className="text-[10px] text-slate-500 mt-1">“Sales Target — สมมติฐานเพื่อการนำเสนอ”</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-slate-400 block mb-1">รายได้จากการขายจริง (Actual Revenue)</span>
            <span className="text-xl font-bold text-electric-600">฿{data?.actualRevenue.toLocaleString()}</span>
            <p className="text-[10px] text-electric-600 mt-1">คำนวณจากออเดอร์ชำระเงินจริงในระบบ</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-slate-400 block mb-1">ต้นทุนวัตถุดิบ & ค่าใช้จ่าย</span>
            <span className="text-sm font-bold text-amber-600">
              {data && data.actualCost !== null ? `฿${data.actualCost}` : "ยังไม่มีข้อมูล"} /{" "}
              {data && data.actualExpense !== null ? `฿${data.actualExpense}` : "ยังไม่ได้กำหนด"}
            </span>
            <p className="text-[10px] text-slate-400 mt-1">แยก Revenue - Cost - Expense = Net Profit</p>
          </div>
        </div>
      </div>

      {/* Investment Profit Sharing Ratio Structure */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
        <h3 className="text-sm font-bold text-navy-900 flex items-center space-x-2">
          <PieChart className="w-5 h-5 text-electric-600" />
          <span>สัดส่วนโครงสร้างผลตอบแทนการลงทุน (Investment Profit Split)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Investor 75% */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-electric-900 to-navy-950 text-white shadow-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-electric-300">นักลงทุน (Investor)</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-electric-500 text-white">75%</span>
            </div>
            <div className="text-2xl font-bold font-mono">
              {data?.investorReturn !== null ? `฿${data?.investorReturn.toLocaleString()}` : "ยังไม่มีข้อมูลกำไรสุทธิ"}
            </div>
            <p className="text-[11px] text-slate-300">
              สูตรคำนวณ: Distributable Profit × 75% (คำนวณจากกำไรสุทธิหลังหักต้นทุนและค่าใช้จ่าย)
            </p>
          </div>

          {/* Developer 25% */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-navy-900 text-white shadow-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-gold-400">ทีมผู้พัฒนา (Developer)</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-gold-600 text-white">25%</span>
            </div>
            <div className="text-2xl font-bold font-mono">
              {data?.developerReturn !== null ? `฿${data?.developerReturn.toLocaleString()}` : "ยังไม่มีข้อมูลกำไรสุทธิ"}
            </div>
            <p className="text-[11px] text-slate-300">
              สูตรคำนวณ: Distributable Profit × 25% (ข้อเสนอเบื้องต้นเพื่อการเจรจา)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
