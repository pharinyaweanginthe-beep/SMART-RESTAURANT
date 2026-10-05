"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { CustomerMenuShell } from "@/components/CustomerMenuShell";
import {
  customerCartTotal,
  readCustomerCart,
  writeCustomerCart,
  type CustomerCartItem,
} from "@/lib/customer-cart";

interface CartMenuItem {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  availableNow: boolean;
  options: { id: string; groupName: string; name: string; price: number }[];
}

interface CustomerContext {
  restaurant: { name: string };
  table: { number: string };
  branch: { isOpen: boolean; openingHours?: string | null };
  items: CartMenuItem[];
}

export default function CustomerCartPage() {
  const params = useParams<{ tableId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableRef = params.tableId;
  const qrToken = searchParams.get("qr") || "";
  const query = `?qr=${encodeURIComponent(qrToken)}`;
  const [cart, setCart] = useState<CustomerCartItem[]>([]);
  const [context, setContext] = useState<CustomerContext | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountMessage, setDiscountMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const refreshCart = useCallback(() => setCart(readCustomerCart(tableRef)), [tableRef]);

  useEffect(() => {
    refreshCart();
    window.addEventListener("customer-cart-updated", refreshCart);
    window.addEventListener("storage", refreshCart);
    return () => {
      window.removeEventListener("customer-cart-updated", refreshCart);
      window.removeEventListener("storage", refreshCart);
    };
  }, [refreshCart]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!qrToken) {
        setError("QR Code ไม่ถูกต้อง กรุณาสแกน QR Code ที่โต๊ะอีกครั้ง");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(
          `/api/customer/menu/${encodeURIComponent(tableRef)}?qr=${encodeURIComponent(qrToken)}`
        );
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || "ไม่สามารถโหลดข้อมูลโต๊ะได้");
        if (cancelled) return;
        setContext(result.data);
        const currentCart = readCustomerCart(tableRef);
        const refreshedCart = currentCart.map((line) => {
          const item = (result.data.items as CartMenuItem[]).find((candidate) => candidate.id === line.menuItemId);
          if (!item) return line;
          const options = line.selectedOptions
            .map((selected) => item.options.find((option) => option.id === selected.id) || selected)
            .map(({ id, groupName, name, price }) => ({ id, groupName, name, price }));
          return {
            ...line,
            name: item.name,
            basePrice: item.price,
            selectedOptions: options,
          };
        });
        setCart(refreshedCart);
        writeCustomerCart(tableRef, refreshedCart);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "ไม่สามารถโหลดข้อมูลโต๊ะได้");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [qrToken, tableRef]);

  const subtotal = useMemo(() => customerCartTotal(cart), [cart]);
  const total = Math.max(0, subtotal - discountAmount);
  const unavailable = cart.filter((line) => {
    const current = context?.items.find((item) => item.id === line.menuItemId);
    return (
      !current?.availableNow ||
      !current.isAvailable ||
      line.selectedOptions.some((option) => !current.options.some((currentOption) => currentOption.id === option.id))
    );
  });
  const updateCart = (next: CustomerCartItem[]) => {
    setCart(next);
    writeCustomerCart(tableRef, next);
    setDiscountAmount(0);
    setDiscountMessage("");
  };

  const validateDiscount = async () => {
    if (!discountCode.trim()) return;
    setDiscountMessage("");
    try {
      const response = await fetch(
        `/api/customer/discounts?table=${encodeURIComponent(tableRef)}&qr=${encodeURIComponent(qrToken)}&code=${encodeURIComponent(discountCode.trim())}&subtotal=${subtotal}`
      );
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "โค้ดส่วนลดใช้ไม่ได้");
      setDiscountAmount(result.data.discountAmount);
      setDiscountMessage(`ใช้ส่วนลด ${result.data.code} สำเร็จ`);
    } catch (discountError) {
      setDiscountAmount(0);
      setDiscountMessage(discountError instanceof Error ? discountError.message : "โค้ดส่วนลดใช้ไม่ได้");
    }
  };

  const submitOrder = async () => {
    if (!cart.length || unavailable.length || !context?.branch.isOpen) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/customer/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: tableRef,
          qr: qrToken,
          customerName: customerName.trim() || undefined,
          specialNotes: orderNotes.trim() || undefined,
          discountCode: discountCode.trim() || undefined,
          items: cart.map((line) => ({
            menuItemId: line.menuItemId,
            quantity: line.quantity,
            specialNotes: line.specialNotes || undefined,
            selectedOptionIds: line.selectedOptions.map((option) => option.id),
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "ไม่สามารถยืนยันออเดอร์ได้");
      writeCustomerCart(tableRef, []);
      router.push(`/order/${result.data.id}?table=${encodeURIComponent(tableRef)}&qr=${encodeURIComponent(qrToken)}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "ไม่สามารถยืนยันออเดอร์ได้");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CustomerMenuShell
      tableRef={tableRef}
      qrToken={qrToken}
      tableNumber={context?.table.number || tableRef}
      restaurantName={context?.restaurant.name || "ร้านอาหาร"}
    >
      <main className="min-h-screen px-4 pb-32 pt-4">
        <Link href={`/menu/${encodeURIComponent(tableRef)}${query}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
          <ArrowLeft className="h-4 w-4" /> กลับไปเลือกอาหาร
        </Link>
        <h1 className="mt-4 text-xl font-bold">ตรวจสอบรายการอาหาร</h1>
        <p className="mt-1 text-xs text-slate-500">โต๊ะ {context?.table.number || tableRef}</p>

        {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {loading ? (
          <div className="mt-5 space-y-3">{[1, 2, 3].map((key) => <div key={key} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}</div>
        ) : cart.length === 0 ? (
          <div className="mt-6 rounded-3xl bg-slate-50 p-8 text-center">
            <ShoppingBag className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <p className="text-sm font-semibold">ตะกร้ายังว่างอยู่</p>
            <Link href={`/menu/${encodeURIComponent(tableRef)}${query}`} className="mt-4 inline-block rounded-xl bg-electric-600 px-4 py-2 text-xs font-bold text-white">
              เลือกอาหาร
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-5 space-y-3">
              {cart.map((line, index) => (
                <article key={`${line.menuItemId}-${index}`} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex gap-3">
                    <img
                      src={line.imageUrl || "/menu-items/food-placeholder.svg"}
                      alt={line.name}
                      className="h-16 w-16 rounded-xl bg-slate-100 object-cover"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = "/menu-items/food-placeholder.svg";
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h2 className="text-sm font-bold">{line.name}</h2>
                          {line.selectedOptions.map((option) => <p key={option.id} className="mt-1 text-[10px] text-slate-500">{option.name}{option.price ? ` +฿${option.price}` : ""}</p>)}
                        </div>
                        <span className="whitespace-nowrap text-sm font-bold text-electric-700">฿{(line.basePrice + line.selectedOptions.reduce((sum, option) => sum + option.price, 0)) * line.quantity}</span>
                      </div>
                    </div>
                  </div>
                  <textarea
                    value={line.specialNotes}
                    onChange={(event) => updateCart(cart.map((item, itemIndex) => itemIndex === index ? { ...item, specialNotes: event.target.value } : item))}
                    maxLength={250}
                    placeholder="หมายเหตุ เช่น ไม่ใส่ผัก"
                    rows={1}
                    className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-electric-500"
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <button onClick={() => updateCart(cart.filter((_, itemIndex) => itemIndex !== index))} className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                      <Trash2 className="h-3.5 w-3.5" /> ลบ
                    </button>
                    <div className="flex items-center gap-4">
                      <button onClick={() => updateCart(cart.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item))} aria-label="ลดจำนวน" className="rounded-lg border p-1.5"><Minus className="h-4 w-4" /></button>
                      <span className="text-sm font-bold">{line.quantity}</span>
                      <button onClick={() => updateCart(cart.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: Math.min(99, item.quantity + 1) } : item))} aria-label="เพิ่มจำนวน" className="rounded-lg border p-1.5"><Plus className="h-4 w-4" /></button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {unavailable.length > 0 && <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">มีรายการหรือตัวเลือกหมดชั่วคราว กรุณาแก้ไขตะกร้าก่อนสั่ง</div>}
            {!context?.branch.isOpen && <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">ร้านปิดให้บริการ · เวลา {context?.branch.openingHours}</div>}

            <section className="mt-5 rounded-2xl border border-slate-100 bg-white p-4">
              <h2 className="text-sm font-bold">โปรโมชั่น / โค้ดส่วนลด</h2>
              <div className="mt-2 flex gap-2">
                <input value={discountCode} onChange={(event) => setDiscountCode(event.target.value.toUpperCase())} placeholder="กรอกโค้ดส่วนลด" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <button onClick={validateDiscount} className="rounded-xl bg-navy-900 px-4 text-xs font-bold text-white">ใช้โค้ด</button>
              </div>
              {discountMessage && <p className="mt-2 text-xs text-slate-600">{discountMessage}</p>}
            </section>

            <section className="mt-4 space-y-3 rounded-2xl border border-slate-100 bg-white p-4">
              <label className="block text-xs font-semibold">ชื่อผู้สั่ง (ไม่บังคับ)<input value={customerName} onChange={(event) => setCustomerName(event.target.value)} maxLength={100} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal" placeholder="ชื่อลูกค้า" /></label>
              <label className="block text-xs font-semibold">หมายเหตุเพิ่มเติม<textarea value={orderNotes} onChange={(event) => setOrderNotes(event.target.value)} maxLength={500} rows={2} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal" placeholder="เช่น เสิร์ฟพร้อมกัน" /></label>
              <div className="space-y-2 border-t border-slate-100 pt-3 text-sm">
                <p className="flex justify-between"><span>Subtotal</span><span>฿{subtotal.toLocaleString()}</span></p>
                <p className="flex justify-between text-emerald-700"><span>Discount</span><span>-฿{discountAmount.toLocaleString()}</span></p>
                <p className="flex justify-between text-xs text-slate-500"><span>Service charge / Tax</span><span>฿0</span></p>
                <p className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold"><span>TOTAL</span><span className="text-electric-700">฿{total.toLocaleString()}</span></p>
              </div>
            </section>

            <button onClick={submitOrder} disabled={submitting || unavailable.length > 0 || !context?.branch.isOpen} className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-electric-600 px-5 text-sm font-bold text-white shadow-lg shadow-electric-600/25 disabled:cursor-not-allowed disabled:bg-slate-300">
              <ShoppingBag className="h-5 w-5" /> {submitting ? "กำลังส่งออเดอร์..." : "ยืนยันการสั่งอาหาร"}
            </button>
          </>
        )}
      </main>
    </CustomerMenuShell>
  );
}
