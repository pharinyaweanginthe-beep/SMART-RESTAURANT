"use client";

import { useEffect, useState } from "react";
import { BarChart3, Download, DollarSign, ShoppingBag, TrendingUp, CreditCard } from "lucide-react";

export default function ReportsPage() {
  const [range, setRange] = useState("today");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?range=${range}`);
      const data = await res.json();
      if (data.success) setReportData(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [range]);

  const handleExportCSV = () => {
    if (!reportData || !reportData.orders) return;

    const headers = ["OrderNumber", "Table", "Customer", "Subtotal", "Discount", "NetAmount", "PaymentMethod", "Date"];
    const rows = reportData.orders.map((o: any) => [
      o.orderNumber,
      o.table?.number || "-",
      o.customerName || "ลูกค้าทั่วไป",
      o.subtotal,
      o.discountAmount,
      o.netAmount,
      o.payment?.paymentMethod || "-",
      new Date(o.createdAt).toLocaleString("th-TH"),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SalesReport_${range}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 font-medium animate-pulse">กำลังสรุปรายงานยอดขาย...</div>;
  }

  const summary = reportData?.summary || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };
  const paymentMethods = reportData?.paymentMethods || {};
  const bestSelling = reportData?.bestSelling || [];

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-card">
        <div>
          <h1 className="text-xl font-bold text-navy-900 flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-electric-600" />
            <span>รายงานสรุปยอดขายและการเงิน (Sales & Financial Reports)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">วิเคราะห์รายได้ วิธีการชำระเงิน และส่งออกรายงาน CSV</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-semibold">
            {[
              { key: "today", label: "วันนี้" },
              { key: "yesterday", label: "เมื่อวาน" },
              { key: "7days", label: "7 วัน" },
              { key: "30days", label: "30 วัน" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setRange(t.key)}
                className={`px-3 py-1.5 rounded-xl transition ${
                  range === t.key ? "bg-white text-navy-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center space-x-2 shadow-lg shadow-emerald-600/20 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-card space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold">รายได้รวมทั้งหมด</span>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-navy-900">฿{summary.totalRevenue.toLocaleString()}</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-card space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold">จำนวนออเดอร์</span>
            <ShoppingBag className="w-5 h-5 text-electric-600" />
          </div>
          <div className="text-2xl font-bold text-navy-900">{summary.totalOrders} บิล</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-card space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold">ยอดเฉลี่ยต่อบิล (AOV)</span>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-navy-900">฿{Math.round(summary.avgOrderValue).toLocaleString()}</div>
        </div>
      </div>

      {/* Payment Method & Best Selling */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-navy-900 flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-electric-600" />
            <span>แยกตามช่องทางการชำระเงิน (Payment Breakdown)</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-700">เงินสด (CASH)</span>
              <span className="font-bold text-emerald-600">฿{(paymentMethods.CASH || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-700">สแกน QR Code</span>
              <span className="font-bold text-electric-600">฿{(paymentMethods.QR_CODE || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-700">บัตรเครดิต (Credit Card)</span>
              <span className="font-bold text-purple-600">฿{(paymentMethods.CREDIT_CARD || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-navy-900">อันดับอาหารขายดีตามช่วงเวลา</h3>
          <div className="space-y-2.5 text-xs">
            {bestSelling.slice(0, 5).map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <span className="w-5 h-5 rounded-lg bg-electric-100 text-electric-700 font-bold text-[10px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-navy-900">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-electric-600">฿{item.revenue.toLocaleString()}</span>
                  <p className="text-[10px] text-slate-400">ขายได้ {item.qty} จาน</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
