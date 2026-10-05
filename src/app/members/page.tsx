"use client";

import { useEffect, useState } from "react";
import { Users, Search, Plus, Award, Phone, Mail, DollarSign } from "lucide-react";

interface Member {
  id: string;
  name: string;
  phone: string;
  email?: string;
  points: number;
  totalSpending: number;
  createdAt: string;
  memberPoints: any[];
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Add Member Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/members${search ? `?search=${search}` : ""}`);
      const data = await res.json();
      if (data.success) setMembers(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [search]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email }),
      });

      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
      } else {
        setShowModal(false);
        setName("");
        setPhone("");
        setEmail("");
        fetchMembers();
      }
    } catch (err) {
      setErrorMsg("เกิดข้อผิดพลาดทางเทคนิค");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 font-medium animate-pulse">กำลังโหลดข้อมูลระบบสมาชิก...</div>;
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-card">
        <div>
          <h1 className="text-xl font-bold text-navy-900 flex items-center space-x-2">
            <Users className="w-6 h-6 text-electric-600" />
            <span>ระบบบริหารจัดการสมาชิกและแต้มสะสม (Member Loyalty System)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">สมัครสมาชิก สะสมแต้มอัตโนมัติ (1 แต้ม ต่อทุกๆ ฿50)</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-electric-600 hover:bg-electric-700 text-white font-bold rounded-2xl text-xs flex items-center space-x-2 shadow-lg shadow-electric-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>สมัครสมาชิกใหม่</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาตามชื่อสมาชิก เบอร์โทรศัพท์ หรืออีเมล..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((m) => (
          <div key={m.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-card space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-electric-50 text-electric-600 font-bold flex items-center justify-center text-sm">
                  {m.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-navy-900">{m.name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono flex items-center space-x-1 mt-0.5">
                    <Phone className="w-3 h-3 inline text-slate-400" />
                    <span>{m.phone}</span>
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center space-x-1">
                <Award className="w-3.5 h-3.5 text-gold-500" />
                <span>{m.points} แต้ม</span>
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">ยอดซื้อสะสม</span>
                <span className="font-bold text-navy-900">฿{m.totalSpending.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">วันที่สมัคร</span>
                <span className="font-mono text-[11px] text-slate-600">
                  {new Date(m.createdAt).toLocaleDateString("th-TH")}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Member Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddMember} className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-navy-900">ลงทะเบียนสมัครสมาชิกใหม่</h3>

            {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}

            <div>
              <label className="block text-xs font-semibold mb-1">ชื่อ-นามสกุล</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น คุณวิภาวรรณ สุขเสริฐ"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">เบอร์โทรศัพท์ (ใช้สะสมแต้ม)</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="เช่น 0891234567"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">อีเมล (ตัวเลือก)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div className="flex space-x-3 pt-3">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-electric-600 text-white font-bold rounded-xl text-xs hover:bg-electric-700 transition"
              >
                ยืนยันลงทะเบียน
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
