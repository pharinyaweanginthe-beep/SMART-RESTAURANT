"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { AlertCircle, Flame, Heart, Search, Sparkles, UtensilsCrossed } from "lucide-react";
import { CustomerMenuShell } from "@/components/CustomerMenuShell";
import { readCustomerCart, writeCustomerCart, type CustomerCartItem } from "@/lib/customer-cart";

interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  categoryId: string;
  category: { name: string };
  isAvailable: boolean;
  availableNow: boolean;
  isFeatured: boolean;
  popularity: number;
  options: { id: string; name: string; groupName: string; price: number; selectionMode: string }[];
}

interface CustomerMenuData {
  restaurant: { name: string; logo?: string | null };
  branch: { name: string; openingHours?: string | null; isOpen: boolean };
  table: { id: string; number: string; status: string };
  items: MenuItem[];
  categories: { id: string; name: string }[];
  promotions: { id: string; code: string; type: string; value: number; minPurchase: number }[];
}

const placeholderImage = "/menu-items/food-placeholder.svg";

export default function CustomerQRMenuPage() {
  const params = useParams<{ tableId: string }>();
  const searchParams = useSearchParams();
  const tableRef = params.tableId;
  const qrToken = searchParams.get("qr") || "";
  const query = searchParams.toString();
  const [data, setData] = useState<CustomerMenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sort, setSort] = useState("recommended");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const fetchMenu = useCallback(async () => {
    if (!qrToken) {
      setError("QR Code ไม่ถูกต้อง กรุณาสแกน QR Code ที่โต๊ะอีกครั้ง");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ qr: qrToken });
    if (search.trim()) params.set("q", search.trim());
    if (categoryId) params.set("category", categoryId);
    if (sort !== "recommended") params.set("sort", sort);
    if (availableOnly) params.set("available", "true");
    try {
      const response = await fetch(`/api/customer/menu/${encodeURIComponent(tableRef)}?${params}`);
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "ไม่สามารถโหลดเมนูได้");
      setData(result.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "ไม่สามารถโหลดเมนูได้");
    } finally {
      setLoading(false);
    }
  }, [availableOnly, categoryId, qrToken, search, sort, tableRef]);

  useEffect(() => {
    const timer = window.setTimeout(fetchMenu, search ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [fetchMenu, search]);

  useEffect(() => {
    fetch("/api/customer/favorites")
      .then((response) => (response.ok ? response.json() : null))
      .then((result) => {
        if (result?.success) setFavoriteIds(result.data.map((favorite: { menuItemId: string }) => favorite.menuItemId));
      })
      .catch(() => {});
  }, []);

  const toggleFavorite = async (itemId: string) => {
    const isFavorite = favoriteIds.includes(itemId);
    try {
      const response = await fetch(
        isFavorite
          ? `/api/customer/favorites?menuItemId=${encodeURIComponent(itemId)}`
          : "/api/customer/favorites",
        {
          method: isFavorite ? "DELETE" : "POST",
          ...(isFavorite
            ? {}
            : {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ menuItemId: itemId }),
              }),
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "เข้าสู่ระบบเพื่อบันทึกเมนูโปรด");
      setFavoriteIds((current) => isFavorite ? current.filter((id) => id !== itemId) : [...current, itemId]);
      setRequestMessage(isFavorite ? "นำเมนูออกจากรายการโปรดแล้ว" : "บันทึกเมนูโปรดแล้ว");
    } catch (favoriteError) {
      setRequestMessage(favoriteError instanceof Error ? favoriteError.message : "เข้าสู่ระบบเพื่อบันทึกเมนูโปรด");
    }
  };

  const addToCart = (item: MenuItem) => {
    if (!item.availableNow || !data?.branch.isOpen) return;
    const cart = readCustomerCart(tableRef);
    const keyFor = (entry: CustomerCartItem) => `${entry.menuItemId}:`;
    const index = cart.findIndex((entry) => keyFor(entry) === `${item.id}:` && entry.selectedOptions.length === 0);
    if (index >= 0) cart[index] = { ...cart[index], quantity: cart[index].quantity + 1 };
    else {
      cart.push({
        menuItemId: item.id,
        name: item.name,
        description: item.description,
        imageUrl: item.imageUrl,
        basePrice: item.price,
        quantity: 1,
        specialNotes: "",
        selectedOptions: [],
      });
    }
    writeCustomerCart(tableRef, cart);
  };

  const callService = async (type: "CALL_STAFF" | "WATER" | "CUTLERY" | "BILL") => {
    setRequestMessage("");
    try {
      const response = await fetch("/api/customer/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: tableRef, qr: qrToken, type }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "ไม่สามารถส่งคำขอได้");
      setRequestMessage(type === "BILL" ? "ส่งคำขอเช็คบิลให้พนักงานแล้ว" : "ส่งคำขอให้พนักงานแล้ว");
      setRequestOpen(false);
    } catch (requestError) {
      setRequestMessage(requestError instanceof Error ? requestError.message : "ไม่สามารถส่งคำขอได้");
    }
  };

  const cards = useMemo(() => data?.items || [], [data]);
  const qrSuffix = `?${query}`;

  return (
    <CustomerMenuShell
      tableRef={tableRef}
      qrToken={qrToken}
      tableNumber={data?.table.number || tableRef}
      restaurantName={data?.restaurant.name || "ร้านอาหาร"}
    >
      <main className="min-h-screen px-4 pb-32 pt-4">
        {data && (
          <>
            <section className="mb-5 overflow-hidden rounded-3xl bg-navy-950 p-5 text-white">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {data.restaurant.logo ? (
                    <img
                      src={data.restaurant.logo}
                      alt={`โลโก้ ${data.restaurant.name}`}
                      className="h-12 w-12 rounded-2xl bg-white object-cover"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = placeholderImage;
                      }}
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-electric-600">
                      <UtensilsCrossed className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h1 className="truncate text-lg font-bold">{data.restaurant.name}</h1>
                    <p className="truncate text-xs text-slate-300">{data.branch.name}</p>
                  </div>
                </div>
                <div
                  className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold ${
                    data.branch.isOpen ? "bg-emerald-500/20 text-emerald-200" : "bg-red-500/20 text-red-200"
                  }`}
                >
                  {data.branch.isOpen ? "เปิดให้บริการ" : "ปิดให้บริการ"}
                </div>
              </div>
              <div className="mt-5 flex items-end justify-between">
                <div>
                  <p className="text-[11px] text-slate-300">โต๊ะ {data.table.number}</p>
                  <p className="mt-0.5 text-sm font-semibold">สั่งอาหารได้เลย</p>
                </div>
                <p className="text-[10px] text-slate-400">เวลา {data.branch.openingHours || "สอบถามพนักงาน"}</p>
              </div>
            </section>

            {!data.branch.isOpen && (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                ขณะนี้ร้านปิดให้บริการ · เวลาเปิด {data.branch.openingHours || "โปรดสอบถามพนักงาน"}
              </div>
            )}

            {data.promotions.length > 0 && (
              <section className="mb-5">
                <h2 className="mb-2 flex items-center gap-2 text-sm font-bold">
                  <Flame className="h-4 w-4 text-amber-500" /> โปรโมชั่นพิเศษ
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {data.promotions.map((promotion) => (
                    <div
                      key={promotion.id}
                      className="min-w-56 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 p-4 ring-1 ring-amber-100"
                    >
                      <p className="text-xs font-bold text-amber-900">
                        {promotion.type === "PERCENTAGE" ? `ลด ${promotion.value}%` : `ลด ฿${promotion.value}`}
                      </p>
                      <p className="mt-1 text-[11px] text-amber-800">
                        โค้ด {promotion.code} · ขั้นต่ำ ฿{promotion.minPurchase}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <label className="relative block">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ค้นหาเมนูอาหาร..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-electric-500 focus:bg-white focus:ring-2 focus:ring-electric-100"
          />
        </label>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2" aria-label="หมวดหมู่อาหาร">
          <button
            onClick={() => setCategoryId("")}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold ${
              !categoryId ? "bg-electric-600 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            ทั้งหมด
          </button>
          {data?.categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setCategoryId(category.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold ${
                categoryId === category.id ? "bg-electric-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
            aria-label="เรียงเมนู"
          >
            <option value="recommended">เมนูแนะนำ</option>
            <option value="popular">ความนิยม</option>
            <option value="new">เมนูใหม่</option>
            <option value="price-asc">ราคา: ต่ำไปสูง</option>
            <option value="price-desc">ราคา: สูงไปต่ำ</option>
          </select>
          <label className="flex items-center gap-2 whitespace-nowrap rounded-xl bg-slate-100 px-3 py-2 text-xs">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(event) => setAvailableOnly(event.target.checked)}
              className="accent-blue-600"
            />
            พร้อมขาย
          </label>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
            <AlertCircle className="mx-auto mb-2 h-6 w-6 text-red-500" />
            <p className="text-sm text-red-800">{error}</p>
            <button onClick={fetchMenu} className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white">
              ลองใหม่
            </button>
          </div>
        ) : loading ? (
          <div className="mt-5 grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-64 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="mt-10 rounded-3xl bg-slate-50 p-8 text-center">
            <UtensilsCrossed className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">ยังไม่มีเมนูอาหาร</p>
            <p className="mt-1 text-xs text-slate-400">ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น</p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {cards.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="relative aspect-[4/3] bg-slate-100">
                  <Link href={`/menu/${encodeURIComponent(tableRef)}/item/${item.id}${qrSuffix}`} className="block h-full">
                    <img
                      src={item.imageUrl || placeholderImage}
                      alt={item.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = placeholderImage;
                      }}
                    />
                  </Link>
                  {item.isFeatured && (
                    <span className="pointer-events-none absolute left-2 top-2 flex items-center gap-1 rounded-full bg-gold-500 px-2 py-1 text-[9px] font-bold text-white">
                      <Sparkles className="h-3 w-3" /> แนะนำ
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleFavorite(item.id)}
                    aria-label={favoriteIds.includes(item.id) ? "นำออกจากเมนูโปรด" : "เพิ่มเมนูโปรด"}
                    className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-rose-500 shadow"
                  >
                    <Heart className={`h-4 w-4 ${favoriteIds.includes(item.id) ? "fill-rose-500" : ""}`} />
                  </button>
                </div>
                <Link href={`/menu/${encodeURIComponent(tableRef)}/item/${item.id}${qrSuffix}`} className="block">
                  <div className="px-3 pt-3">
                    <p className="line-clamp-1 text-xs font-bold">{item.name}</p>
                    <p className="mt-1 line-clamp-2 min-h-8 text-[10px] leading-4 text-slate-500">
                      {item.description || item.category.name}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center justify-between gap-1 px-3 pb-3 pt-2">
                  <div>
                    <p className="text-sm font-bold text-electric-700">฿{item.price}</p>
                    <p className={`text-[9px] ${item.availableNow ? "text-emerald-600" : "text-red-500"}`}>
                      {item.availableNow ? "พร้อมสั่ง" : "หมดชั่วคราว"}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!item.availableNow || !data?.branch.isOpen}
                    onClick={() => addToCart(item)}
                    className="rounded-xl bg-electric-600 px-3 py-2 text-[10px] font-bold text-white transition active:scale-95 disabled:bg-slate-300"
                  >
                    เพิ่มลงตะกร้า
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-4">
          <h2 className="text-sm font-bold">ต้องการให้ช่วยเหลือไหม?</h2>
          {requestMessage && <p className="mt-2 text-xs text-emerald-700">{requestMessage}</p>}
          <button
            type="button"
            onClick={() => setRequestOpen(true)}
            className="mt-3 w-full rounded-xl border border-slate-200 py-3 text-xs font-semibold text-navy-900"
          >
            🔔 เรียกพนักงาน / ขอเช็คบิล
          </button>
        </section>

        {requestOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/60 p-3 sm:items-center">
            <div className="w-full max-w-md rounded-3xl bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold">ต้องการความช่วยเหลือ</h2>
                <button onClick={() => setRequestOpen(false)} className="rounded-lg px-3 py-1 text-slate-500">ปิด</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["CALL_STAFF", "🔔 เรียกพนักงาน"],
                  ["WATER", "💧 ขอน้ำ"],
                  ["CUTLERY", "🍽️ ขอช้อน/ส้อม"],
                  ["BILL", "💳 ขอเช็คบิล"],
                ].map(([type, label]) => (
                  <button
                    key={type}
                    onClick={() => callService(type as "CALL_STAFF" | "WATER" | "CUTLERY" | "BILL")}
                    className="min-h-14 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold active:scale-95"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </CustomerMenuShell>
  );
}
