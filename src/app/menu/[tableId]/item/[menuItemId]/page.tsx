"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Minus, Plus, UtensilsCrossed } from "lucide-react";
import { CustomerMenuShell } from "@/components/CustomerMenuShell";
import {
  readCustomerCart,
  writeCustomerCart,
  type CustomerCartItem,
  type CustomerCartOption,
} from "@/lib/customer-cart";

interface MenuDetail {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  isAvailable: boolean;
  availableNow: boolean;
  category: { name: string };
  options: (CustomerCartOption & { selectionMode: string })[];
}

const placeholderImage = "/menu-items/food-placeholder.svg";

export default function CustomerMenuItemPage() {
  const params = useParams<{ tableId: string; menuItemId: string }>();
  const searchParams = useSearchParams();
  const qrToken = searchParams.get("qr") || "";
  const [item, setItem] = useState<MenuDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [added, setAdded] = useState(false);
  const [restaurantName, setRestaurantName] = useState("ร้านอาหาร");
  const [tableNumber, setTableNumber] = useState(params.tableId);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(
          `/api/customer/menu/${encodeURIComponent(params.tableId)}/${encodeURIComponent(params.menuItemId)}?qr=${encodeURIComponent(qrToken)}`
        );
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || "ไม่สามารถโหลดเมนูได้");
        if (!cancelled) {
          setItem(result.data.item);
          setRestaurantName(result.data.restaurantName);
          setTableNumber(result.data.tableNumber);
          setIsOpen(result.data.isOpen);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "ไม่สามารถโหลดเมนูได้");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [params.menuItemId, params.tableId, qrToken]);

  const selectedOptions = useMemo(
    () => item?.options.filter((option) => selected[option.id]) || [],
    [item, selected]
  );
  const total = (item?.price || 0) + selectedOptions.reduce((sum, option) => sum + option.price, 0);
  const query = `?qr=${encodeURIComponent(qrToken)}`;
  const groups = useMemo(
    () => [...new Set(item?.options.map((option) => option.groupName) || [])],
    [item]
  );

  const toggleOption = (option: MenuDetail["options"][number]) => {
    setSelected((current) => {
      const next = { ...current };
      if (option.selectionMode === "SINGLE") {
        item?.options
          .filter((candidate) => candidate.groupName === option.groupName)
          .forEach((candidate) => delete next[candidate.id]);
      }
      if (current[option.id] && option.selectionMode !== "SINGLE") delete next[option.id];
      else next[option.id] = true;
      return next;
    });
  };

  const addToCart = () => {
    if (!item) return;
    const cart = readCustomerCart(params.tableId);
    const optionIds = selectedOptions.map((option) => option.id).sort().join(",");
    const existingIndex = cart.findIndex(
      (line) =>
        line.menuItemId === item.id &&
        line.selectedOptions.map((option) => option.id).sort().join(",") === optionIds &&
        line.specialNotes === notes.trim()
    );
    if (existingIndex >= 0) {
      cart[existingIndex] = { ...cart[existingIndex], quantity: cart[existingIndex].quantity + quantity };
    } else {
      const options: CustomerCartOption[] = selectedOptions.map(({ id, groupName, name, price }) => ({
        id,
        groupName,
        name,
        price,
      }));
      const line: CustomerCartItem = {
        menuItemId: item.id,
        name: item.name,
        description: item.description,
        imageUrl: item.imageUrl,
        basePrice: item.price,
        quantity,
        specialNotes: notes.trim(),
        selectedOptions: options,
      };
      cart.push(line);
    }
    writeCustomerCart(params.tableId, cart);
    setAdded(true);
  };

  return (
    <CustomerMenuShell
      tableRef={params.tableId}
      qrToken={qrToken}
      tableNumber={tableNumber}
      restaurantName={restaurantName}
    >
      <main className="min-h-screen px-4 pb-32 pt-4">
        <Link href={`/menu/${encodeURIComponent(params.tableId)}${query}`} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
          <ArrowLeft className="h-4 w-4" /> กลับไปหน้าเมนู
        </Link>
        {loading ? (
          <div className="space-y-4">
            <div className="aspect-[4/3] animate-pulse rounded-3xl bg-slate-100" />
            <div className="h-8 animate-pulse rounded bg-slate-100" />
            <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{error}</div>
        ) : item ? (
          <article>
            <img
              src={item.imageUrl || placeholderImage}
              alt={item.name}
              className="aspect-[4/3] w-full rounded-3xl bg-slate-100 object-cover"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = placeholderImage;
              }}
            />
            <div className="py-5">
              <p className="text-xs font-semibold text-electric-600">{item.category.name}</p>
              <h1 className="mt-1 text-2xl font-bold">{item.name}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description || "ปรุงสดใหม่จากวัตถุดิบคุณภาพ"}</p>
              <p className="mt-4 text-xl font-bold text-electric-700">฿{item.price.toLocaleString()}</p>
            </div>

            {groups.map((group) => (
              <section key={group} className="mb-4 rounded-2xl border border-slate-100 bg-white p-4">
                <h2 className="mb-3 text-sm font-bold">{group}</h2>
                <div className="space-y-2">
                  {item.options
                    .filter((option) => option.groupName === group)
                    .map((option) => (
                      <label key={option.id} className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 p-3">
                        <input
                          type={option.selectionMode === "SINGLE" ? "radio" : "checkbox"}
                          name={option.selectionMode === "SINGLE" ? group : option.id}
                          checked={!!selected[option.id]}
                          onChange={() => toggleOption(option)}
                          className="h-4 w-4 accent-blue-600"
                        />
                        <span className="flex-1 text-sm">{option.name}</span>
                        <span className="text-xs font-semibold text-slate-600">
                          {option.price > 0 ? `+฿${option.price}` : "ไม่เพิ่มราคา"}
                        </span>
                      </label>
                    ))}
                </div>
              </section>
            ))}

            <label className="block rounded-2xl border border-slate-100 bg-white p-4">
              <span className="mb-2 block text-sm font-bold">หมายเหตุพิเศษ</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={250}
                placeholder="เช่น ไม่ใส่ผัก"
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-electric-500"
              />
            </label>

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4">
              <span className="text-sm font-semibold">จำนวน</span>
              <div className="flex items-center gap-4">
                <button onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="rounded-xl border p-2" aria-label="ลดจำนวน"><Minus className="h-4 w-4" /></button>
                <span className="min-w-4 text-center font-bold">{quantity}</span>
                <button onClick={() => setQuantity((value) => Math.min(99, value + 1))} className="rounded-xl border p-2" aria-label="เพิ่มจำนวน"><Plus className="h-4 w-4" /></button>
              </div>
            </div>

            {added && (
              <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-center text-xs font-semibold text-emerald-700">
                เพิ่มลงตะกร้าแล้ว
              </p>
            )}
            <button
              onClick={addToCart}
              disabled={!item.availableNow || !isOpen}
              className="mt-4 flex min-h-14 w-full items-center justify-between rounded-2xl bg-electric-600 px-5 text-sm font-bold text-white shadow-lg shadow-electric-600/25 disabled:bg-slate-300"
            >
              <span className="flex items-center gap-2"><UtensilsCrossed className="h-4 w-4" /> เพิ่มลงตะกร้า</span>
              <span>฿{(total * quantity).toLocaleString()}</span>
            </button>
          </article>
        ) : null}
      </main>
    </CustomerMenuShell>
  );
}
