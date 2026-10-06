"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; role: string; email: string } | null>(null);
  const [currentBranchId, setCurrentBranchId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Exclude customer pages from internal dashboard sidebar layout
  const isCustomerPage =
    pathname === "/" ||
    pathname.startsWith("/menu/") ||
    pathname.startsWith("/order/") ||
    pathname === "/customer-menu" ||
    pathname === "/login";

  useEffect(() => {
    if (isCustomerPage) {
      setLoading(false);
      return;
    }

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setUser(data.data);
          if (data.data.branchId) setCurrentBranchId(data.data.branchId);
        } else {
          router.push("/login");
        }
      })
      .catch(() => {
        router.push("/login");
      })
      .finally(() => setLoading(false));
  }, [pathname, isCustomerPage, router]);

  const handleLogout = async () => {
    await fetch("/api/auth/me", { method: "POST" });
    router.push("/login");
  };

  if (isCustomerPage) {
    return <main className="min-h-screen bg-slate-50">{children}</main>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-electric-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold tracking-wider text-slate-400">กำลังโหลดระบบ SMART RESTAURANT...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <Sidebar userRole={user?.role} userName={user?.name} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          currentBranchId={currentBranchId}
          onBranchChange={setCurrentBranchId}
          title="ระบบบริหารจัดการร้านอาหารอัจฉริยะ"
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
