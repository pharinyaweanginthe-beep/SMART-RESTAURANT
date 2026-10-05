"use client";

import { useEffect, useState } from "react";
import { UserCheck, Plus, Shield, Mail, Lock, AlertCircle } from "lucide-react";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  branch?: { name: string };
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STAFF");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error || "เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน");
      } else {
        setShowModal(false);
        setName("");
        setEmail("");
        setPassword("");
        setRole("STAFF");
        fetchUsers();
      }
    } catch (err: any) {
      setErrorMsg("ไม่สามารถสร้างผู้ใช้งานได้");
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 font-medium animate-pulse">กำลังโหลดผู้ใช้งาน...</div>;
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-card">
        <div>
          <h1 className="text-xl font-bold text-navy-900 flex items-center space-x-2">
            <UserCheck className="w-6 h-6 text-gold-600" />
            <span>จัดการผู้ใช้งานระบบ (User & Role Management)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">กำหนดสิทธิ์ตามบทบาท (RBAC) ระดับ Admin, Manager, Cashier, Kitchen, Staff</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-gold-600 hover:bg-gold-700 text-white font-bold rounded-2xl text-xs flex items-center space-x-2 shadow-lg shadow-gold-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มผู้ใช้งานใหม่</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-medium text-[11px] uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4">ชื่อผู้ใช้</th>
                <th className="py-3 px-4">อีเมล</th>
                <th className="py-3 px-4">บทบาท (Role)</th>
                <th className="py-3 px-4">สาขา</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
                <th className="py-3 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4 font-bold text-navy-900">{u.name}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono">{u.email}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-navy-900 text-gold-400">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{u.branch?.name || "ทุกสาขา"}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handleToggleStatus(u.id, u.status)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-[11px] transition"
                    >
                      {u.status === "ACTIVE" ? "ระงับการใช้งาน" : "เปิดใช้งาน"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateUser} className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-navy-900">เพิ่มผู้ใช้งานใหม่เข้าสู่ระบบ</h3>

            {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}

            <div>
              <label className="block text-xs font-semibold mb-1">ชื่อ-นามสกุล</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น นายสมชาย หัวหน้าครัว"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">อีเมลผู้ใช้</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@smartrestaurant.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">รหัสผ่าน</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">บทบาท (Role)</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none font-semibold"
              >
                <option value="ADMIN">ADMIN (ผู้ดูแลระบบสูงสุด)</option>
                <option value="MANAGER">MANAGER (ผู้จัดการร้าน)</option>
                <option value="CASHIER">CASHIER (แคชเชียร์)</option>
                <option value="KITCHEN">KITCHEN (หัวหน้าครัว)</option>
                <option value="STAFF">STAFF (พนักงานเสิร์ฟ)</option>
              </select>
            </div>

            <div className="flex space-x-3 pt-3">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-gold-600 text-white font-bold rounded-xl text-xs hover:bg-gold-700 transition"
              >
                สร้างบัญชีผู้ใช้
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
