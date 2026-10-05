"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ClipboardList, Home, ShoppingCart, UtensilsCrossed, UserRound } from "lucide-react";
import {
  customerCartTotal,
  readCustomerCart,
  type CustomerCartItem,
} from "@/lib/customer-cart";

interface CustomerMenuShellProps {
  tableRef: string;
  qrToken: string;
  tableNumber: string;
  restaurantName: string;
  children: React.ReactNode;
}

export function CustomerMenuShell({
  tableRef,
  qrToken,
  tableNumber,
  restaurantName,
  children,
}: CustomerMenuShellProps) {
  const pathname = usePathname();
  const [cart, setCart] = useState<CustomerCartItem[]>([]);
  const query = `?qr=${encodeURIComponent(qrToken)}`;
  const root = `/menu/${encodeURIComponent(tableRef)}`;
  const cartHref = `${root}/cart${query}`;

  useEffect(() => {
    const update = () => setCart(readCustomerCart(tableRef));
    update();
    window.addEventListener("customer-cart-updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("customer-cart-updated", update);
      window.removeEventListener("storage", update);
    };
  }, [tableRef]);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = customerCartTotal(cart);
  const navItems = [
    { label: "หน้าแรก", href: root + query, icon: Home },
    { label: "เมนู", href: root + query, icon: UtensilsCrossed },
    { label: "ตะกร้า", href: cartHref, icon: ShoppingCart },
    { label: "รายการสั่ง", href: `${root}/orders${query}`, icon: ClipboardList },
    { label: "บัญชี", href: "/customer-menu", icon: UserRound },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-navy-900">
      <div className="mx-auto min-h-screen max-w-2xl bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="mx-auto flex max-w-xl items-center justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{restaurantName}</p>
              <p className="text-xs text-slate-500">โต๊ะ {tableNumber} · สั่งอาหารได้เลย</p>
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
              รับออเดอร์
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-xl">{children}</div>
      </div>

      {itemCount > 0 && pathname !== `${root}/cart` && (
        <div className="fixed bottom-[76px] left-0 right-0 z-30 mx-auto max-w-xl px-4">
          <Link
            href={cartHref}
            className="flex min-h-14 items-center justify-between rounded-2xl bg-electric-600 px-5 text-white shadow-xl shadow-electric-600/30 transition hover:bg-electric-700 active:scale-[0.99]"
          >
            <span className="flex items-center gap-2 text-sm font-bold">
              <ShoppingCart className="h-5 w-5" />
              ดูตะกร้า <span className="rounded-full bg-white px-2 py-0.5 text-xs text-electric-700">{itemCount}</span>
            </span>
            <span className="text-sm font-bold">฿{total.toLocaleString()}</span>
          </Link>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto grid max-w-xl grid-cols-5">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive = label === "หน้าแรก" || href.includes(pathname);
            return (
              <Link
                key={label}
                href={href}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-medium ${
                  isActive ? "text-electric-600" : "text-slate-500"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
