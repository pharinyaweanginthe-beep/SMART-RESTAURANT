"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, LockKeyhole, QrCode, UtensilsCrossed } from "lucide-react";

interface Favorite {
  id: string;
  menuItem: { id: string; name: string; price: number; imageUrl?: string | null; category: { name: string } };
}
interface CustomerProfile {
  user: { name: string; email: string };
  member: { id: string; name: string; phone: string; points: number; totalSpending: number } | null;
}

export default function CustomerMenuEntryPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetch("/api/customer/favorites"), fetch("/api/customer/profile")])
      .then(async ([favoriteResponse, profileResponse]) => {
        if (!favoriteResponse.ok || !profileResponse.ok) {
          setSignedIn(false);
          return;
        }
        const [favoriteResult, profileResult] = await Promise.all([
          favoriteResponse.json(),
          profileResponse.json(),
        ]);
        if (favoriteResult.success && profileResult.success) {
          setSignedIn(true);
          setFavorites(favoriteResult.data);
          setProfile(profileResult.data);
        }
      })
      .catch(() => setSignedIn(false))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-navy-900">
      <section className="mx-auto max-w-xl rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-electric-600 text-white">
          <UtensilsCrossed className="h-7 w-7" />
        </div>
        <div className="mt-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-electric-600">Customer Account</p>
          <h1 className="mt-1 text-2xl font-bold">{signedIn ? `สวัสดี ${profile?.user.name}` : "ยินดีต้อนรับ"}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {signedIn ? "รายการอาหารที่บันทึกไว้" : "สแกน QR Code ประจำโต๊ะเพื่อเลือกอาหาร"}
          </p>
        </div>

        {!signedIn && (
          <>
            <div className="mt-6 rounded-2xl bg-electric-50 p-4 text-sm text-electric-900">
              <div className="flex items-center gap-2 font-bold"><QrCode className="h-4 w-4" />สั่งอาหารผ่าน QR ประจำโต๊ะ</div>
              <p className="mt-1 text-xs leading-5">QR Code ยืนยันสาขาและโต๊ะเพื่อส่งรายการไปยังห้องครัวที่ถูกต้อง</p>
            </div>
            <Link href="/login" className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
              <LockKeyhole className="h-4 w-4" />เข้าสู่ระบบเพื่อรับสิทธิพิเศษ
            </Link>
          </>
        )}

        {signedIn && (
          <>
          <section className="mt-6 rounded-2xl bg-navy-950 p-4 text-white">
            <h2 className="text-sm font-bold">ข้อมูลสมาชิก</h2>
            {profile?.member ? (
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <p>Member ID: <span className="font-mono text-electric-300">{profile.member.id.slice(0, 8)}</span></p>
                <p>คะแนน: <span className="font-bold text-gold-400">{profile.member.points}</span></p>
                <p className="col-span-2 text-slate-300">ยอดใช้จ่ายสะสม ฿{profile.member.totalSpending.toLocaleString()}</p>
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-300">บัญชีนี้ยังไม่ได้ผูกกับสมาชิกสะสมคะแนน</p>
            )}
          </section>
          <section className="mt-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold"><Heart className="h-4 w-4 fill-rose-500 text-rose-500" />เมนูโปรด</h2>
            {loading ? (
              <div className="space-y-3">{[1, 2].map((key) => <div key={key} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
            ) : favorites.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 p-5 text-center text-xs text-slate-500">ยังไม่มีเมนูโปรด เพิ่มเมนูจากหน้าร้านได้เลย</p>
            ) : (
              <div className="space-y-2">
                {favorites.map(({ id, menuItem }) => (
                  <div key={id} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
                    <img
                      src={menuItem.imageUrl || "/menu-items/food-placeholder.svg"}
                      alt={menuItem.name}
                      className="h-14 w-14 rounded-xl object-cover"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = "/menu-items/food-placeholder.svg";
                      }}
                    />
                    <div><p className="text-sm font-semibold">{menuItem.name}</p><p className="text-[10px] text-slate-500">{menuItem.category.name} · ฿{menuItem.price}</p></div>
                  </div>
                ))}
              </div>
            )}
          </section>
          </>
        )}
      </section>
    </main>
  );
}
