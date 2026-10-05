"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UtensilsCrossed, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      } else {
        router.push(data.data.user.role === "CUSTOMER" ? "/customer-menu" : "/dashboard");
      }
    } catch (err: any) {
      setError("เกิดข้อผิดพลาดทางเทคนิค กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("password123");
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-electric-600/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gold-600/10 rounded-full blur-3xl" />

      <div className="max-w-md w-full space-y-8 z-10">
        {/* Logo & Branding */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-electric-600 to-electric-400 flex items-center justify-center mx-auto shadow-xl shadow-electric-600/30 border border-electric-400/30">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-4">SMART RESTAURANT</h1>
          <p className="text-xs text-slate-400 font-medium">ระบบบริหารจัดการร้านอาหารอัจฉริยะ (Enterprise SaaS)</p>
        </div>

        {/* Form Card */}
        <div className="glass-panel-dark rounded-3xl p-8 shadow-2xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-sm font-semibold text-white">เข้าสู่ระบบ (Sign In)</h2>
            <div className="flex items-center space-x-1 text-[11px] text-electric-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Secure Session</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">อีเมลผู้ใช้งาน (Email)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@smartrestaurant.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-navy-900/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">รหัสผ่าน (Password)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-navy-900/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-electric-600 hover:bg-electric-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-electric-600/30 transition disabled:opacity-50"
            >
              <span>{loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบระบบร้านค้า"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <Link
            href="/customer-menu"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-electric-400/40 bg-electric-500/10 py-3 text-xs font-semibold text-electric-300 transition hover:bg-electric-500/20"
          >
            <UtensilsCrossed className="h-4 w-4" />
            <span>เมนูลูกค้า · เลือกอาหารและสั่งที่โต๊ะ</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          {/* Quick Demo Login Preset Buttons */}
          <div className="pt-4 border-t border-white/10 space-y-2">
            <p className="text-[11px] font-semibold text-gold-400 text-center uppercase tracking-wider">
              ทดสอบระบบเร็ว (Demo Accounts)
            </p>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@smartrestaurant.com")}
                className="p-2 bg-navy-900 hover:bg-navy-800 rounded-lg text-slate-300 border border-slate-700 text-left transition"
              >
                <span className="font-bold text-electric-400">ADMIN:</span> admin@...
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("manager@smartrestaurant.com")}
                className="p-2 bg-navy-900 hover:bg-navy-800 rounded-lg text-slate-300 border border-slate-700 text-left transition"
              >
                <span className="font-bold text-emerald-400">MANAGER:</span> manager@...
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("cashier@smartrestaurant.com")}
                className="p-2 bg-navy-900 hover:bg-navy-800 rounded-lg text-slate-300 border border-slate-700 text-left transition"
              >
                <span className="font-bold text-amber-400">CASHIER:</span> cashier@...
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("kitchen@smartrestaurant.com")}
                className="p-2 bg-navy-900 hover:bg-navy-800 rounded-lg text-slate-300 border border-slate-700 text-left transition"
              >
                <span className="font-bold text-purple-400">KITCHEN:</span> kitchen@...
              </button>
            </div>
            <p className="text-[10px] text-slate-500 text-center mt-1">รหัสผ่านเริ่มต้นสำหรับทุกบัญชี: password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
