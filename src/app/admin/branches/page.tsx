"use client";

import { useEffect, useState } from "react";
import { Building2, Plus, Phone, MapPin, Clock } from "lucide-react";

interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  openingHours?: string;
  status: string;
  restaurant?: { name: string };
}

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Branch Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [openingHours, setOpeningHours] = useState("10:00 - 22:00");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchBranches = async () => {
    try {
      const res = await fetch("/api/branches");
      const data = await res.json();
      if (data.success) setBranches(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: branches[0]?.restaurant ? (branches[0] as any).restaurantId : "",
          name,
          code,
          address,
          phone,
          openingHours,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error || "เกิดข้อผิดพลาดในการสร้างสาขา");
      } else {
        setShowModal(false);
        setName("");
        setCode("");
        setAddress("");
        setPhone("");
        fetchBranches();
      }
    } catch (err) {
      setErrorMsg("เกิดข้อผิดพลาดทางเทคนิค");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 font-medium animate-pulse">กำลังโหลดข้อมูลสาขา...</div>;
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-card">
        <div>
          <h1 className="text-xl font-bold text-navy-900 flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-gold-600" />
            <span>จัดการสาขาร้านอาหาร (Multi-Branch Management)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">บริหารจัดการหลายสาขาในระบบเดียว (Multi-Tenant Ready)</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-gold-600 hover:bg-gold-700 text-white font-bold rounded-2xl text-xs flex items-center space-x-2 shadow-lg shadow-gold-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มสาขาใหม่</span>
        </button>
      </div>

      {/* Branch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((b) => (
          <div key={b.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-card space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-mono font-bold text-gold-600 bg-gold-50 px-2 py-0.5 rounded-lg border border-gold-200">
                  {b.code}
                </span>
                <h3 className="font-bold text-base text-navy-900 mt-1">{b.name}</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {b.status}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
              {b.address && (
                <p className="flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{b.address}</span>
                </p>
              )}
              {b.phone && (
                <p className="flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono">{b.phone}</span>
                </p>
              )}
              {b.openingHours && (
                <p className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>เวลาเปิด-ปิด: {b.openingHours}</span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Branch Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateBranch} className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-navy-900">เพิ่มสาขาร้านอาหารใหม่</h3>

            {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}

            <div>
              <label className="block text-xs font-semibold mb-1">ชื่อสาขา</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น สาขา 3 (ทองหล่อ)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">รหัสสาขา (Branch Code)</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="เช่น BR-003"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">ที่อยู่</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ที่อยู่สาขา..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">เบอร์โทรศัพท์</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="02-xxx-xxxx"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">เวลาเปิด-ปิด</label>
              <input
                type="text"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="10:00 - 22:00"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div className="flex space-x-3 pt-3">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-gold-600 text-white font-bold rounded-xl text-xs hover:bg-gold-700 transition"
              >
                สร้างสาขา
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
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
